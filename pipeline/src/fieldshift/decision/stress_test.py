"""Phase 4 climate stress-testing and historical analog replay on top of M6 scoring."""
from __future__ import annotations

from typing import Any, Sequence

import pandas as pd

from fieldshift.decision.m6_fusion import DEFAULT_WEIGHTS, score_strategies_for_cell

DEFAULT_STRESS_PRESETS: tuple[dict[str, Any], ...] = (
    {
        "scenario_id": "baseline",
        "label": "Current Baseline (2022-2025 median)",
        "rain_factor": 1.0,
        "temp_delta_c": 0.0,
        "dry_spell_delta_days": 0,
    },
    {
        "scenario_id": "moderate_drought",
        "label": "Late Onset / Dry Minor Season (-20% rain, +4 dry days)",
        "rain_factor": 0.80,
        "temp_delta_c": 1.0,
        "dry_spell_delta_days": 4,
    },
    {
        "scenario_id": "severe_heat_drought",
        "label": "Severe El Nino Stress (-30% rain, +2.0 C, +7 dry days)",
        "rain_factor": 0.70,
        "temp_delta_c": 2.0,
        "dry_spell_delta_days": 7,
    },
    {
        "scenario_id": "intense_rainfall",
        "label": "Intense Squall / Erosion Year (+20% rain, +15% erosion exposure)",
        "rain_factor": 1.20,
        "temp_delta_c": 0.5,
        "dry_spell_delta_days": 0,
    },
)


def perturb_cell_features(
    cell_features_df: pd.DataFrame,
    rain_factor: float = 1.0,
    temp_delta_c: float = 0.0,
    dry_spell_delta_days: int = 0,
) -> pd.DataFrame:
    """Apply physical climate perturbations to seasonal features for Phase 4 stress testing."""
    if rain_factor <= 0:
        raise ValueError("rain_factor must be positive")

    perturbed = cell_features_df.copy()
    if perturbed.empty:
        return perturbed

    perturbed["total_rain_mm"] = (perturbed["total_rain_mm"].astype(float) * rain_factor).round(2)

    if dry_spell_delta_days != 0:
        perturbed["longest_dry_spell_days"] = (
            perturbed["longest_dry_spell_days"].astype(int) + int(dry_spell_delta_days)
        ).clip(lower=0)
    elif rain_factor < 1.0:
        # Drying scales consecutive dry days upward monotonically
        extra_dry = round((1.0 - rain_factor) * 18.0)
        perturbed["longest_dry_spell_days"] = (
            perturbed["longest_dry_spell_days"].astype(int) + extra_dry
        )

    if temp_delta_c > 0.0:
        extra_heat_days = round(temp_delta_c * 4.5)
        perturbed["heat_stress_days"] = (
            perturbed["heat_stress_days"].astype(int) + extra_heat_days
        ).clip(lower=0)

    if rain_factor > 1.05:
        erosion_scale = 1.0 + 0.75 * (rain_factor - 1.0)
        perturbed["erosion_exposure_index"] = (
            perturbed["erosion_exposure_index"].astype(float) * erosion_scale
        ).clip(0.0, 1.0).round(4)

    return perturbed


def evaluate_climate_stress(
    cell_id: str,
    cell_features_df: pd.DataFrame,
    crops_df: pd.DataFrame,
    rotations_df: pd.DataFrame,
    rain_factor: float = 1.0,
    temp_delta_c: float = 0.0,
    dry_spell_delta_days: int = 0,
    analog_year: int | None = None,
    slope_pct: float = 5.4,
    soil_ph: float | None = None,
    weights: Sequence[float] = DEFAULT_WEIGHTS,
    runs: int = 1000,
    seed: int = 42,
) -> dict[str, Any]:
    """Re-score rotation strategies under climate perturbations or an analog historical year."""
    baseline = score_strategies_for_cell(
        cell_id=cell_id,
        cell_features_df=cell_features_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        slope_pct=slope_pct,
        soil_ph=soil_ph,
        weights=weights,
        runs=runs,
        seed=seed,
    )
    baseline_by_code = {row["strategy_code"]: row for row in baseline}

    src_df = cell_features_df
    if analog_year is not None and not cell_features_df.empty:
        sub = cell_features_df[cell_features_df["year"] == int(analog_year)]
        if not sub.empty:
            src_df = sub

    stressed_df = perturb_cell_features(
        src_df,
        rain_factor=rain_factor,
        temp_delta_c=temp_delta_c,
        dry_spell_delta_days=dry_spell_delta_days,
    )
    stressed = score_strategies_for_cell(
        cell_id=cell_id,
        cell_features_df=stressed_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        slope_pct=slope_pct,
        soil_ph=soil_ph,
        weights=weights,
        runs=runs,
        seed=seed,
    )

    deltas: list[dict[str, Any]] = []
    for idx, row in enumerate(stressed):
        base_row = baseline_by_code.get(row["strategy_code"], {})
        base_score = float(base_row.get("default_base_score", row["default_base_score"]))
        deltas.append(
            {
                "strategy_code": row["strategy_code"],
                "strategy_name": row["strategy_name"],
                "rank": idx + 1,
                "base_score": row["default_base_score"],
                "delta_vs_baseline": round(float(row["default_base_score"]) - base_score, 4),
                "prob_first": row["default_prob_first"],
                "mean_rank": row["default_mean_rank"],
                "criterion_scores": row["criterion_scores"],
            }
        )

    return {
        "cell_id": cell_id,
        "analog_year": analog_year,
        "rain_factor": rain_factor,
        "temp_delta_c": temp_delta_c,
        "dry_spell_delta_days": dry_spell_delta_days,
        "top_strategy_code": stressed[0]["strategy_code"] if stressed else None,
        "baseline_top_strategy_code": baseline[0]["strategy_code"] if baseline else None,
        "rank_flipped": (
            bool(stressed and baseline and stressed[0]["strategy_code"] != baseline[0]["strategy_code"])
        ),
        "strategies": deltas,
    }


def build_climate_stress_presets(
    cell_id: str,
    cell_features_df: pd.DataFrame,
    crops_df: pd.DataFrame,
    rotations_df: pd.DataFrame,
    slope_pct: float = 5.4,
    soil_ph: float | None = None,
    weights: Sequence[float] = DEFAULT_WEIGHTS,
    runs: int = 800,
) -> list[dict[str, Any]]:
    """Precompute standard Phase 4 climate stress scenarios for a pilot cell."""
    outputs: list[dict[str, Any]] = []
    for preset in DEFAULT_STRESS_PRESETS:
        res = evaluate_climate_stress(
            cell_id=cell_id,
            cell_features_df=cell_features_df,
            crops_df=crops_df,
            rotations_df=rotations_df,
            rain_factor=float(preset["rain_factor"]),
            temp_delta_c=float(preset["temp_delta_c"]),
            dry_spell_delta_days=int(preset["dry_spell_delta_days"]),
            slope_pct=slope_pct,
            soil_ph=soil_ph,
            weights=weights,
            runs=runs,
        )
        res["scenario_id"] = preset["scenario_id"]
        res["label"] = preset["label"]
        outputs.append(res)
    return outputs
