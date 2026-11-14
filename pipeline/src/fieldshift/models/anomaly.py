"""M1: Unsupervised seasonal anomaly detection (Isolation Forest + z-score baseline)."""
from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

DEFAULT_ANOMALY_FEATURES: tuple[str, ...] = (
    "total_rain_mm",
    "longest_dry_spell_days",
    "heat_stress_days",
    "mean_sm_anomaly_z",
    "bare_period_fraction",
)


def detect_season_anomalies(
    features_df: pd.DataFrame,
    feature_cols: Sequence[str] = DEFAULT_ANOMALY_FEATURES,
    z_threshold: float = 1.75,
    contamination: float = 0.15,
    random_state: int = 42,
) -> pd.DataFrame:
    """Flag unusual hydro-climatic seasons using Isolation Forest plus z-score baseline."""
    if features_df.empty:
        out = features_df.copy()
        out["anomaly_score_m1"] = pd.Series(dtype=float)
        out["is_anomalous_season"] = pd.Series(dtype=bool)
        out["baseline_z_max"] = pd.Series(dtype=float)
        out["anomaly_driver"] = pd.Series(dtype=str)
        return out

    cols = [c for c in feature_cols if c in features_df.columns]
    if not cols:
        raise ValueError("None of the requested anomaly feature columns exist in features_df")

    work = features_df.copy()
    anomaly_scores = np.zeros(len(work), dtype=float)
    is_anomalous = np.zeros(len(work), dtype=bool)
    z_max_vals = np.zeros(len(work), dtype=float)
    drivers = [""] * len(work)

    eff_contamination = float(np.clip(contamination, 0.05, 0.45))

    for _, idx in work.groupby("season", sort=False).groups.items():
        pos = work.index.get_indexer(idx)
        mat = work.loc[idx, cols].to_numpy(dtype=float)
        col_means = np.nanmean(mat, axis=0)
        col_stds = np.nanstd(mat, axis=0)
        safe_stds = np.where(col_stds > 1e-8, col_stds, 1.0)
        z_mat = (np.nan_to_num(mat, nan=col_means) - col_means) / safe_stds
        abs_z = np.abs(z_mat)

        row_z_max = np.max(abs_z, axis=1)
        row_driver_idx = np.argmax(abs_z, axis=1)

        if len(pos) >= 4:
            iso = IsolationForest(
                n_estimators=150,
                contamination=eff_contamination,
                random_state=random_state,
            )
            preds = iso.fit_predict(z_mat)
            # Invert decision_function so higher values indicate stronger anomaly
            raw_outlier = -iso.decision_function(z_mat)
            span = float(np.max(raw_outlier) - np.min(raw_outlier))
            if span > 1e-8:
                iso_norm = (raw_outlier - np.min(raw_outlier)) / span
            else:
                iso_norm = np.zeros_like(raw_outlier)
            iso_flag = preds == -1
        else:
            iso_norm = np.clip(row_z_max / 3.0, 0.0, 1.0)
            iso_flag = np.zeros(len(pos), dtype=bool)

        blended = np.clip(
            0.6 * iso_norm + 0.4 * np.clip(row_z_max / 3.0, 0.0, 1.0), 0.0, 1.0
        )
        flagged = iso_flag | (row_z_max >= z_threshold)

        for local_i, df_pos in enumerate(pos):
            anomaly_scores[df_pos] = round(float(blended[local_i]), 4)
            is_anomalous[df_pos] = bool(flagged[local_i])
            z_max_vals[df_pos] = round(float(row_z_max[local_i]), 3)
            drivers[df_pos] = cols[int(row_driver_idx[local_i])]

    work["anomaly_score_m1"] = anomaly_scores
    work["is_anomalous_season"] = is_anomalous
    work["baseline_z_max"] = z_max_vals
    work["anomaly_driver"] = drivers
    return work
