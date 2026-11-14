"""Phase 1 tests: pilot config, scale honesty, ingestion manifest, and QC dekad cube."""
from __future__ import annotations

import numpy as np
import pytest

from fieldshift.config import (
    compute_bounding_box,
    evaluate_scale_honesty,
    generate_pilot_cells,
    load_pilot_config,
)
from fieldshift.ingest import (
    DATASETS_REGISTRY,
    ProvenanceManifest,
    ProvenanceRecord,
    build_power_request_url,
    compute_payload_sha256,
    generate_ashanti_pilot_raw_daily,
    search_earthaccess_granules,
)
from fieldshift.qc import (
    apply_optical_qa_mask,
    build_dekad_cube,
    classify_qa_tier,
    date_to_dekad,
    detect_bare_field_dekads,
    smooth_ndvi_dekads,
    validate_dekad_cube,
)


def test_pilot_config_bbox_and_grid():
    cfg = load_pilot_config()
    assert cfg.region_name == "ashanti_pilot"
    assert cfg.centre_lat == pytest.approx(6.85)
    assert cfg.centre_lon == pytest.approx(-1.45)

    min_lon, min_lat, max_lon, max_lat = compute_bounding_box(cfg)
    assert min_lon < cfg.centre_lon < max_lon
    assert min_lat < cfg.centre_lat < max_lat

    cells = generate_pilot_cells(cfg)
    assert len(cells) == 100
    cell_ids = {c["cell_id"] for c in cells}
    assert "ASH_R00_C00" in cell_ids
    assert "ASH_R05_C05" in cell_ids
    assert "ASH_R09_C09" in cell_ids

    centre_cell = next(c for c in cells if c["cell_id"] == "ASH_R05_C05")
    assert centre_cell["bbox"][0] < centre_cell["centre_lon"] < centre_cell["bbox"][2]
    assert centre_cell["bbox"][1] < centre_cell["centre_lat"] < centre_cell["bbox"][3]


def test_evaluate_scale_honesty_for_smallholder_farm():
    cfg = load_pilot_config()
    assessment = evaluate_scale_honesty(2.0, cfg.dataset_resolutions_km)

    assert assessment["landsat"]["resolves_farm"] is True
    assert assessment["landsat"]["advisory_tier"] == "field_scale"

    assert assessment["modis_ndvi"]["resolves_farm"] is False
    assert assessment["modis_ndvi"]["advisory_tier"] == "sub_regional"

    for coarse_ds in ("imerg", "smap", "nasa_power"):
        assert assessment[coarse_ds]["resolves_farm"] is False
        assert assessment[coarse_ds]["advisory_tier"] == "regional_context_only"


def test_provenance_manifest_sha256_and_roundtrip(tmp_path):
    digest_a = compute_payload_sha256({"cell_id": "ASH_R05_C05", "year": 2024})
    digest_b = compute_payload_sha256({"year": 2024, "cell_id": "ASH_R05_C05"})
    assert digest_a == digest_b
    assert len(digest_a) == 64

    spec = DATASETS_REGISTRY["imerg"]
    manifest = ProvenanceManifest(
        manifest_id="ASH_R05_C05_2024_test",
        region_name="ashanti_pilot",
        cell_id="ASH_R05_C05",
    )
    manifest.add_record(
        ProvenanceRecord(
            dataset_key=spec.dataset_key,
            short_name=spec.short_name,
            product_version=spec.product_version,
            retrieval_mode="cached",
            bbox=(-1.45, 6.82, -1.40, 6.87),
            temporal_range=("2024-01-01", "2024-12-31"),
            source_uri="cmr://GPM_3IMERGDF.V07B",
            payload_sha256=digest_a,
            record_count=366,
        )
    )

    out_file = manifest.save_json(tmp_path / "manifest.json")
    loaded = ProvenanceManifest.load_json(out_file)
    assert loaded.manifest_id == manifest.manifest_id
    assert len(loaded.records) == 1
    assert loaded.records[0].payload_sha256 == digest_a


def test_ingest_adapters_dry_run_and_power_url():
    url = build_power_request_url(6.85, -1.45, "20240101", "20241231")
    assert url.startswith("https://power.larc.nasa.gov/api/temporal/daily/point?")
    assert "latitude=6.8500" in url
    assert "longitude=-1.4500" in url
    assert "PRECTOTCORR" in url

    dry = search_earthaccess_granules(
        short_name="GPM_3IMERGDF",
        bbox=(-1.70, 6.60, -1.20, 7.10),
        temporal=("2024-01-01", "2024-12-31"),
        dry_run=True,
    )
    assert dry["mode"] == "dry_run"
    assert dry["granules"] == []


def test_date_to_dekad_month_boundaries():
    assert date_to_dekad("2024-01-01") == 1
    assert date_to_dekad("2024-01-10") == 1
    assert date_to_dekad("2024-01-11") == 2
    assert date_to_dekad("2024-01-20") == 2
    assert date_to_dekad("2024-01-21") == 3
    assert date_to_dekad("2024-01-31") == 3
    assert date_to_dekad("2024-02-29") == 6
    assert date_to_dekad("2024-12-21") == 36
    assert date_to_dekad("2024-12-31") == 36


def test_cloud_mask_qa_tier_and_ndvi_smoothing():
    raw = np.array([0.30, 0.42, 0.15, 0.50, 0.25])
    cloud_prob = np.array([0.10, 0.20, 0.85, 0.15, 0.50])
    masked = apply_optical_qa_mask(raw, cloud_prob, max_cloud_prob=0.35)
    assert np.isnan(masked[2])
    assert np.isnan(masked[4])
    assert masked[0] == pytest.approx(0.30)

    assert classify_qa_tier(0.80) == "high"
    assert classify_qa_tier(0.50) == "moderate"
    assert classify_qa_tier(0.20) == "low_cloud_gap"

    dekads = np.arange(36, dtype=float)
    ideal = 0.24 + 0.48 * np.sin(np.pi * dekads / 35.0)
    gapped = ideal.copy()
    gapped[[10, 11, 14, 15, 25]] = np.nan
    smoothed = smooth_ndvi_dekads(gapped)
    assert np.all(np.isfinite(smoothed))
    assert np.all((smoothed >= 0.0) & (smoothed <= 1.0))
    assert np.max(np.abs(smoothed - ideal)) < 0.08

    bare_flags = detect_bare_field_dekads(smoothed, bare_threshold=0.28)
    assert bool(bare_flags[0]) is True
    assert bool(bare_flags[17]) is False


def test_end_to_end_ashanti_pilot_daily_to_dekad_cube():
    daily_df, manifest = generate_ashanti_pilot_raw_daily(
        cell_id="ASH_R05_C05",
        year=2024,
        seed=42,
    )
    assert len(daily_df) == 366
    assert len(manifest.records) >= 5

    cube = build_dekad_cube(daily_df, provenance_id=manifest.manifest_id)
    assert len(cube) == 36
    assert validate_dekad_cube(cube) is True
    assert bool(cube["bare_field_flag"].any())
    assert not cube["bare_field_flag"].all()
    assert cube["rain_imerg_mm"].sum() > 800.0

    # Mutating a required dekad out of range or removing rows invalidates the cube
    bad_cube = cube.iloc[:-1].copy()
    assert validate_dekad_cube(bad_cube) is False
