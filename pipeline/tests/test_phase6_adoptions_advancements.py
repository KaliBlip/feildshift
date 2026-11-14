"""Offline deterministic tests for A1-A4 adoptions & B1-B4 scientific advancements."""
from __future__ import annotations

from dataclasses import dataclass
from unittest.mock import patch

from fastapi.testclient import TestClient
import numpy as np
import pandas as pd

from fieldshift.decision import evaluate_minimax_regret, score_strategies_for_cell
from fieldshift.features import (
    compute_max_water_deficit_mm,
    compute_water_satisfaction_index,
    detect_flash_drought_dekads,
    extract_season_features,
)
from fieldshift.ingest import fetch_isdasoil_point, generate_ashanti_pilot_raw_daily
from fieldshift.knowledge import load_crops_table, load_rotations_table
from fieldshift.models import calibrate_strategy_scores_with_feedback
from fieldshift.publish import SEASON_FEATURES_SQL_COLUMNS, _fetch_best_soil_baseline, _project_rows
from fieldshift.qc import build_dekad_cube
from index import app


class _FakeResponse:
    def __init__(self, payload: dict) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


class _FakeIsdaSession:
    def post(self, url: str, data=None, headers=None, timeout: int = 20):
        assert url.endswith("/login")
        return _FakeResponse({"access_token": "tok-test-30m"})

    def get(self, url: str, headers=None, params=None, timeout: int = 20):
        assert url.endswith("/isdasoil/v2/soilproperty")
        assert headers and headers["Authorization"] == "Bearer tok-test-30m"
        return _FakeResponse(
            {
                "property": {
                    "ph": {"0-20": {"value": 6.1}},
                    "carbon_organic": {"0-20": {"value": 16.4}},
                    "nitrogen_total": {"0-20": {"value": 1.45}},
                    "clay_content": {"0-20": {"value": 24.0}},
                    "sand_content": {"0-20": {"value": 52.0}},
                    "silt_content": {"0-20": {"value": 24.0}},
                }
            }
        )


def test_fetch_isdasoil_point_mocked_and_fallback() -> None:
    summary, rec = fetch_isdasoil_point(
        lat=6.85,
        lon=-1.45,
        username="demo",
        password="secret",
        session=_FakeIsdaSession(),  # type: ignore[arg-type]
    )
    assert summary["resolution_km"] == 0.03
    assert summary["source"] == "isdasoil_v2"
    assert summary["soil_ph"] == 6.1
    assert summary["total_nitrogen_g_kg"] == 1.45
    assert summary["soil_texture"] == "Sandy clay loam"
    assert rec.dataset_key == "isdasoil"
    assert rec.short_name == "ISDASOIL_V2_30M"
    assert rec.product_version == "2.0"

    @dataclass
    class _MockSoilRec:
        dataset_key: str = "soilgrids"
        retrieval_mode: str = "live"

    # Without iSDAsoil credentials, _fetch_best_soil_baseline falls back seamlessly to SoilGrids
    with patch.dict("os.environ", {}, clear=True), patch(
        "fieldshift.publish.fetch_soilgrids_point",
        return_value=({"source": "soilgrids", "soil_ph": 5.8}, _MockSoilRec()),
    ) as sg_mock:
        fb_sum, _ = _fetch_best_soil_baseline(6.85, -1.45)
        assert fb_sum == {"source": "soilgrids", "soil_ph": 5.8}
        sg_mock.assert_called_once()


def test_water_satisfaction_deficit_and_flash_drought_features() -> None:
    wsi = compute_water_satisfaction_index(
        np.array([20.0, 25.0, 35.0]),
        np.array([40.0, 40.0, 40.0]),
    )
    assert abs(wsi - round(80.0 / 120.0, 4)) < 1e-6

    max_def = compute_max_water_deficit_mm(
        np.array([10.0, 5.0, 50.0]),
        np.array([30.0, 25.0, 20.0]),
    )
    # Cum deficit: +20, +40 (peak), then resets toward +10
    assert max_def == 40.0

    decoupled_cube = pd.DataFrame(
        {
            "dekad": [10, 11, 12],
            "rain_imerg_mm": [22.0, 28.0, 18.0],
            "smap_anomaly_z": [0.1, -1.2, -0.2],
            "ndvi_smooth": [0.64, 0.56, 0.59],  # dekad 11 drops 0.08 with rain >=15 and z <= -0.8
        }
    )
    assert detect_flash_drought_dekads(decoupled_cube) == 1

    raw_df, _ = generate_ashanti_pilot_raw_daily("ASH_TEST", 2024, seed=42)
    cube = build_dekad_cube(raw_df)
    feats = extract_season_features(cube, raw_df, slope_pct=5.0)
    assert {
        "water_satisfaction_index",
        "max_water_deficit_mm",
        "flash_drought_dekads",
    }.issubset(feats.columns)

    # Confirm Supabase projection strips new in-memory columns cleanly
    projected = _project_rows(feats.to_dict(orient="records"), SEASON_FEATURES_SQL_COLUMNS)
    assert all(set(row.keys()) <= set(SEASON_FEATURES_SQL_COLUMNS) for row in projected)


