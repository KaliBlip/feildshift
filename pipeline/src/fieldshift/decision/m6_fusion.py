"""M6 Decision Fusion: combine seasonal EO features, M1-M4 analytics, and agronomic priors."""
from __future__ import annotations

from typing import Any, Sequence

import numpy as np
import pandas as pd

SCORING_CRITERIA: tuple[str, ...] = (
    "Water efficiency",
    "Soil health",
    "Erosion protection",
    "Income and market",
)
DEFAULT_WEIGHTS: tuple[float, float, float, float] = (0.25, 0.25, 0.25, 0.25)


def _clip01(value: float) -> float:
    return float(max(0.02, min(0.98, value)))


def _split_semicolon_items(raw: Any) -> list[str]:
    if raw is None or (isinstance(raw, float) and np.isnan(raw)):
        return []
    text = str(raw).strip()
    if not text:
        return []
    parts = [part.strip().rstrip(".") for part in text.split(";") if part.strip()]
    return [f"{p}." for p in parts]


def base_scores(scores: np.ndarray | Sequence[Sequence[float]], weights: np.ndarray | Sequence[float]) -> np.ndarray:
    """Compute weighted-sum MCDA base scores matching ``apps/api/scoring.py``."""
    score_arr = np.asarray(scores, dtype=float)
    w = np.asarray(weights, dtype=float)
    if w.ndim != 1 or score_arr.ndim != 2 or score_arr.shape[1] != w.shape[0]:
        raise ValueError("scores must have shape (n_strategies, n_criteria) matching weights")
    if np.any(w < 0) or float(w.sum()) <= 0.0:
        raise ValueError("Weights must be non-negative and sum to > 0")
    w_norm = w / w.sum()
    return score_arr @ w_norm


def rank_probabilities(
    scores: np.ndarray | Sequence[Sequence[float]] | Sequence[float],
    weights: np.ndarray | Sequence[float],
    score_uncertainty: np.ndarray | Sequence[Sequence[float]] | float = 0.1,
    weight_uncertainty: float = 0.1,
    runs: int = 2000,
    seed: int = 42,
) -> dict[str, list[float]]:
    """Run Monte Carlo perturbation around scores and weights to estimate rank stability."""
    score_arr = np.asarray(scores, dtype=float)
    w = np.asarray(weights, dtype=float)
    n_strategies, n_criteria = score_arr.shape
    w_norm = w / w.sum()

    base = base_scores(score_arr, w_norm)
    rng = np.random.default_rng(seed)
    first_counts = np.zeros(n_strategies, dtype=int)
    rank_sums = np.zeros(n_strategies, dtype=float)

    score_sigma = np.asarray(score_uncertainty, dtype=float)

    for _ in range(runs):
        s_sample = np.clip(score_arr + rng.normal(0.0, score_sigma, size=score_arr.shape), 0.0, 1.0)
        w_sample = np.maximum(0.001, w_norm + rng.normal(0.0, weight_uncertainty, size=n_criteria))
        w_sample = w_sample / w_sample.sum()
        totals = s_sample @ w_sample
        order = np.argsort(-totals)
        first_counts[order[0]] += 1
        ranks = np.empty(n_strategies, dtype=float)
        ranks[order] = np.arange(1, n_strategies + 1, dtype=float)
        rank_sums += ranks

    return {
        "base_scores": [float(v) for v in base],
        "prob_first": [float(v) for v in (first_counts / float(runs))],
        "mean_rank": [float(v) for v in (rank_sums / float(runs))],
    }


def _extract_cell_climate_summary(cell_features_df: pd.DataFrame) -> dict[str, float]:
    """Summarize major/minor rainfall, dry spells, erosion exposure, and M1/M4 signals."""
    if cell_features_df.empty:
        return {
            "major_rain_mm": 760.0,
            "minor_rain_mm": 420.0,
            "minor_dry_spell_days": 14.0,
            "major_heat_days": 12.0,
            "mean_erosion_exposure": 0.40,
            "bare_period_fraction": 0.25,
            "mean_sm_z": 0.0,
            "anomaly_rate": 0.0,
            "rain_trend_mm_yr": 0.0,
        }

    major = cell_features_df[cell_features_df["season"] == "major"]
    minor = cell_features_df[cell_features_df["season"] == "minor"]
    major_src = major if not major.empty else cell_features_df
    minor_src = minor if not minor.empty else cell_features_df

    anomaly_rate = (
        float(cell_features_df["is_anomaly"].astype(float).mean())
        if "is_anomaly" in cell_features_df.columns
        else 0.0
    )
    rain_trend = (
        float(minor_src["trend_sen_slope_mm_yr"].mean())
        if "trend_sen_slope_mm_yr" in minor_src.columns
        else 0.0
    )

    return {
        "major_rain_mm": float(major_src["total_rain_mm"].median()),
        "minor_rain_mm": float(minor_src["total_rain_mm"].median()),
        "minor_dry_spell_days": float(minor_src["longest_dry_spell_days"].max()),
        "major_heat_days": float(major_src["heat_stress_days"].mean()),
        "mean_erosion_exposure": float(cell_features_df["erosion_exposure_index"].mean()),
        "bare_period_fraction": float(cell_features_df["bare_period_fraction"].mean()),
        "mean_sm_z": float(cell_features_df["mean_sm_anomaly_z"].mean()),
        "anomaly_rate": anomaly_rate,
        "rain_trend_mm_yr": rain_trend,
    }


