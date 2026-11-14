"""Phase 3 tests: challenge EO adapters, M6 decision fusion, M7 passports, and publisher."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from fieldshift.config import load_pilot_config
from fieldshift.decision import base_scores, score_strategies_for_cell
from fieldshift.evidence import VALID_EVIDENCE_TIERS, generate_evidence_passports
from fieldshift.features import extract_season_features
from fieldshift.ingest import (
    DATASETS_REGISTRY,
    NON_GLOBAL_US_BASELINES,
    classify_usda_texture,
    fetch_nasa_power_daily,
    fetch_soilgrids_point,
    generate_ashanti_pilot_raw_daily,
)
from fieldshift.knowledge import load_crops_table, load_rotations_table
from fieldshift.models import enrich_season_features_with_models
from fieldshift.publish import (
    build_pilot_bundle,
    export_bundle_json,
    publish_bundle_to_supabase,
)
from fieldshift.qc import build_dekad_cube
from scoring import base_scores as api_base_scores

REPO_ROOT = Path(__file__).resolve().parents[2]


class _FakeResponse:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self._payload


def test_challenge_resource_datasets_and_us_exclusions() -> None:
    assert DATASETS_REGISTRY["smap_root_zone"].short_name == "SPL4SMGP"
    assert DATASETS_REGISTRY["gedi_canopy"].short_name == "GEDI02_B"
    assert DATASETS_REGISTRY["gedi_canopy"].resolution_km == pytest.approx(0.025)
    assert "usda_web_soil_survey" in NON_GLOBAL_US_BASELINES
    assert "oregon_state_prism" in NON_GLOBAL_US_BASELINES
    assert classify_usda_texture(clay_pct=24.3, sand_pct=52.0) == "Sandy clay loam"


def test_mocked_live_power_and_soilgrids_adapters(monkeypatch: pytest.MonkeyPatch) -> None:
    power_payload = {
        "properties": {
            "parameter": {
                "PRECTOTCORR": {"20240101": 0.0, "20240102": 14.5, "20240103": -999.0},
                "T2M_MAX": {"20240101": 33.2, "20240102": 31.0, "20240103": 32.1},
                "T2M_MIN": {"20240101": 21.5, "20240102": 22.0, "20240103": 21.8},
            }
        }
    }
    soil_payload = {
        "properties": {
            "layers": [
                {
                    "name": "phh2o",
                    "unit_measure": {"d_factor": 10},
                    "depths": [{"values": {"mean": 58}}, {"values": {"mean": 59}}],
                },
                {
                    "name": "clay",
                    "unit_measure": {"d_factor": 10},
                    "depths": [{"values": {"mean": 243}}, {"values": {"mean": 251}}],
                },
                {
                    "name": "sand",
                    "unit_measure": {"d_factor": 10},
                    "depths": [{"values": {"mean": 510}}, {"values": {"mean": 498}}],
                },
                {
                    "name": "silt",
                    "unit_measure": {"d_factor": 10},
                    "depths": [{"values": {"mean": 247}}, {"values": {"mean": 251}}],
                },
                {
                    "name": "soc",
                    "unit_measure": {"d_factor": 10},
                    "depths": [{"values": {"mean": 165}}, {"values": {"mean": 135}}],
                },
            ]
        }
    }

    def fake_get(url: str, **kwargs: Any) -> _FakeResponse:
        _ = kwargs
        if "power.larc.nasa.gov" in url:
            return _FakeResponse(power_payload)
        if "rest.isric.org" in url:
            return _FakeResponse(soil_payload)
        raise AssertionError(f"Unexpected URL: {url}")

    monkeypatch.setattr("fieldshift.ingest.sources.requests.get", fake_get)

    power_df, power_rec = fetch_nasa_power_daily(
        lat=6.85,
        lon=-1.45,
        start_yyyymmdd="20240101",
        end_yyyymmdd="20240103",
    )
    assert len(power_df) == 3
    assert power_rec.retrieval_mode == "live"
    assert math.isnan(power_df.loc[2, "rain_power_mm"])
    assert power_df.loc[1, "rain_power_mm"] == pytest.approx(14.5)

    soil_summary, soil_rec = fetch_soilgrids_point(lat=6.85, lon=-1.45)
    assert soil_rec.retrieval_mode == "live"
    assert soil_summary["soil_ph"] == pytest.approx(5.85, abs=0.05)
    assert soil_summary["soil_texture"] == "Sandy clay loam"


def test_m6_base_scores_parity_against_shared_vector() -> None:
    vec = json.loads((REPO_ROOT / "shared/test-vectors/scoring_basic.json").read_text())
    scores = np.array(vec["scores"], dtype=float)
    weights = np.array(vec["weights"], dtype=float)

    m6_vals = base_scores(scores, weights)
    api_vals = api_base_scores(scores, weights)
    expected = np.array(vec["expected_base_scores"], dtype=float)

    assert np.allclose(m6_vals, expected, atol=1e-9)
    assert np.allclose(m6_vals, api_vals, atol=1e-9)


def test_m6_fusion_and_m7_evidence_passport_contract() -> None:
    cfg = load_pilot_config()
    crops_df = load_crops_table()
    rotations_df = load_rotations_table()

    frames = []
    for yr in (2022, 2023, 2024):
        daily_df, _ = generate_ashanti_pilot_raw_daily("ASH_R00_C00", yr, seed=10 + yr)
        cube_df = build_dekad_cube(daily_df)
        frames.append(extract_season_features(cube_df, daily_df=daily_df, slope_pct=4.5, cfg=cfg))

    import pandas as pd

    enriched = enrich_season_features_with_models(pd.concat(frames, ignore_index=True))
    strategies = score_strategies_for_cell(
        cell_id="ASH_R00_C00",
        cell_features_df=enriched,
        crops_df=crops_df,
        rotations_df=rotations_df,
        slope_pct=4.5,
        soil_ph=5.8,
        runs=400,
    )
    assert len(strategies) == len(rotations_df)
    assert abs(sum(s["default_prob_first"] for s in strategies) - 1.0) < 0.02

    # Steeper terrain (12% > continuous maize 5% limit) lowers baseline erosion score
    steep = score_strategies_for_cell(
        cell_id="ASH_R00_C00",
        cell_features_df=enriched,
        crops_df=crops_df,
        rotations_df=rotations_df,
        slope_pct=12.0,
        soil_ph=5.8,
        runs=200,
    )
    flat_baseline = next(s for s in strategies if s["strategy_code"] == "baseline")
    steep_baseline = next(s for s in steep if s["strategy_code"] == "baseline")
    assert steep_baseline["criterion_scores"][2] < flat_baseline["criterion_scores"][2]

    passports = generate_evidence_passports(
        cell_id="ASH_R00_C00",
        strategy_records=strategies,
        cell_features_df=enriched,
        rotations_df=rotations_df,
        scale_honesty={"summary": "2.0 ha farm vs coarse 9-50 km layers"},
        farm_area_ha=2.0,
        soil_summary={"soil_ph": 5.8, "soil_texture": "sandy_clay_loam", "clay_pct": 24.3},
    )
    assert len(passports) == len(strategies)
    passport_ids = {p["passport_id"] for p in passports}
    for strat, passport in zip(strategies, passports):
        assert strat["passport_id"] in passport_ids
        assert passport["evidence_tier"] in VALID_EVIDENCE_TIERS
        assert "usda_web_soil_survey" in passport["scale_honesty_note"]
        assert len(passport["required_local_review"]) >= 1


def test_build_pilot_bundle_and_dry_run_publish(tmp_path: Path) -> None:
    bundle = build_pilot_bundle(
        years=(2022, 2023),
        farm_area_ha=2.0,
        cell_limit=2,
        fetch_live_baseline=False,
    )
    assert len(bundle["pilot_cells"]) == 2
    assert len(bundle["dekad_timeseries"]) == 2 * 2 * 36
    assert len(bundle["strategy_scores"]) == 2 * 5
    assert len(bundle["evidence_passports"]) == 2 * 5

    out_file = export_bundle_json(bundle, tmp_path / "bundle.json")
    loaded = json.loads(out_file.read_text(encoding="utf-8"))
    assert loaded["farm_area_ha"] == 2.0

    dry = publish_bundle_to_supabase(bundle, dry_run=True)
    assert dry["status"] == "dry_run"
    assert dry["tables"]["strategy_scores"] == 10

    skipped = publish_bundle_to_supabase(bundle, dry_run=False, supabase_url="", service_key="")
    assert skipped["status"] == "skipped_no_credentials"
