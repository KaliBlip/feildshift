"""M8: Controlled Normal-conjugate Bayesian calibration from verified outcome reports."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Sequence

import numpy as np

from fieldshift.decision.m6_fusion import DEFAULT_WEIGHTS, rank_probabilities

VERIFIED_GRADES = frozenset({"officer_reviewed", "expert_validated"})


def _outcome_to_criterion_observations(report: dict[str, Any]) -> tuple[list[float], float]:
    """Translate structured graded field observations into [0..1] criterion targets & obs sigma."""
    grade = str(report.get("evidence_grade", "")).lower()
    obs_sigma = 0.08 if grade == "expert_validated" else 0.12

    summary = str(report.get("outcome_summary", "")).lower()
    water_obs = str(report.get("water_stress_observed", "")).lower()
    soil_obs = str(report.get("soil_cover_observed", "")).lower()

    # Conservative empirical mapping centered around neutral 0.55..0.80
    water_score = 0.78 if any(k in water_obs for k in ("none", "low", "adequate", "optimal")) else (
        0.40 if any(k in water_obs for k in ("severe", "high", "drought", "wilt")) else 0.62
    )
    soil_score = 0.80 if any(k in soil_obs for k in ("dense", "good", "mulch", "full")) else (
        0.42 if any(k in soil_obs for k in ("bare", "poor", "eroded")) else 0.65
    )
    erosion_score = 0.80 if "no erosion" in summary or "good" in soil_obs else (
        0.42 if "erosion" in summary or "gully" in summary else 0.65
    )
    income_score = 0.78 if any(k in summary for k in ("above", "strong", "good yield", "profit")) else (
        0.45 if any(k in summary for k in ("loss", "poor", "failed", "low yield")) else 0.62
    )
    return [water_score, soil_score, erosion_score, income_score], obs_sigma


def calibrate_strategy_scores_with_feedback(
    strategy_records: Sequence[dict[str, Any]],
    outcome_reports: Sequence[dict[str, Any]],
    weights: Sequence[float] = DEFAULT_WEIGHTS,
    runs: int = 1000,
    seed: int = 42,
) -> dict[str, Any]:
    """Update strategy scores & shrink uncertainties ONLY from officer/expert-verified reports.

    Mirrors Supabase RLS policy on ``outcome_reports``: only rows with
    ``eligible_for_model_update=True`` and ``evidence_grade`` in
    ``('officer_reviewed', 'expert_validated')`` update posteriors; unverified
    or confounded reports are counted and ignored.
    """
    calibrated = [deepcopy(dict(rec)) for rec in strategy_records]
    by_code = {str(rec["strategy_code"]): rec for rec in calibrated}

    verified_used = 0
    ignored_unverified = 0
    per_strategy_updates: dict[str, int] = {}

    for report in outcome_reports:
        eligible = bool(report.get("eligible_for_model_update", False))
        grade = str(report.get("evidence_grade", "farmer_reported")).lower()
        code = str(report.get("strategy_code", "")).strip()

        if not eligible or grade not in VERIFIED_GRADES or code not in by_code:
            ignored_unverified += 1
            continue

        obs_vals, obs_sigma = _outcome_to_criterion_observations(report)
        obs_var = obs_sigma**2

        rec = by_code[code]
        prior_means = list(rec["criterion_scores"])
        prior_sigmas = list(rec["score_uncertainties"])
        post_means: list[float] = []
        post_sigmas: list[float] = []

        for mu_0, sig_0, y in zip(prior_means, prior_sigmas, obs_vals):
            var_0 = max(1e-4, float(sig_0) ** 2)
            var_post = 1.0 / ((1.0 / var_0) + (1.0 / obs_var))
            mu_post = var_post * ((float(mu_0) / var_0) + (float(y) / obs_var))
            post_means.append(round(float(np.clip(mu_post, 0.02, 0.98)), 4))
            post_sigmas.append(round(float(np.clip(np.sqrt(var_post), 0.04, 0.25)), 4))

        rec["criterion_scores"] = post_means
        rec["score_uncertainties"] = post_sigmas
        verified_used += 1
        per_strategy_updates[code] = per_strategy_updates.get(code, 0) + 1

    if calibrated:
        score_mat = np.asarray([rec["criterion_scores"] for rec in calibrated], dtype=float)
        unc_mat = np.asarray([rec["score_uncertainties"] for rec in calibrated], dtype=float)
        mc = rank_probabilities(
            scores=score_mat,
            weights=np.asarray(weights, dtype=float),
            score_uncertainty=unc_mat,
            weight_uncertainty=0.1,
            runs=runs,
            seed=seed,
        )
        for idx, rec in enumerate(calibrated):
            rec["default_base_score"] = round(mc["base_scores"][idx], 6)
            rec["default_prob_first"] = round(mc["prob_first"][idx], 4)
            rec["default_mean_rank"] = round(mc["mean_rank"][idx], 4)
        calibrated.sort(key=lambda r: float(r["default_base_score"]), reverse=True)

    return {
        "calibrated_strategies": calibrated,
        "verified_reports_applied": verified_used,
        "ignored_unverified_reports": ignored_unverified,
        "updates_by_strategy": per_strategy_updates,
    }