def _score_single_strategy(
    row: pd.Series,
    crops_by_code: dict[str, dict[str, Any]],
    climate: dict[str, float],
    slope_pct: float,
    soil_ph: float | None,
) -> tuple[list[float], list[float], list[str], list[str], list[str]]:
    major_crop = crops_by_code.get(str(row["major_crop"]), {})
    minor_crop = crops_by_code.get(str(row["minor_crop"]), {})

    minor_need = float(minor_crop.get("water_need_mm_min", 400.0))
    minor_drought_tol = str(minor_crop.get("drought_tolerance", "moderate")).lower()
    minor_dekads = float(minor_crop.get("cycle_dekads", 9.0))
    n_fix = float(minor_crop.get("n_fixation_kg_ha", 0.0))
    cover_rating = float(minor_crop.get("erosion_cover_rating", 0.5))
    offseason = str(row.get("offseason_cover", "none")).lower()

    # 1. Water efficiency: penalize long dry spells & cycle overrun vs available minor rain
    rain_margin = (climate["minor_rain_mm"] - minor_need) / max(minor_need, 1.0)
    dry_penalty = max(0.0, climate["minor_dry_spell_days"] - 11.0) * (
        0.008 if minor_drought_tol == "high" else 0.018
    )
    cycle_penalty = 0.04 if minor_dekads >= 11.0 and climate["minor_rain_mm"] < 460.0 else 0.0
    trend_adj = -0.03 if (climate["rain_trend_mm_yr"] < -15.0 and minor_drought_tol != "high") else 0.0
    heat_adj = -0.025 if (climate["major_heat_days"] > 18.0 and str(major_crop.get("drought_tolerance")) != "high") else 0.0
    water_score = _clip01(
        float(row["water_efficiency_prior"]) + 0.08 * np.clip(rain_margin, -0.5, 0.5) - dry_penalty - cycle_penalty + trend_adj + heat_adj
    )

    # 2. Soil health: reward biological N fixation + residue mulch, check pH fit
    n_bonus = 0.05 * min(1.0, n_fix / 80.0)
    mulch_bonus = 0.03 if offseason in {"stover_mulch", "mucuna_residue"} else -0.05
    ph_adj = 0.0
    if soil_ph is not None:
        opt_min = float(minor_crop.get("optimal_ph_min", 5.5))
        opt_max = float(minor_crop.get("optimal_ph_max", 7.0))
        if soil_ph < opt_min:
            ph_adj = -0.05 * min(1.5, opt_min - soil_ph)
        elif soil_ph > opt_max:
            ph_adj = -0.04 * min(1.5, soil_ph - opt_max)
    soil_score = _clip01(float(row["soil_health_prior"]) + n_bonus + mulch_bonus + ph_adj)

    # 3. Erosion protection: account for terrain slope vs recommended max & bare exposure
    max_slope = float(row.get("max_slope_recommended_pct", 8.0))
    slope_excess = max(0.0, slope_pct - max_slope)
    slope_penalty = min(0.18, 0.025 * slope_excess)
    exposure_adj = (0.55 - climate["mean_erosion_exposure"]) * (0.06 if cover_rating >= 0.70 else -0.06)
    residue_adj = 0.04 if offseason == "mucuna_residue" else (0.02 if offseason == "stover_mulch" else -0.04)
    erosion_score = _clip01(float(row["erosion_protection_prior"]) - slope_penalty + exposure_adj + residue_adj)

    # 4. Income & market: reflect Ashanti demand minus climate/review risk discount
    demand = str(minor_crop.get("market_demand_ashanti", "high")).lower()
    demand_adj = 0.02 if demand == "high" else (-0.03 if demand == "low_direct" else 0.0)
    review_status = str(row.get("expert_review_status", "literature_cited"))
    income_score = _clip01(float(row["income_market_prior"]) + demand_adj - 0.5 * dry_penalty)

    scores = [round(water_score, 4), round(soil_score, 4), round(erosion_score, 4), round(income_score, 4)]

    # Per-criterion MCDA uncertainty scales with review status and anomaly rate
    base_unc = 0.085 if review_status == "literature_cited" else 0.125
    anom_add = min(0.04, 0.08 * climate["anomaly_rate"])
    uncertainties = [
        round(base_unc + anom_add + 0.015, 4),
        round(base_unc + (0.025 if soil_ph is None else 0.01), 4),
        round(base_unc + 0.01 + (0.02 if slope_excess > 0 else 0.0), 4),
        round(base_unc + 0.035 + anom_add, 4),
    ]

    benefits = [
        str(row["agronomic_rationale"]).strip(),
        (
            f"Fixes ~{int(n_fix)} kg N/ha and maintains {offseason.replace('_', ' ')} cover."
            if n_fix > 0
            else f"Relies on {offseason.replace('_', ' ')} surface management with zero synthetic N offset."
        ),
    ]
    gaps = [
        "No plot-level lab soil organic carbon or lime/calcium assay loaded; ISRIC SoilGrids is a 250 m model estimate.",
        "Local farmgate price volatility and labour hours during planting window require farmer verification.",
    ]
    if climate["rain_trend_mm_yr"] < -10.0:
        gaps.append("Observed negative rainfall Sen slope increases urgency for in-situ rain-gauge comparison.")
    if slope_excess > 0:
        gaps.append(
            f"Estimated cell slope ({slope_pct:.1f}%) exceeds guideline ceiling ({max_slope:.1f}%) for this sequence."
        )

    risks = _split_semicolon_items(row.get("key_risks"))
    if review_status != "literature_cited":
        risks.append(f"Agronomic prior status is '{review_status}'; confirm with Ashanti extension agronomist.")

    return scores, uncertainties, benefits, gaps, risks