def test_m6_urea_bag_offset_bare_days_and_minimax_regret() -> None:
    raw_frames = []
    cubes = []
    for yr in (2023, 2024):
        daily, _ = generate_ashanti_pilot_raw_daily("ASH_R05_C05", yr, seed=10 + yr)
        raw_frames.append(daily)
        cubes.append(build_dekad_cube(daily))
    cube_df = pd.concat(cubes, ignore_index=True)
    daily_df = pd.concat(raw_frames, ignore_index=True)
    features_df = extract_season_features(cube_df, daily_df, slope_pct=5.4)

    crops_df = load_crops_table()
    rotations_df = load_rotations_table()

    scored = score_strategies_for_cell(
        cell_id="ASH_R05_C05",
        cell_features_df=features_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        runs=300,
    )
    by_code = {row["strategy_code"]: row for row in scored}
    baseline_benefits = " ".join(by_code["baseline"]["expected_benefits"])
    assert "zero biological N fixation" in baseline_benefits
    assert "Avoids ~0 bare-soil days" in baseline_benefits

    legume_benefits = " ".join(by_code["strategy_a"]["expected_benefits"])
    assert "urea bags/ha offset" in legume_benefits
    assert "Harmattan bare-soil days" in legume_benefits
    assert "30-250 m pixels" in " ".join(by_code["strategy_a"]["information_gaps"])

    minimax = evaluate_minimax_regret(
        cell_id="ASH_R05_C05",
        cell_features_df=features_df,
        crops_df=crops_df,
        rotations_df=rotations_df,
        runs=300,
    )
    assert minimax["lowest_regret_strategy_code"] == minimax["strategies"][0]["strategy_code"]
    regrets = [row["max_regret"] for row in minimax["strategies"]]
    assert regrets == sorted(regrets)

    client = TestClient(app)
    resp = client.post(
        "/api/stress-test",
        json={
            "strategies": [r["strategy_code"] for r in scored],
            "criteria": ["water", "soil", "erosion", "income"],
            "scores": [r["criterion_scores"] for r in scored],
            "weights": [0.35, 0.25, 0.20, 0.20],
            "is_baseline": [r["is_baseline"] for r in scored],
            "rain_factor": 0.8,
            "temp_delta_c": 1.0,
            "runs": 400,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["worst_case_scores"]) == len(scored)
    assert len(body["max_regrets"]) == len(scored)
    assert body["lowest_regret_strategy"] in body["strategies"]


def test_m8_conjugate_bayesian_feedback_governance() -> None:
    strategies = [
        {
            "strategy_code": "maize_cowpea_relay",
            "strategy_name": "Maize-Cowpea Relay",
            "criterion_scores": [0.68, 0.72, 0.70, 0.65],
            "score_uncertainties": [0.16, 0.16, 0.16, 0.16],
        },
        {
            "strategy_code": "continuous_maize",
            "strategy_name": "Continuous Maize",
            "criterion_scores": [0.46, 0.42, 0.40, 0.55],
            "score_uncertainties": [0.14, 0.14, 0.14, 0.14],
        },
    ]
    reports = [
        # Must be ignored by RLS governance mirror: farmer_reported / eligible=False
        {
            "strategy_code": "continuous_maize",
            "evidence_grade": "farmer_reported",
            "eligible_for_model_update": False,
            "outcome_summary": "Strong profit reported",
            "water_stress_observed": "None",
            "soil_cover_observed": "Good cover",
        },
        # Must be applied: officer_reviewed + eligible_for_model_update=True
        {
            "strategy_code": "maize_cowpea_relay",
            "evidence_grade": "officer_reviewed",
            "eligible_for_model_update": True,
            "outcome_summary": "Good yield and no erosion observed",
            "water_stress_observed": "Low",
            "soil_cover_observed": "Good cover",
        },
    ]

    result = calibrate_strategy_scores_with_feedback(strategies, reports, runs=300)
    assert result["verified_reports_applied"] == 1
    assert result["ignored_unverified_reports"] == 1
    assert result["updates_by_strategy"] == {"maize_cowpea_relay": 1}

    by_code = {r["strategy_code"]: r for r in result["calibrated_strategies"]}
    # Continuous maize must remain untouched
    assert by_code["continuous_maize"]["criterion_scores"] == [0.46, 0.42, 0.4, 0.55]
    assert by_code["continuous_maize"]["score_uncertainties"] == [0.14, 0.14, 0.14, 0.14]
    # Cowpea relay posterior uncertainty shrinks and score nudges toward verified observations
    assert all(sig < 0.16 for sig in by_code["maize_cowpea_relay"]["score_uncertainties"])
    assert by_code["maize_cowpea_relay"]["criterion_scores"][0] > 0.68
