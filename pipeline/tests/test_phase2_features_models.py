"""Phase 2 tests: seasonal features, M1-M4 models, and Ashanti knowledge tables."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from fieldshift.features import (
    SEASON_FEATURE_COLUMNS,
    count_heat_stress_days,
    count_heavy_rain_days,
    estimate_hargreaves_et0,
    extract_season_features,
    longest_dry_spell_days,
)
from fieldshift.ingest import generate_ashanti_pilot_raw_daily
from fieldshift.knowledge import (
    load_crops_table,
    load_rotations_table,
    validate_knowledge_tables,
)
from fieldshift.models import (
    analyze_seasonal_trends,
    cluster_seasons_and_analogs,
    detect_season_anomalies,
    enrich_season_features_with_models,
    extract_ndvi_phenology,
    retrieve_analog_seasons,
)
from fieldshift.qc import build_dekad_cube


def _build_multiyear_pilot_dataset(years: range = range(2015, 2026)):
    daily_parts = []
    cube_parts = []
    for idx, yr in enumerate(years):
        daily_df, manifest = generate_ashanti_pilot_raw_daily(
            cell_id="ASH_R05_C05",
            year=yr,
            seed=100 + idx,
        )
        # Inject an extreme dry/hot year in 2022 to test M1 anomaly + M2 analog retrieval
        if yr == 2022:
            daily_df["rain_imerg_mm"] = np.round(daily_df["rain_imerg_mm"] * 0.35, 2)
            daily_df["smap_sm_m3m3"] = np.round(daily_df["smap_sm_m3m3"] * 0.65, 4)
            daily_df["ndvi_raw"] = np.round(np.clip(daily_df["ndvi_raw"] - 0.14, 0.10, 0.9), 4)
            daily_df["tmax_c"] = np.round(daily_df["tmax_c"] + 3.2, 2)

        cube_df = build_dekad_cube(daily_df, provenance_id=manifest.manifest_id)
        daily_parts.append(daily_df)
        cube_parts.append(cube_df)

    return pd.concat(daily_parts, ignore_index=True), pd.concat(cube_parts, ignore_index=True)


def test_daily_feature_helpers_and_hargreaves_et0():
    rain = np.array([5.0, 0.0, 0.2, 0.0, 0.5, 24.0, 0.0, 21.5])
    assert longest_dry_spell_days(rain, threshold_mm=1.0) == 4
    assert count_heavy_rain_days(rain, threshold_mm=20.0) == 2

    tmax = np.array([31.0, 33.0, 34.5, 32.8])
    assert count_heat_stress_days(tmax, threshold_c=33.0) == 2

    et0 = estimate_hargreaves_et0(
        tmin_c=np.array([21.0, 22.0]),
        tmax_c=np.array([32.0, 34.0]),
        doy=np.array([60, 150]),
        lat_deg=6.85,
    )
    assert et0.shape == (2,)
    assert np.all((et0 > 3.0) & (et0 < 8.0))


def test_multiyear_season_features_and_m1_m2_models():
    daily_all, cube_all = _build_multiyear_pilot_dataset()
    features = extract_season_features(cube_all, daily_df=daily_all, slope_pct=5.4)

    for col in SEASON_FEATURE_COLUMNS:
        assert col in features.columns
    # 11 years x 3 seasons (major, minor, annual) = 33 rows
    assert len(features) == 33

    major_2022 = features[(features["year"] == 2022) & (features["season"] == "major")].iloc[0]
    major_other = features[(features["year"] != 2022) & (features["season"] == "major")]
    assert major_2022["total_rain_mm"] < major_other["total_rain_mm"].mean()
    assert major_2022["heat_stress_days"] > major_other["heat_stress_days"].mean()

    # M1 anomaly detection catches 2022 drought/heat injection
    anomalies = detect_season_anomalies(features)
    row_2022 = anomalies[(anomalies["year"] == 2022) & (anomalies["season"] == "major")].iloc[0]
    assert bool(row_2022["is_anomalous_season"]) is True
    assert 0.0 <= float(row_2022["anomaly_score_m1"]) <= 1.0

    # M2 clustering & analog retrieval
    clustered = cluster_seasons_and_analogs(anomalies, n_clusters=3)
    assert set(clustered["cluster_label_m2"].unique()).issubset(
        {"dry_stressed", "moderate_variable", "wet_vigorous"}
    )
    analogs = retrieve_analog_seasons(clustered, season="major")
    assert set(analogs.keys()) == {"driest", "wettest", "hottest", "typical"}
    assert analogs["driest"]["year"] == 2022


def test_m3_phenology_extraction():
    daily_2024, manifest = generate_ashanti_pilot_raw_daily("ASH_R05_C05", year=2024, seed=42)
    cube_2024 = build_dekad_cube(daily_2024, provenance_id=manifest.manifest_id)
    phenology = extract_ndvi_phenology(cube_2024, bare_threshold=0.28)

    assert len(phenology) == 1
    row = phenology.iloc[0]
    assert 7 <= int(row["major_peak_dekad"]) <= 21
    assert 25 <= int(row["minor_peak_dekad"]) <= 33
    assert row["major_peak_ndvi"] > 0.50
    assert row["bare_dekad_count"] >= 2
    assert isinstance(row["bare_dekad_indices"], list)


def test_m4_mann_kendall_sens_slope_and_enrich_pipeline():
    years = list(range(2015, 2026))
    synthetic = pd.DataFrame(
        {
            "cell_id": ["ASH_R05_C05"] * len(years),
            "year": years,
            "season": ["annual"] * len(years),
            "onset_dekad": [8] * len(years),
            "cessation_dekad": [32] * len(years),
            "total_rain_mm": [1400.0 - 25.0 * i for i in range(len(years))],
            "rain_cv": [0.45] * len(years),
            "longest_dry_spell_days": [12 + i for i in range(len(years))],
            "heavy_rain_days": [10] * len(years),
            "heat_stress_days": [15 + 2 * i for i in range(len(years))],
            "mean_sm_anomaly_z": [0.5 - 0.1 * i for i in range(len(years))],
            "ndvi_peak": [0.72] * len(years),
            "bare_period_fraction": [0.22 + 0.01 * i for i in range(len(years))],
            "erosion_exposure_index": [0.35] * len(years),
        }
    )

    trends = analyze_seasonal_trends(synthetic, target_col="total_rain_mm", season="annual")
    assert len(trends) == 1
    assert trends.iloc[0]["mk_trend"] == "decreasing"
    assert trends.iloc[0]["trend_sen_slope_mm_yr"] == pytest.approx(-25.0, abs=0.5)
    assert trends.iloc[0]["ols_slope_mm_yr"] == pytest.approx(-25.0, abs=0.5)

    enriched = enrich_season_features_with_models(synthetic)
    for col in (
        "anomaly_score_m1",
        "is_anomalous_season",
        "cluster_id_m2",
        "cluster_label_m2",
        "trend_sen_slope_mm_yr",
    ):
        assert col in enriched.columns


def test_knowledge_tables_citations_and_validation(tmp_path):
    counts = validate_knowledge_tables()
    assert counts["crops_count"] >= 8
    assert counts["rotations_count"] >= 4

    crops = load_crops_table()
    rotations = load_rotations_table()
    assert "cowpea_early" in set(crops["crop_code"])
    assert bool(rotations["is_baseline"].any())

    # Reject missing citations per knowledge/README.md contract
    bad_crops = crops.copy()
    bad_crops.loc[0, "source_citation"] = ""
    bad_crops.to_csv(tmp_path / "crops_ashanti.csv", index=False)
    rotations.to_csv(tmp_path / "rotations_ashanti.csv", index=False)
    with pytest.raises(ValueError, match="missing a source_citation"):
        validate_knowledge_tables(tmp_path)
