"""Phase 5 temporal cross-validation, rainfall cross-check, and M2 bootstrap stability."""
from __future__ import annotations

from typing import Any, Sequence

import numpy as np
import pandas as pd

from fieldshift.models.anomaly import detect_season_anomalies
from fieldshift.models.clustering import (
    DEFAULT_CLUSTER_FEATURES,
    cluster_seasons_and_analogs,
)


def evaluate_rainfall_source_agreement(cube_df: pd.DataFrame) -> dict[str, float | int]:
    """Compute correlation, MAE, and relative bias between GPM IMERG and ERA5 rainfall dekads."""
    if cube_df.empty:
        return {"n_pairs": 0, "pearson_r": 0.0, "mae_mm": 0.0, "bias_pct": 0.0}

    valid = cube_df[["rain_imerg_mm", "rain_era5_mm"]].dropna()
    if len(valid) < 3:
        return {"n_pairs": int(len(valid)), "pearson_r": 0.0, "mae_mm": 0.0, "bias_pct": 0.0}

    imerg = valid["rain_imerg_mm"].to_numpy(dtype=float)
    era5 = valid["rain_era5_mm"].to_numpy(dtype=float)

    std_i = float(np.std(imerg))
    std_e = float(np.std(era5))
    r = float(np.corrcoef(imerg, era5)[0, 1]) if std_i > 1e-8 and std_e > 1e-8 else 0.0
    mae = float(np.mean(np.abs(imerg - era5)))
    mean_e = float(np.mean(era5))
    bias_pct = ((float(np.mean(imerg)) - mean_e) / mean_e * 100.0) if abs(mean_e) > 1e-6 else 0.0

    return {
        "n_pairs": int(len(valid)),
        "pearson_r": round(r, 4),
        "mae_mm": round(mae, 2),
        "bias_pct": round(bias_pct, 2),
    }


def evaluate_leave_one_year_out(features_df: pd.DataFrame) -> dict[str, Any]:
    """Measure M1 anomaly score sensitivity and M2 cluster consistency when holding out each year."""
    if features_df.empty or features_df["year"].nunique() < 2:
        return {"years_tested": 0, "mean_anomaly_score_shift": 0.0, "cluster_label_agreement": 1.0}

    full_anom = detect_season_anomalies(features_df)
    full_clust = cluster_seasons_and_analogs(features_df)

    years = sorted({int(y) for y in features_df["year"].tolist()})
    score_shifts: list[float] = []
    agreements: list[float] = []

    for held_out in years:
        train = features_df[features_df["year"] != held_out].copy()
        if len(train) < 4:
            continue
        sub_anom = detect_season_anomalies(train)
        merged_a = sub_anom.merge(
            full_anom[["cell_id", "year", "season", "anomaly_score_m1"]],
            on=["cell_id", "year", "season"],
            suffixes=("_loyo", "_full"),
        )
        if not merged_a.empty:
            shift = np.abs(merged_a["anomaly_score_m1_loyo"] - merged_a["anomaly_score_m1_full"])
            score_shifts.append(float(np.mean(shift)))

        sub_clust = cluster_seasons_and_analogs(train)
        merged_c = sub_clust.merge(
            full_clust[["cell_id", "year", "season", "cluster_label_m2"]],
            on=["cell_id", "year", "season"],
            suffixes=("_loyo", "_full"),
        )
        if not merged_c.empty:
            match_rate = np.mean(
                merged_c["cluster_label_m2_loyo"] == merged_c["cluster_label_m2_full"]
            )
            agreements.append(float(match_rate))

    return {
        "years_tested": len(score_shifts),
        "mean_anomaly_score_shift": round(float(np.mean(score_shifts)), 4) if score_shifts else 0.0,
        "cluster_label_agreement": round(float(np.mean(agreements)), 4) if agreements else 1.0,
    }


def evaluate_cluster_bootstrap_stability(
    features_df: pd.DataFrame,
    feature_cols: Sequence[str] = DEFAULT_CLUSTER_FEATURES,
    n_bootstrap: int = 25,
    seed: int = 42,
) -> dict[str, float | int]:
    """Estimate M2 cluster assignment stability across bootstrap resamples."""
    if features_df.empty or len(features_df) < 4:
        return {"n_bootstrap": 0, "mean_stability": 1.0}

    rng = np.random.default_rng(seed)
    ref = cluster_seasons_and_analogs(features_df, feature_cols=feature_cols)
    ref_labels = ref.set_index(["cell_id", "year", "season"])["cluster_label_m2"]

    matches: list[float] = []
    n_rows = len(features_df)
    for _ in range(n_bootstrap):
        sample_idx = rng.integers(0, n_rows, size=n_rows)
        boot_df = features_df.iloc[np.unique(sample_idx)].copy()
        if len(boot_df) < 4:
            continue
        boot_out = cluster_seasons_and_analogs(boot_df, feature_cols=feature_cols)
        for _, row in boot_out.iterrows():
            key = (row["cell_id"], int(row["year"]), row["season"])
            if key in ref_labels.index:
                matches.append(float(row["cluster_label_m2"] == ref_labels.loc[key]))

    return {
        "n_bootstrap": int(n_bootstrap),
        "mean_stability": round(float(np.mean(matches)), 4) if matches else 1.0,
    }
