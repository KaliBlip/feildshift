"""Seasonal agro-climatic feature engineering from dekad cubes and daily records."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd

from fieldshift.config import PilotConfig, load_pilot_config
from fieldshift.qc.harmonise import date_to_dekad

SEASON_FEATURE_COLUMNS: tuple[str, ...] = (
    "cell_id",
    "year",
    "season",
    "onset_dekad",
    "cessation_dekad",
    "total_rain_mm",
    "rain_cv",
    "longest_dry_spell_days",
    "heavy_rain_days",
    "heat_stress_days",
    "mean_sm_anomaly_z",
    "ndvi_peak",
    "bare_period_fraction",
    "erosion_exposure_index",
)


def estimate_hargreaves_et0(
    tmin_c: np.ndarray | float,
    tmax_c: np.ndarray | float,
    doy: np.ndarray | int,
    lat_deg: float = 6.85,
) -> np.ndarray:
    """Estimate daily FAO-56 Hargreaves reference evapotranspiration (mm/day)."""
    tmin = np.asarray(tmin_c, dtype=float)
    tmax = np.asarray(tmax_c, dtype=float)
    day_arr = np.asarray(doy, dtype=float)

    tmean = 0.5 * (tmin + tmax)
    trange = np.maximum(0.0, tmax - tmin)

    phi = math.radians(lat_deg)
    angle = (2.0 * math.pi / 365.0) * day_arr
    dr = 1.0 + 0.033 * np.cos(angle)
    delta = 0.409 * np.sin(angle - 1.39)
    ws = np.arccos(np.clip(-np.tan(phi) * np.tan(delta), -1.0, 1.0))

    ra = (
        (24.0 * 60.0 / math.pi)
        * 0.0820
        * dr
        * (
            ws * math.sin(phi) * np.sin(delta)
            + math.cos(phi) * np.cos(delta) * np.sin(ws)
        )
    )
    # Divide Ra (MJ m-2 day-1) by 2.45 latent heat of vaporization to convert to mm/day
    et0 = 0.0023 * (ra / 2.45) * (tmean + 17.8) * np.sqrt(trange)
    return np.maximum(0.0, np.round(et0, 3))


def longest_dry_spell_days(
    rain_mm: np.ndarray | pd.Series,
    threshold_mm: float = 1.0,
) -> int:
    """Return the longest run of consecutive days with rainfall below threshold_mm."""
    arr = np.asarray(rain_mm, dtype=float)
    best = 0
    current = 0
    for val in arr:
        if np.isfinite(val) and val < threshold_mm:
            current += 1
            if current > best:
                best = current
        else:
            current = 0
    return int(best)


def count_heavy_rain_days(
    rain_mm: np.ndarray | pd.Series,
    threshold_mm: float = 20.0,
) -> int:
    """Count days reaching or exceeding the heavy-rainfall threshold (mm)."""
    arr = np.asarray(rain_mm, dtype=float)
    return int(np.sum(np.isfinite(arr) & (arr >= threshold_mm)))


def count_heat_stress_days(
    tmax_c: np.ndarray | pd.Series,
    threshold_c: float = 33.0,
) -> int:
    """Count days where maximum air temperature exceeds crop heat-stress threshold."""
    arr = np.asarray(tmax_c, dtype=float)
    return int(np.sum(np.isfinite(arr) & (arr >= threshold_c)))


def detect_rainy_onset_dekad(
    dekads: np.ndarray,
    rain_dekad_mm: np.ndarray,
    threshold_mm: float = 25.0,
) -> int | None:
    """Identify rainy-season onset dekad avoiding isolated false-start showers."""
    n = len(dekads)
    for idx in range(n):
        two_dekad_sum = float(rain_dekad_mm[idx]) + (
            float(rain_dekad_mm[idx + 1]) if idx + 1 < n else 0.0
        )
        if rain_dekad_mm[idx] >= threshold_mm and two_dekad_sum >= 35.0:
            return int(dekads[idx])

    for idx in range(n):
        if rain_dekad_mm[idx] >= threshold_mm * 0.8:
            return int(dekads[idx])
    return None


def detect_rainy_cessation_dekad(
    dekads: np.ndarray,
    rain_dekad_mm: np.ndarray,
    threshold_mm: float = 15.0,
) -> int | None:
    """Identify the final dekad in the season window meeting minimum rain support."""
    hits = dekads[rain_dekad_mm >= threshold_mm]
    if hits.size == 0:
        return None
    return int(hits[-1])


def compute_erosion_exposure_index(
    slope_pct: float,
    bare_fraction: float,
    heavy_rain_days: int,
    total_days: int,
) -> float:
    """Compute a 0..1 erosion exposure index from slope, bare cover, and storm frequency."""
    slope_factor = min(1.0, max(0.0, slope_pct) / 15.0)
    bare_factor = min(1.0, max(0.0, bare_fraction))
    storm_rate = heavy_rain_days / max(1, total_days)
    storm_factor = min(1.0, storm_rate / 0.15)
    score = 0.45 * bare_factor + 0.35 * slope_factor + 0.20 * storm_factor
    return round(float(np.clip(score, 0.0, 1.0)), 4)


def compute_water_satisfaction_index(
    rain_dekad_mm: np.ndarray | pd.Series,
    et0_dekad_mm: np.ndarray | pd.Series,
) -> float:
    """Compute WaPOR-style seasonal supply/demand ratio (sum(P) / sum(ET0))."""
    rain_sum = float(np.nansum(np.asarray(rain_dekad_mm, dtype=float)))
    et0_sum = float(np.nansum(np.asarray(et0_dekad_mm, dtype=float)))
    if et0_sum <= 1e-6:
        return 1.0 if rain_sum > 0 else 0.0
    return round(float(np.clip(rain_sum / et0_sum, 0.0, 3.0)), 4)


def compute_max_water_deficit_mm(
    rain_dekad_mm: np.ndarray | pd.Series,
    et0_dekad_mm: np.ndarray | pd.Series,
) -> float:
    """Compute peak cumulative seasonal evaporative deficit sum(ET0 - P) in mm."""
    rain = np.nan_to_num(np.asarray(rain_dekad_mm, dtype=float), nan=0.0)
    et0 = np.nan_to_num(np.asarray(et0_dekad_mm, dtype=float), nan=0.0)
    deficit = 0.0
    worst = 0.0
    for p_val, e_val in zip(rain, et0):
        deficit = max(0.0, deficit + (float(e_val) - float(p_val)))
        if deficit > worst:
            worst = deficit
    return round(worst, 2)


def detect_flash_drought_dekads(cube_window: pd.DataFrame) -> int:
    """Count dekads showing rainfall-vegetation decoupling (flash drought / runoff loss).

    Flags dekads where rainfall appears adequate (>= 15 mm) yet root-zone moisture
    drops abnormally (smap_anomaly_z <= -0.8) alongside a sharp NDVI drop (>= 0.03).
    """
    if cube_window.empty or len(cube_window) < 2:
        return 0
    s = cube_window.sort_values("dekad")
    rain = s["rain_imerg_mm"].to_numpy(dtype=float)
    sm_z = s["smap_anomaly_z"].to_numpy(dtype=float)
    ndvi = s["ndvi_smooth"].to_numpy(dtype=float)
    count = 0
    for idx in range(1, len(s)):
        if (
            np.isfinite(rain[idx])
            and np.isfinite(sm_z[idx])
            and np.isfinite(ndvi[idx])
            and np.isfinite(ndvi[idx - 1])
            and rain[idx] >= 15.0
            and sm_z[idx] <= -0.8
            and (ndvi[idx - 1] - ndvi[idx]) >= 0.03
        ):
            count += 1
    return int(count)


def extract_season_features(
    cube_df: pd.DataFrame,
    daily_df: pd.DataFrame | None = None,
    slope_pct: float = 5.4,
    cfg: PilotConfig | None = None,
) -> pd.DataFrame:
    """Aggregate a 36-dekad cube (and optional daily data) into season_features rows."""
    if cfg is None:
        cfg = load_pilot_config()

    season_bounds: dict[str, tuple[int, int]] = {
        "major": (
            cfg.seasons["major"].start_dekad if "major" in cfg.seasons else 7,
            cfg.seasons["major"].end_dekad if "major" in cfg.seasons else 21,
        ),
        "minor": (
            cfg.seasons["minor"].start_dekad if "minor" in cfg.seasons else 25,
            cfg.seasons["minor"].end_dekad if "minor" in cfg.seasons else 33,
        ),
        "annual": (1, 36),
    }

    daily_prepared: pd.DataFrame | None = None
    if daily_df is not None and not daily_df.empty:
        daily_prepared = daily_df.copy()
        if "cell_id" not in daily_prepared.columns:
            daily_prepared["cell_id"] = str(cube_df["cell_id"].iloc[0])
        dates = pd.to_datetime(daily_prepared["date"])
        daily_prepared["year"] = dates.dt.year
        daily_prepared["dekad"] = [date_to_dekad(ts) for ts in dates]

    rows: list[dict] = []
    for (cell_id, year), grp in cube_df.groupby(["cell_id", "year"], sort=True):
        grp_sorted = grp.sort_values("dekad")

        for season_name, (d_start, d_end) in season_bounds.items():
            win = grp_sorted[
                (grp_sorted["dekad"] >= d_start) & (grp_sorted["dekad"] <= d_end)
            ]
            if win.empty:
                continue

            dekads = win["dekad"].to_numpy(dtype=int)
            rain_vec = win["rain_imerg_mm"].to_numpy(dtype=float)
            total_rain = float(np.nansum(rain_vec))
            mean_rain = float(np.nanmean(rain_vec)) if rain_vec.size > 0 else 0.0
            std_rain = float(np.nanstd(rain_vec)) if rain_vec.size > 0 else 0.0
            rain_cv = round(std_rain / mean_rain, 4) if mean_rain > 0 else 0.0

            onset = detect_rainy_onset_dekad(dekads, rain_vec)
            cessation = detect_rainy_cessation_dekad(dekads, rain_vec)

            sm_anom = win["smap_anomaly_z"].to_numpy(dtype=float)
            mean_sm_z = (
                round(float(np.nanmean(sm_anom)), 4)
                if np.any(np.isfinite(sm_anom))
                else 0.0
            )
            ndvi_vals = win["ndvi_smooth"].to_numpy(dtype=float)
            ndvi_peak = (
                round(float(np.nanmax(ndvi_vals)), 4)
                if np.any(np.isfinite(ndvi_vals))
                else 0.0
            )
            bare_frac = round(float(np.mean(win["bare_field_flag"].astype(bool))), 4)

            if daily_prepared is not None:
                d_win = daily_prepared[
                    (daily_prepared["cell_id"] == cell_id)
                    & (daily_prepared["year"] == year)
                    & (daily_prepared["dekad"] >= d_start)
                    & (daily_prepared["dekad"] <= d_end)
                ]
            else:
                d_win = pd.DataFrame()

            if not d_win.empty:
                dry_spell = longest_dry_spell_days(d_win["rain_imerg_mm"])
                heavy_days = count_heavy_rain_days(d_win["rain_imerg_mm"])
                heat_days = (
                    count_heat_stress_days(d_win["tmax_c"])
                    if "tmax_c" in d_win.columns
                    else 0
                )
                total_days = len(d_win)
            else:
                # Fallback estimation when only dekad aggregates are provided
                dry_spell = int(np.sum(rain_vec < 5.0) * 10)
                heavy_days = int(np.sum(rain_vec >= 70.0))
                heat_days = (
                    int(np.sum(win["lst_max_c"].to_numpy(dtype=float) >= 37.0) * 3)
                    if "lst_max_c" in win.columns
                    else 0
                )
                total_days = int(len(win) * 10)

            erosion_idx = compute_erosion_exposure_index(
                slope_pct=slope_pct,
                bare_fraction=bare_frac,
                heavy_rain_days=heavy_days,
                total_days=total_days,
            )
            et0_vec = win["et0_mm"].to_numpy(dtype=float) if "et0_mm" in win.columns else np.zeros_like(rain_vec)
            water_sat = compute_water_satisfaction_index(rain_vec, et0_vec)
            max_deficit = compute_max_water_deficit_mm(rain_vec, et0_vec)
            flash_dekads = detect_flash_drought_dekads(win)

            rows.append(
                {
                    "cell_id": str(cell_id),
                    "year": int(year),
                    "season": season_name,
                    "onset_dekad": onset,
                    "cessation_dekad": cessation,
                    "total_rain_mm": round(total_rain, 2),
                    "rain_cv": rain_cv,
                    "longest_dry_spell_days": dry_spell,
                    "heavy_rain_days": heavy_days,
                    "heat_stress_days": heat_days,
                    "mean_sm_anomaly_z": mean_sm_z,
                    "ndvi_peak": ndvi_peak,
                    "bare_period_fraction": bare_frac,
                    "erosion_exposure_index": erosion_idx,
                    "water_satisfaction_index": water_sat,
                    "max_water_deficit_mm": max_deficit,
                    "flash_drought_dekads": flash_dekads,
                }
            )

    if not rows:
        return pd.DataFrame(columns=list(SEASON_FEATURE_COLUMNS))
    return (
        pd.DataFrame(rows)
        .sort_values(["cell_id", "year", "season"])
        .reset_index(drop=True)
    )
