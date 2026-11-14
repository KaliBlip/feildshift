"""Phase 4 climate stress-testing, FastAPI endpoint, and Phase 5 validation tests."""
from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from fieldshift.config import load_pilot_config
from fieldshift.decision import build_climate_stress_presets, evaluate_climate_stress
from fieldshift.features import extract_season_features
from fieldshift.ingest import generate_ashanti_pilot_raw_daily
from fieldshift.knowledge import load_crops_table, load_rotations_table
from fieldshift.models import (
    enrich_season_features_with_models,
    evaluate_cluster_bootstrap_stability,
    evaluate_leave_one_year_out,
    evaluate_rainfall_source_agreement,
)
from fieldshift.qc import build_dekad_cube
from index import app


def _build_sample_cube_and_features():
    cfg = load_pilot_config()
    cubes = []
    feats = []
    for yr in (2022, 2023, 2024, 2025):
        daily, _ = generate_ashanti_pilot_raw_daily("ASH_R05_C05", yr, seed=100 + yr)
        cube = build_dekad_cube(daily)
        cubes.append(cube)
        feats.append(extract_season_features(cube, daily_df=daily, slope_pct=5.4, cfg=cfg))
    return pd.concat(cubes, ignore_index=True), enrich_season_features_with_models(
        pd.concat(feats, ignore_index=True)
    )


def test_phase4_climate_stress_and_presets() -> None:
    _, features_df = _build_sample_cube_and_features()
    crops_df = load_crops_table()
    rotations_df = load_rotations_table()

    drought = evaluate_climate_stress(
        cell_id="ASH_R05_C05",
        cell_features_df=features_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        rain_factor=0.75,
        temp_delta_c=1.5,
        runs=300,
    )
    assert drought["cell_id"] == "ASH_R05_C05"
    assert len(drought["strategies"]) == len(rotations_df)

    presets = build_climate_stress_presets(
        cell_id="ASH_R05_C05",
        cell_features_df=features_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        runs=200,
    )
    assert [p["scenario_id"] for p in presets] == [
        "baseline",
        "moderate_drought",
        "severe_heat_drought",
        "intense_rainfall",
    ]
    base_preset = presets[0]
    assert all(row["delta_vs_baseline"] == 0.0 for row in base_preset["strategies"])


def test_fastapi_stress_test_and_analogs_endpoints() -> None:
    client = TestClient(app)

    res_analogs = client.get("/api/analogs")
    assert res_analogs.status_code == 200
    assert "moderate_drought" in res_analogs.json()["presets"]

    payload = {
        "strategies": ["Baseline Maize", "Maize-Cowpea Relay"],
        "criteria": ["Water", "Soil", "Erosion", "Income"],
        "scores": [[0.46, 0.34, 0.42, 0.52], [0.74, 0.76, 0.66, 0.72]],
        "weights": [0.25, 0.25, 0.25, 0.25],
        "is_baseline": [True, False],
        "rain_factor": 0.75,
        "temp_delta_c": 1.5,
        "runs": 300,
        "seed": 42,
    }
    res_stress = client.post("/api/stress-test", json=payload)
    assert res_stress.status_code == 200
    data = res_stress.json()
    assert len(data["deltas"]) == 2
    assert data["deltas"][0] < 0.0
    assert data["base_scores"][1] > data["base_scores"][0]


def test_phase5_temporal_loyo_rainfall_and_bootstrap_validation() -> None:
    cube_df, features_df = _build_sample_cube_and_features()

    rain_check = evaluate_rainfall_source_agreement(cube_df)
    assert rain_check["n_pairs"] == 144
    assert rain_check["pearson_r"] > 0.75

    loyo = evaluate_leave_one_year_out(features_df)
    assert loyo["years_tested"] == 4
    assert 0.0 <= loyo["mean_anomaly_score_shift"] <= 0.35
    assert 0.5 <= loyo["cluster_label_agreement"] <= 1.0

    boot = evaluate_cluster_bootstrap_stability(features_df, n_bootstrap=15, seed=42)
    assert boot["n_bootstrap"] == 15
    assert 0.4 <= boot["mean_stability"] <= 1.0
