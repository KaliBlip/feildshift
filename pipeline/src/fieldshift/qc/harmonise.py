"""Dekad temporal harmonisation and QC cube validation."""
from __future__ import annotations

import calendar
from datetime import date

import numpy as np
import pandas as pd

from fieldshift.qc.cloud_mask import apply_optical_qa_mask, classify_qa_tier
from fieldshift.qc.ndvi_smoothing import detect_bare_field_dekads, smooth_ndvi_dekads

REQUIRED_CUBE_COLUMNS: tuple[str, ...] = (
    "cell_id",
    "year",
    "dekad",
    "start_date",
    "end_date",
    "rain_imerg_mm",
    "rain_era5_mm",
    "smap_sm_m3m3",
    "smap_anomaly_z",
    "ndvi_raw",
    "ndvi_smooth",
    "optical_valid_frac",
    "lst_max_c",
    "et0_mm",
    "water_balance_mm",
    "bare_field_flag",
    "qa_tier",
    "provenance_id",
)

VALID_QA_TIERS = frozenset({"high", "moderate", "low_cloud_gap"})


def date_to_dekad(dt: pd.Timestamp | date | str) -> int:
    """Map a calendar date to 1-based dekad of year (1..36; 3 dekads per month)."""
    ts = pd.Timestamp(dt)
    if ts.day <= 10:
        in_month = 1
    elif ts.day <= 20:
        in_month = 2
    else:
        in_month = 3
    return (ts.month - 1) * 3 + in_month


def _dekad_date_bounds(year: int, dekad: int) -> tuple[str, str]:
    """Return ISO (start_date, end_date) strings for a (year, dekad 1..36)."""
    month = (dekad - 1) // 3 + 1
    slot = (dekad - 1) % 3
    if slot == 0:
        start_day, end_day = 1, 10
    elif slot == 1:
        start_day, end_day = 11, 20
    else:
        start_day = 21
        end_day = calendar.monthrange(year, month)[1]
    return (
        date(year, month, start_day).isoformat(),
        date(year, month, end_day).isoformat(),
    )


