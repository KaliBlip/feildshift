"""Agro-climatic and terrain feature engineering for Field Shift."""

from fieldshift.features.seasonal import (
    SEASON_FEATURE_COLUMNS,
    compute_erosion_exposure_index,
    compute_max_water_deficit_mm,
    compute_water_satisfaction_index,
    count_heat_stress_days,
    count_heavy_rain_days,
    detect_flash_drought_dekads,
    detect_rainy_cessation_dekad,
    detect_rainy_onset_dekad,
    estimate_hargreaves_et0,
    extract_season_features,
    longest_dry_spell_days,
)

__all__ = [
    "SEASON_FEATURE_COLUMNS",
    "compute_erosion_exposure_index",
    "compute_max_water_deficit_mm",
    "compute_water_satisfaction_index",
    "count_heat_stress_days",
    "count_heavy_rain_days",
    "detect_flash_drought_dekads",
    "detect_rainy_cessation_dekad",
    "detect_rainy_onset_dekad",
    "estimate_hargreaves_et0",
    "extract_season_features",
    "longest_dry_spell_days",
]