def score_strategies_for_cell(
    cell_id: str,
    cell_features_df: pd.DataFrame,
    crops_df: pd.DataFrame,
    rotations_df: pd.DataFrame,
    slope_pct: float = 5.4,
    soil_ph: float | None = None,
    weights: Sequence[float] = DEFAULT_WEIGHTS,
    runs: int = 2000,
    seed: int = 42,
) -> list[dict[str, Any]]:
    """Fuse seasonal climate metrics, knowledge priors, and MCDA ranking for one grid cell."""
    if rotations_df.empty:
        raise ValueError("rotations_df must contain at least one strategy row")

    crops_by_code = {
        str(rec["crop_code"]): dict(rec)
        for rec in crops_df.to_dict(orient="records")
    }
    climate = _extract_cell_climate_summary(cell_features_df)

    rows_meta: list[dict[str, Any]] = []
    score_matrix: list[list[float]] = []
    unc_matrix: list[list[float]] = []

    for _, row in rotations_df.iterrows():
        c_scores, c_uncs, benefits, gaps, risks = _score_single_strategy(
            row=row,
            crops_by_code=crops_by_code,
            climate=climate,
            slope_pct=slope_pct,
            soil_ph=soil_ph,
        )
        score_matrix.append(c_scores)
        unc_matrix.append(c_uncs)
        rows_meta.append(
            {
                "strategy_code": str(row["strategy_code"]),
                "strategy_name": str(row["strategy_name"]),
                "rotation_sequence": str(row["rotation_sequence"]),
                "is_baseline": str(row["is_baseline"]).strip().lower() == "true"
                if isinstance(row["is_baseline"], str)
                else bool(row["is_baseline"]),
                "expected_benefits": benefits,
                "information_gaps": gaps,
                "risks_needing_review": risks,
            }
        )

    w_arr = np.asarray(weights, dtype=float)
    w_norm = [round(float(v), 4) for v in (w_arr / w_arr.sum())]
    mc = rank_probabilities(
        scores=np.asarray(score_matrix, dtype=float),
        weights=w_arr,
        score_uncertainty=np.asarray(unc_matrix, dtype=float),
        weight_uncertainty=0.1,
        runs=runs,
        seed=seed,
    )

    records: list[dict[str, Any]] = []
    for idx, meta in enumerate(rows_meta):
        records.append(
            {
                "cell_id": cell_id,
                "strategy_code": meta["strategy_code"],
                "strategy_name": meta["strategy_name"],
                "rotation_sequence": meta["rotation_sequence"],
                "is_baseline": meta["is_baseline"],
                "criteria": list(SCORING_CRITERIA),
                "criterion_scores": score_matrix[idx],
                "score_uncertainties": unc_matrix[idx],
                "default_weights": w_norm,
                "default_base_score": round(mc["base_scores"][idx], 6),
                "default_prob_first": round(mc["prob_first"][idx], 4),
                "default_mean_rank": round(mc["mean_rank"][idx], 4),
                "expected_benefits": meta["expected_benefits"],
                "information_gaps": meta["information_gaps"],
                "risks_needing_review": meta["risks_needing_review"],
                "passport_id": None,
            }
        )

    records.sort(key=lambda r: float(r["default_base_score"]), reverse=True)
    return records
