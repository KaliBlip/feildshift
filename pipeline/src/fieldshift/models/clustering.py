"""M2: Season-type clustering (K-means) and historical analog season retrieval."""
from __future__ import annotations

from typing import Any, Sequence

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

DEFAULT_CLUSTER_FEATURES: tuple[str, ...] = (
    "total_rain_mm",
    "rain_cv",
    "longest_dry_spell_days",
    "mean_sm_anomaly_z",
    "bare_period_fraction",
)


def _label_clusters_by_hydrology(
    centers_std: np.ndarray,
    feature_names: Sequence[str],
) -> dict[int, tuple[int, str]]:
    """Map raw K-means cluster IDs to ordered IDs and interpretable hydrology labels."""
    idx_map = {name: i for i, name in enumerate(feature_names)}
    scores: list[tuple[int, float]] = []
    for raw_id, center in enumerate(centers_std):
        rain_score = center[idx_map["total_rain_mm"]] if "total_rain_mm" in idx_map else 0.0
        sm_score = (
            center[idx_map["mean_sm_anomaly_z"]] if "mean_sm_anomaly_z" in idx_map else 0.0
        )
        dry_pen = (
            center[idx_map["longest_dry_spell_days"]]
            if "longest_dry_spell_days" in idx_map
            else 0.0
        )
        bare_pen = (
            center[idx_map["bare_period_fraction"]]
            if "bare_period_fraction" in idx_map
            else 0.0
        )
        hydro_vigour = float(rain_score + 0.5 * sm_score - dry_pen - 0.5 * bare_pen)
        scores.append((raw_id, hydro_vigour))

    ordered = sorted(scores, key=lambda pair: pair[1])
    k = len(ordered)
    if k == 1:
        names = ["moderate_variable"]
    elif k == 2:
        names = ["dry_stressed", "wet_vigorous"]
    else:
        names = ["dry_stressed"] + ["moderate_variable"] * (k - 2) + ["wet_vigorous"]

    return {
        raw_id: (rank_id, names[rank_id])
        for rank_id, (raw_id, _) in enumerate(ordered)
    }


def cluster_seasons_and_analogs(
    features_df: pd.DataFrame,
    feature_cols: Sequence[str] = DEFAULT_CLUSTER_FEATURES,
    n_clusters: int = 3,
    random_state: int = 42,
) -> pd.DataFrame:
    """Cluster seasons by moisture/rainfall regime and attach semantic labels."""
    if features_df.empty:
        out = features_df.copy()
        out["cluster_id_m2"] = pd.Series(dtype=int)
        out["cluster_label_m2"] = pd.Series(dtype=str)
        return out

    cols = [c for c in feature_cols if c in features_df.columns]
    if not cols:
        raise ValueError("None of the requested cluster feature columns exist in features_df")

    work = features_df.copy()
    cluster_ids = np.zeros(len(work), dtype=int)
    cluster_labels = ["moderate_variable"] * len(work)

    for _, idx in work.groupby("season", sort=False).groups.items():
        pos = work.index.get_indexer(idx)
        mat = work.loc[idx, cols].to_numpy(dtype=float)
        k = max(1, min(n_clusters, len(pos)))

        if k == 1:
            for df_pos in pos:
                cluster_ids[df_pos] = 0
                cluster_labels[df_pos] = "moderate_variable"
            continue

        scaler = StandardScaler()
        x_scaled = scaler.fit_transform(np.nan_to_num(mat, nan=0.0))
        km = KMeans(n_clusters=k, n_init=10, random_state=random_state)
        raw_labels = km.fit_predict(x_scaled)
        mapping = _label_clusters_by_hydrology(km.cluster_centers_, cols)

        for local_i, df_pos in enumerate(pos):
            ordered_id, semantic_label = mapping[int(raw_labels[local_i])]
            cluster_ids[df_pos] = ordered_id
            cluster_labels[df_pos] = semantic_label

    work["cluster_id_m2"] = cluster_ids
    work["cluster_label_m2"] = cluster_labels
    return work


def _row_to_analog_summary(row: pd.Series, analog_type: str) -> dict[str, Any]:
    return {
        "analog_type": analog_type,
        "cell_id": str(row["cell_id"]),
        "year": int(row["year"]),
        "season": str(row["season"]),
        "total_rain_mm": float(row["total_rain_mm"]),
        "longest_dry_spell_days": int(row["longest_dry_spell_days"]),
        "heat_stress_days": int(row["heat_stress_days"]),
        "mean_sm_anomaly_z": float(row["mean_sm_anomaly_z"]),
        "bare_period_fraction": float(row["bare_period_fraction"]),
    }


def retrieve_analog_seasons(
    features_df: pd.DataFrame,
    season: str = "major",
) -> dict[str, dict[str, Any]]:
    """Select driest, wettest, hottest, and typical historical analog seasons."""
    if features_df.empty:
        return {}

    sub = features_df[features_df["season"] == season]
    if sub.empty:
        sub = features_df
    sub = sub.reset_index(drop=True)

    driest_idx = int(
        sub.sort_values(
            ["total_rain_mm", "longest_dry_spell_days"],
            ascending=[True, False],
        ).index[0]
    )
    wettest_idx = int(
        sub.sort_values(
            ["total_rain_mm", "ndvi_peak"],
            ascending=[False, False],
        ).index[0]
    )
    hottest_idx = int(
        sub.sort_values(
            ["heat_stress_days", "total_rain_mm"],
            ascending=[False, True],
        ).index[0]
    )

    cols = [c for c in DEFAULT_CLUSTER_FEATURES if c in sub.columns]
    mat = sub[cols].to_numpy(dtype=float)
    stds = np.std(mat, axis=0)
    safe_stds = np.where(stds > 1e-8, stds, 1.0)
    z = (mat - np.mean(mat, axis=0)) / safe_stds
    typical_idx = int(np.argmin(np.linalg.norm(z, axis=1)))

    return {
        "driest": _row_to_analog_summary(sub.iloc[driest_idx], "driest"),
        "wettest": _row_to_analog_summary(sub.iloc[wettest_idx], "wettest"),
        "hottest": _row_to_analog_summary(sub.iloc[hottest_idx], "hottest"),
        "typical": _row_to_analog_summary(sub.iloc[typical_idx], "typical"),
    }
