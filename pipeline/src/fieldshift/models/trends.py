"""M4: Non-parametric Mann-Kendall + Sen's slope trends with OLS baseline."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pymannkendall as mk
from scipy.stats import linregress

from fieldshift.models.anomaly import detect_season_anomalies
from fieldshift.models.clustering import cluster_seasons_and_analogs


def analyze_seasonal_trends(
    features_df: pd.DataFrame,
    target_col: str = "total_rain_mm",
    season: str = "annual",
) -> pd.DataFrame:
    """Estimate Mann-Kendall trend significance and Sen's slope vs. OLS baseline."""
    if features_df.empty:
        return pd.DataFrame()
    if target_col not in features_df.columns:
        raise ValueError(f"target_col {target_col!r} not found in features_df")

    sub = features_df[features_df["season"] == season]
    if sub.empty:
        return pd.DataFrame()

    rows: list[dict] = []
    for cell_id, grp in sub.groupby("cell_id", sort=True):
        s = grp.sort_values("year")
        years = s["year"].to_numpy(dtype=float)
        values = s[target_col].to_numpy(dtype=float)
        valid = np.isfinite(values)
        years = years[valid]
        values = values[valid]

        if values.size < 4:
            rows.append(
                {
                    "cell_id": str(cell_id),
                    "season": season,
                    "target_col": target_col,
                    "n_years": int(values.size),
                    "mk_trend": "insufficient_data",
                    "mk_p_value": 1.0,
                    "mk_tau": 0.0,
                    "trend_sen_slope_mm_yr": 0.0,
                    "ols_slope_mm_yr": 0.0,
                    "ols_p_value": 1.0,
                }
            )
            continue

        mk_res = mk.original_test(values)
        ols_res = linregress(years, values)
        rows.append(
            {
                "cell_id": str(cell_id),
                "season": season,
                "target_col": target_col,
                "n_years": int(values.size),
                "mk_trend": str(mk_res.trend),
                "mk_p_value": round(float(mk_res.p), 5),
                "mk_tau": round(float(mk_res.Tau), 4),
                "trend_sen_slope_mm_yr": round(float(mk_res.slope), 4),
                "ols_slope_mm_yr": round(float(ols_res.slope), 4),
                "ols_p_value": round(float(ols_res.pvalue), 5),
            }
        )

    return pd.DataFrame(rows).sort_values("cell_id").reset_index(drop=True)


def enrich_season_features_with_models(features_df: pd.DataFrame) -> pd.DataFrame:
    """Attach M1 anomaly scores, M2 clusters, and M4 rainfall trends to season_features."""
    enriched = detect_season_anomalies(features_df)
    enriched = cluster_seasons_and_analogs(enriched)

    trend_frames = [
        analyze_seasonal_trends(enriched, target_col="total_rain_mm", season=s_name)
        for s_name in enriched["season"].unique()
    ]
    trend_df = (
        pd.concat([df for df in trend_frames if not df.empty], ignore_index=True)
        if any(not df.empty for df in trend_frames)
        else pd.DataFrame()
    )

    if not trend_df.empty:
        enriched = enriched.merge(
            trend_df[["cell_id", "season", "trend_sen_slope_mm_yr"]],
            on=["cell_id", "season"],
            how="left",
        )
    else:
        enriched["trend_sen_slope_mm_yr"] = 0.0

    enriched["trend_sen_slope_mm_yr"] = enriched["trend_sen_slope_mm_yr"].fillna(0.0)
    return enriched