def build_dekad_cube(
    daily_df: pd.DataFrame,
    provenance_id: str | None = None,
    max_cloud_prob: float = 0.35,
    bare_threshold: float = 0.28,
) -> pd.DataFrame:
    """Aggregate QA-masked daily Earth observations onto the 36-dekad analysis grid."""
    required_input = {"date", "rain_imerg_mm", "smap_sm_m3m3", "ndvi_raw", "cloud_prob"}
    missing = required_input - set(daily_df.columns)
    if missing:
        raise ValueError(f"daily_df missing required columns: {sorted(missing)}")

    work = daily_df.copy()
    if "cell_id" not in work.columns:
        work["cell_id"] = "UNKNOWN_CELL"
    if "rain_era5_mm" not in work.columns:
        work["rain_era5_mm"] = np.nan
    if "lst_max_c" not in work.columns:
        work["lst_max_c"] = np.nan
    if "et0_mm" not in work.columns:
        work["et0_mm"] = 0.0

    dates = pd.to_datetime(work["date"])
    work["year"] = dates.dt.year
    work["dekad"] = [date_to_dekad(ts) for ts in dates]
    work["ndvi_clear"] = apply_optical_qa_mask(
        work["ndvi_raw"], work["cloud_prob"], max_cloud_prob=max_cloud_prob
    )

    chunks: list[pd.DataFrame] = []
    for (cell_id, year), grp in work.groupby(["cell_id", "year"], sort=True):
        dekad_index = pd.Index(range(1, 37), name="dekad")
        by_dekad = grp.groupby("dekad")

        rain_imerg = by_dekad["rain_imerg_mm"].sum().reindex(dekad_index, fill_value=0.0)
        rain_era5 = by_dekad["rain_era5_mm"].sum(min_count=1).reindex(dekad_index)
        smap_sm = by_dekad["smap_sm_m3m3"].mean().reindex(dekad_index)
        ndvi_raw_clear = by_dekad["ndvi_clear"].mean().reindex(dekad_index)
        valid_counts = by_dekad["ndvi_clear"].count().reindex(dekad_index, fill_value=0)
        total_counts = by_dekad["ndvi_raw"].size().reindex(dekad_index, fill_value=0)
        lst_max = by_dekad["lst_max_c"].max().reindex(dekad_index)
        et0 = by_dekad["et0_mm"].sum().reindex(dekad_index, fill_value=0.0)

        with np.errstate(divide="ignore", invalid="ignore"):
            valid_frac = np.where(total_counts > 0, valid_counts / total_counts, 0.0)
        valid_frac = np.clip(np.round(valid_frac, 4), 0.0, 1.0)

        sm_vals = smap_sm.to_numpy(dtype=float)
        sm_mean = np.nanmean(sm_vals) if np.any(np.isfinite(sm_vals)) else 0.0
        sm_std = np.nanstd(sm_vals) if np.any(np.isfinite(sm_vals)) else 0.0
        if sm_std > 0:
            smap_z = np.round((sm_vals - sm_mean) / sm_std, 4)
        else:
            smap_z = np.zeros_like(sm_vals)

        ndvi_smooth = smooth_ndvi_dekads(ndvi_raw_clear.to_numpy(dtype=float))
        bare_flags = detect_bare_field_dekads(ndvi_smooth, bare_threshold=bare_threshold)
        qa_tiers = [classify_qa_tier(float(f)) for f in valid_frac]

        bounds = [_dekad_date_bounds(int(year), int(d)) for d in dekad_index]
        start_dates = [b[0] for b in bounds]
        end_dates = [b[1] for b in bounds]

        cube_chunk = pd.DataFrame(
            {
                "cell_id": str(cell_id),
                "year": int(year),
                "dekad": dekad_index.to_numpy(dtype=int),
                "start_date": start_dates,
                "end_date": end_dates,
                "rain_imerg_mm": np.round(rain_imerg.to_numpy(dtype=float), 2),
                "rain_era5_mm": np.round(rain_era5.to_numpy(dtype=float), 2),
                "smap_sm_m3m3": np.round(sm_vals, 4),
                "smap_anomaly_z": smap_z,
                "ndvi_raw": np.round(ndvi_raw_clear.to_numpy(dtype=float), 4),
                "ndvi_smooth": ndvi_smooth,
                "optical_valid_frac": valid_frac,
                "lst_max_c": np.round(lst_max.to_numpy(dtype=float), 2),
                "et0_mm": np.round(et0.to_numpy(dtype=float), 2),
                "water_balance_mm": np.round(
                    rain_imerg.to_numpy(dtype=float) - et0.to_numpy(dtype=float), 2
                ),
                "bare_field_flag": bare_flags.astype(bool),
                "qa_tier": qa_tiers,
                "provenance_id": provenance_id,
            }
        )
        chunks.append(cube_chunk)

    if not chunks:
        return pd.DataFrame(columns=list(REQUIRED_CUBE_COLUMNS))
    return pd.concat(chunks, ignore_index=True)


def validate_dekad_cube(cube_df: pd.DataFrame, raise_on_error: bool = False) -> bool:
    """Validate schema, 36-dekad completeness, smoothed NDVI bounds, and QA tiers."""
    errors: list[str] = []
    missing = [col for col in REQUIRED_CUBE_COLUMNS if col not in cube_df.columns]
    if missing:
        errors.append(f"Missing columns: {missing}")
    elif cube_df.empty:
        errors.append("Cube DataFrame is empty")
    else:
        for (cell_id, year), grp in cube_df.groupby(["cell_id", "year"]):
            dekads = sorted(grp["dekad"].tolist())
            if dekads != list(range(1, 37)):
                errors.append(f"({cell_id}, {year}) incomplete dekads: count={len(dekads)}")

        ndvi = cube_df["ndvi_smooth"].to_numpy(dtype=float)
        if not np.all(np.isfinite(ndvi)) or np.any((ndvi < 0.0) | (ndvi > 1.0)):
            errors.append("ndvi_smooth contains non-finite or out-of-range values")

        frac = cube_df["optical_valid_frac"].to_numpy(dtype=float)
        if not np.all(np.isfinite(frac)) or np.any((frac < 0.0) | (frac > 1.0)):
            errors.append("optical_valid_frac contains out-of-range values")

        if not set(cube_df["qa_tier"].unique()).issubset(VALID_QA_TIERS):
            errors.append("qa_tier contains invalid tier values")

    if errors:
        if raise_on_error:
            raise ValueError("; ".join(errors))
        return False
    return True
