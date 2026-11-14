"""Pilot bundle builder, JSON exporter, and optional Supabase publisher."""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Sequence

import numpy as np
import pandas as pd

from fieldshift.config import (
    PilotConfig,
    evaluate_scale_honesty,
    generate_pilot_cells,
    load_pilot_config,
)
from fieldshift.decision import DEFAULT_WEIGHTS, score_strategies_for_cell
from fieldshift.evidence import generate_evidence_passports
from fieldshift.features import estimate_hargreaves_et0, extract_season_features
from fieldshift.ingest import (
    NON_GLOBAL_US_BASELINES,
    fetch_earthdata_ashanti_snapshot,
    fetch_nasa_power_daily,
    fetch_soilgrids_point,
    generate_ashanti_pilot_raw_daily,
)
from fieldshift.knowledge import load_crops_table, load_rotations_table
from fieldshift.models import (
    enrich_season_features_with_models,
    extract_ndvi_phenology,
    retrieve_analog_seasons,
)
from fieldshift.qc import build_dekad_cube

DEFAULT_PRIORITY_CELL_IDS: tuple[str, ...] = (
    "ASH_R05_C05",
    "ASH_R04_C04",
    "ASH_R06_C06",
    "ASH_R05_C04",
    "ASH_R04_C05",
    "ASH_R06_C05",
    "ASH_R05_C06",
    "ASH_R04_C06",
    "ASH_R06_C04",
)

PILOT_CELL_SQL_COLUMNS: tuple[str, ...] = (
    "cell_id",
    "region_name",
    "row_idx",
    "col_idx",
    "centre_lat",
    "centre_lon",
    "geom",
    "centroid",
    "elevation_m",
    "slope_pct",
    "soil_texture",
    "soil_organic_carbon_g_kg",
    "soil_ph",
    "native_resolutions_km",
)

DEKAD_TIMESERIES_SQL_COLUMNS: tuple[str, ...] = (
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

SEASON_FEATURES_SQL_COLUMNS: tuple[str, ...] = (
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
    "anomaly_score_m1",
    "is_anomalous_season",
    "cluster_id_m2",
    "cluster_label_m2",
    "trend_sen_slope_mm_yr",
)

EVIDENCE_PASSPORT_SQL_COLUMNS: tuple[str, ...] = (
    "passport_id",
    "cell_id",
    "strategy_code",
    "evidence_tier",
    "observation_summary",
    "datasets_used",
    "spatial_temporal_coverage",
    "method_applied",
    "key_finding",
    "uncertainty_summary",
    "scale_honesty_note",
    "information_gaps",
    "required_local_review",
    "validator_roles",
)

STRATEGY_SCORE_SQL_COLUMNS: tuple[str, ...] = (
    "cell_id",
    "strategy_code",
    "strategy_name",
    "rotation_sequence",
    "is_baseline",
    "criteria",
    "criterion_scores",
    "score_uncertainties",
    "default_weights",
    "default_base_score",
    "default_prob_first",
    "default_mean_rank",
    "expected_benefits",
    "information_gaps",
    "risks_needing_review",
    "passport_id",
)


def _bbox_to_ewkt_polygon(bbox: Sequence[float]) -> str:
    min_lon, min_lat, max_lon, max_lat = [float(v) for v in bbox]
    return (
        f"SRID=4326;POLYGON(({min_lon} {min_lat}, {max_lon} {min_lat}, "
        f"{max_lon} {max_lat}, {min_lon} {max_lat}, {min_lon} {min_lat}))"
    )


def _point_to_ewkt(lon: float, lat: float) -> str:
    return f"SRID=4326;POINT({float(lon)} {float(lat)})"


def _project_rows(rows: list[dict[str, Any]], columns: tuple[str, ...]) -> list[dict[str, Any]]:
    return [{col: row.get(col) for col in columns if col in row} for row in rows]


def _sanitize_json_value(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {str(k): _sanitize_json_value(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize_json_value(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        val = float(obj)
        return None if (np.isnan(val) or np.isinf(val)) else val
    if isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    return obj


def _scale_honesty_summary(farm_area_ha: float, assessment: dict[str, dict[str, Any]]) -> str:
    coarse = [
        f"{name} ({info['native_resolution_km']} km)"
        for name, info in assessment.items()
        if not info["resolves_farm"]
    ]
    fine = [
        f"{name} ({info['native_resolution_km']} km)"
        for name, info in assessment.items()
        if info["resolves_farm"]
    ]
    return (
        f"Farm area {farm_area_ha:.2f} ha ({farm_area_ha / 100.0:.4f} km2): "
        f"regional-context layers [{', '.join(coarse)}] do not resolve plot boundaries individually; "
        f"finer reference layers [{', '.join(fine) if fine else 'none'}] still require local soil and agronomic checks."
    )


def _fetch_optional_live_cell_baselines(
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
) -> tuple[pd.DataFrame | None, dict[str, Any] | None, list[dict[str, Any]]]:
    """Fetch public no-auth NASA POWER daily & ISRIC SoilGrids baselines if network permits."""
    live_records: list[dict[str, Any]] = []
    power_df: pd.DataFrame | None = None
    soil_summary: dict[str, Any] | None = None

    try:
        p_df, p_rec = fetch_nasa_power_daily(
            lat=lat,
            lon=lon,
            start_yyyymmdd=start_date,
            end_yyyymmdd=end_date,
        )
        power_df = p_df
        live_records.append(asdict(p_rec))
    except Exception:
        power_df = None

    try:
        s_sum, s_rec = fetch_soilgrids_point(lat=lat, lon=lon)
        soil_summary = s_sum
        live_records.append(asdict(s_rec))
    except Exception:
        soil_summary = None

    return power_df, soil_summary, live_records


def _merge_power_rain_and_temp(daily_df: pd.DataFrame, power_df: pd.DataFrame) -> pd.DataFrame:
    merged = daily_df.copy()
    p_sub = power_df[["date", "rain_power_mm", "tmax_c", "tmin_c"]].copy()
    p_sub["date"] = pd.to_datetime(p_sub["date"]).dt.strftime("%Y-%m-%d")
    merged["date"] = pd.to_datetime(merged["date"]).dt.strftime("%Y-%m-%d")
    joined = merged.merge(p_sub, on="date", how="left", suffixes=("", "_power"))
    # Replace synthetic agroclimate temperature and bias-blend rainfall when live POWER arrives
    joined["tmax_c"] = joined["tmax_c_power"].combine_first(joined["tmax_c"])
    if "tmin_c_power" in joined.columns:
        joined["tmin_c"] = joined["tmin_c_power"].combine_first(joined["tmin_c"])
    if "rain_power_mm" in joined.columns:
        valid_rain = joined["rain_power_mm"].notna()
        joined.loc[valid_rain, "rain_imerg_mm"] = np.round(
            0.5 * joined.loc[valid_rain, "rain_imerg_mm"] + 0.5 * joined.loc[valid_rain, "rain_power_mm"],
            2,
        )
    drop_cols = [c for c in ("tmax_c_power", "tmin_c_power", "rain_power_mm") if c in joined.columns]
    return joined.drop(columns=drop_cols)


def _select_cells(
    all_cells: list[dict[str, Any]],
    cell_limit: int | None,
    cell_ids: Sequence[str] | None,
) -> list[dict[str, Any]]:
    by_id = {str(cell["cell_id"]): cell for cell in all_cells}
    if cell_ids is not None:
        ordered = [by_id[cid] for cid in cell_ids if cid in by_id]
    else:
        priority = [by_id[cid] for cid in DEFAULT_PRIORITY_CELL_IDS if cid in by_id]
        priority_set = {str(cell["cell_id"]) for cell in priority}
        rest = [cell for cell in all_cells if str(cell["cell_id"]) not in priority_set]
        ordered = priority + rest
    return ordered[:cell_limit] if cell_limit is not None else ordered


def build_pilot_bundle(
    cfg: PilotConfig | None = None,
    years: Sequence[int] = (2022, 2023, 2024, 2025),
    farm_area_ha: float = 2.0,
    cell_limit: int | None = 5,
    fetch_live_baseline: bool = False,
    cell_ids: Sequence[str] | None = None,
) -> dict[str, Any]:
    """Run the end-to-end Ashanti pilot pipeline and assemble Supabase-ready JSON tables."""
    config = cfg or load_pilot_config()
    crops_df = load_crops_table()
    rotations_df = load_rotations_table()

    all_cells = generate_pilot_cells(config)
    selected_cells = _select_cells(all_cells, cell_limit=cell_limit, cell_ids=cell_ids)
    start_yyyymmdd = f"{min(years)}0101"
    end_yyyymmdd = f"{max(years)}1231"

    earthdata_snapshot: dict[str, Any] | None = None
    earthdata_prov: list[dict[str, Any]] = []
    if fetch_live_baseline:
        try:
            snap, ed_records = fetch_earthdata_ashanti_snapshot()
            earthdata_snapshot = snap
            earthdata_prov = [asdict(rec) for rec in ed_records]
        except Exception:
            earthdata_snapshot = None

    pilot_cell_rows: list[dict[str, Any]] = []
    daily_frames_by_cell: dict[str, pd.DataFrame] = {}
    cube_frames: list[pd.DataFrame] = []
    feature_frames: list[pd.DataFrame] = []
    phenology_rows: list[dict[str, Any]] = []
    soil_baselines: dict[str, dict[str, Any]] = {}
    provenance_by_cell: dict[str, list[dict[str, Any]]] = {}
    power_cache: dict[tuple[float, float], tuple[pd.DataFrame | None, dict[str, Any] | None]] = {}

    scale_assessment = evaluate_scale_honesty(farm_area_ha, config.dataset_resolutions_km)
    scale_honesty_payload = {
        "farm_area_ha": farm_area_ha,
        "datasets": scale_assessment,
        "summary": _scale_honesty_summary(farm_area_ha, scale_assessment),
    }

    for idx, cell in enumerate(selected_cells):
        cell_id = str(cell["cell_id"])
        slope_pct = round(3.8 + 1.1 * idx, 2)

        power_df: pd.DataFrame | None = None
        soil_summary: dict[str, Any] | None = None
        live_prov: list[dict[str, Any]] = list(earthdata_prov)
        if fetch_live_baseline:
            # NASA POWER has a ~0.5 deg grid; cache per coarse 0.5-deg key across pilot cells
            p_key = (round(float(cell["centre_lat"]) * 2.0) / 2.0, round(float(cell["centre_lon"]) * 2.0) / 2.0)
            if p_key in power_cache:
                power_df, cached_p_rec = power_cache[p_key]
                if cached_p_rec is not None:
                    live_prov.append(cached_p_rec)
                try:
                    s_sum, s_rec = fetch_soilgrids_point(
                        lat=float(cell["centre_lat"]),
                        lon=float(cell["centre_lon"]),
                    )
                    soil_summary = s_sum
                    live_prov.append(asdict(s_rec))
                except Exception:
                    soil_summary = None
            else:
                power_df, soil_summary, cell_live_prov = _fetch_optional_live_cell_baselines(
                    lat=float(cell["centre_lat"]),
                    lon=float(cell["centre_lon"]),
                    start_date=start_yyyymmdd,
                    end_date=end_yyyymmdd,
                )
                cached_power_rec = next(
                    (rec for rec in cell_live_prov if rec.get("dataset_key") == "nasa_power"),
                    None,
                )
                power_cache[p_key] = (power_df, cached_power_rec)
                live_prov.extend(cell_live_prov)

        if soil_summary:
            soil_baselines[cell_id] = soil_summary

        year_dailies: list[pd.DataFrame] = []
        live_keys = {
            rec.get("dataset_key")
            for rec in live_prov
            if rec.get("retrieval_mode") == "live"
        }
        cell_prov: list[dict[str, Any]] = list(live_prov)
        for yr in years:
            df_yr, manifest = generate_ashanti_pilot_raw_daily(
                cell_id=cell_id,
                year=int(yr),
                seed=42 + idx * 17 + int(yr),
                centre_lat=float(cell["centre_lat"]),
                centre_lon=float(cell["centre_lon"]),
            )
            dates = pd.to_datetime(df_yr["date"])
            doy = dates.dt.day_of_year.to_numpy(dtype=float)
            tmin = np.maximum(18.0, df_yr["tmax_c"].to_numpy(dtype=float) - 8.5)
            df_yr["tmin_c"] = np.round(tmin, 2)
            df_yr["et0_mm"] = estimate_hargreaves_et0(
                tmin_c=tmin,
                tmax_c=df_yr["tmax_c"].to_numpy(dtype=float),
                doy=doy,
                lat_deg=float(cell["centre_lat"]),
            )
            year_dailies.append(df_yr)
            if yr == years[0]:
                for rec in manifest.records:
                    d_rec = asdict(rec)
                    if d_rec["dataset_key"] not in live_keys:
                        cell_prov.append(d_rec)

        daily_all = pd.concat(year_dailies, ignore_index=True)
        if power_df is not None and not power_df.empty:
            daily_all = _merge_power_rain_and_temp(daily_all, power_df)

        daily_frames_by_cell[cell_id] = daily_all
        provenance_by_cell[cell_id] = cell_prov

        cube = build_dekad_cube(daily_all, provenance_id=f"{cell_id}_phase3_live" if fetch_live_baseline else f"{cell_id}_pilot")
        cube_frames.append(cube)

        pheno = extract_ndvi_phenology(cube, cfg=config)
        if not pheno.empty:
            phenology_rows.extend(pheno.to_dict(orient="records"))

        feats = extract_season_features(cube, daily_df=daily_all, slope_pct=slope_pct, cfg=config)
        feature_frames.append(feats)

        pilot_cell_rows.append(
            {
                "cell_id": cell_id,
                "region_name": cell["region_name"],
                "row_idx": int(cell["row_idx"]),
                "col_idx": int(cell["col_idx"]),
                "centre_lat": float(cell["centre_lat"]),
                "centre_lon": float(cell["centre_lon"]),
                "bbox": list(cell["bbox"]),
                "geom": _bbox_to_ewkt_polygon(cell["bbox"]),
                "centroid": _point_to_ewkt(float(cell["centre_lon"]), float(cell["centre_lat"])),
                "elevation_m": round(215.0 + 18.0 * idx, 1),
                "slope_pct": slope_pct,
                "soil_texture": soil_summary.get("soil_texture") if soil_summary else "Sandy clay loam",
                "soil_organic_carbon_g_kg": soil_summary.get("soil_organic_carbon_g_kg") if soil_summary else 14.0,
                "soil_ph": soil_summary.get("soil_ph") if soil_summary else 5.8,
                "native_resolutions_km": cell["native_resolutions_km"],
            }
        )

    cube_all = pd.concat(cube_frames, ignore_index=True) if cube_frames else pd.DataFrame()
    features_all = pd.concat(feature_frames, ignore_index=True) if feature_frames else pd.DataFrame()
    enriched_features = enrich_season_features_with_models(features_all)

    all_passports: list[dict[str, Any]] = []
    all_strategies: list[dict[str, Any]] = []
    analogs_by_cell: dict[str, dict[str, Any]] = {}

    for cell in pilot_cell_rows:
        cid = str(cell["cell_id"])
        cell_feats = enriched_features[enriched_features["cell_id"] == cid].copy()
        soil_info = soil_baselines.get(cid)
        soil_ph = float(soil_info["soil_ph"]) if soil_info and soil_info.get("soil_ph") is not None else None

        strat_rows = score_strategies_for_cell(
            cell_id=cid,
            cell_features_df=cell_feats,
            crops_df=crops_df,
            rotations_df=rotations_df,
            slope_pct=float(cell["slope_pct"]),
            soil_ph=soil_ph,
            weights=DEFAULT_WEIGHTS,
        )
        passports = generate_evidence_passports(
            cell_id=cid,
            strategy_records=strat_rows,
            cell_features_df=cell_feats,
            rotations_df=rotations_df,
            scale_honesty=scale_honesty_payload,
            cell_meta={"center_lat": cell["centre_lat"], "center_lon": cell["centre_lon"]},
            provenance_records=provenance_by_cell.get(cid),
            farm_area_ha=farm_area_ha,
            soil_summary=soil_info,
        )
        all_passports.extend(passports)
        all_strategies.extend(strat_rows)

        analogs_by_cell[cid] = {
            "major": retrieve_analog_seasons(cell_feats, season="major"),
            "minor": retrieve_analog_seasons(cell_feats, season="minor"),
        }

    bundle = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "region": {
            "region_name": config.region_name,
            "region_label": config.region_label,
            "centre_lat": config.centre_lat,
            "centre_lon": config.centre_lon,
            "years": list(years),
        },
        "farm_area_ha": farm_area_ha,
        "scale_honesty": scale_honesty_payload,
        "non_global_us_baselines": NON_GLOBAL_US_BASELINES,
        "pilot_cells": pilot_cell_rows,
        "live_soil_baselines": soil_baselines,
        "earthdata_snapshot": earthdata_snapshot,
        "dekad_timeseries": cube_all.to_dict(orient="records") if not cube_all.empty else [],
        "season_features": enriched_features.to_dict(orient="records") if not enriched_features.empty else [],
        "phenology_summary": phenology_rows,
        "analog_seasons": analogs_by_cell,
        "evidence_passports": all_passports,
        "strategy_scores": all_strategies,
    }
    return _sanitize_json_value(bundle)


def export_bundle_json(bundle: dict[str, Any], out_path: str | Path) -> Path:
    """Write a sanitized pilot bundle JSON file to disk."""
    target = Path(out_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    sanitized = _sanitize_json_value(bundle)
    target.write_text(json.dumps(sanitized, indent=2), encoding="utf-8")
    return target


def publish_bundle_to_supabase(
    bundle: dict[str, Any],
    dry_run: bool = True,
    supabase_url: str | None = None,
    service_key: str | None = None,
) -> dict[str, Any]:
    """Upsert pilot tables into Supabase (or inspect counts cleanly in dry_run)."""
    summary_counts = {
        "pilot_cells": len(bundle.get("pilot_cells", [])),
        "dekad_timeseries": len(bundle.get("dekad_timeseries", [])),
        "season_features": len(bundle.get("season_features", [])),
        "evidence_passports": len(bundle.get("evidence_passports", [])),
        "strategy_scores": len(bundle.get("strategy_scores", [])),
    }

    if dry_run:
        return {"status": "dry_run", "tables": summary_counts}

    if supabase_url is None and service_key is None:
        try:
            from dotenv import load_dotenv

            load_dotenv(".env.local", override=False)
        except ImportError:
            pass

    url = os.environ.get("SUPABASE_URL", "") if supabase_url is None else supabase_url
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") if service_key is None else service_key

    if not url or not key:
        return {"status": "skipped_no_credentials", "tables": summary_counts}

    from supabase import create_client

    client = create_client(url, key)
    if bundle.get("pilot_cells"):
        cells_payload = _project_rows(bundle["pilot_cells"], PILOT_CELL_SQL_COLUMNS)
        client.table("pilot_cells").upsert(cells_payload, on_conflict="cell_id").execute()
    if bundle.get("evidence_passports"):
        passports_payload = _project_rows(bundle["evidence_passports"], EVIDENCE_PASSPORT_SQL_COLUMNS)
        client.table("evidence_passports").upsert(
            passports_payload, on_conflict="passport_id"
        ).execute()
    if bundle.get("strategy_scores"):
        strategies_payload = _project_rows(bundle["strategy_scores"], STRATEGY_SCORE_SQL_COLUMNS)
        client.table("strategy_scores").upsert(
            strategies_payload, on_conflict="cell_id,strategy_code"
        ).execute()
    if bundle.get("season_features"):
        features_payload = _project_rows(bundle["season_features"], SEASON_FEATURES_SQL_COLUMNS)
        client.table("season_features").upsert(
            features_payload, on_conflict="cell_id,year,season"
        ).execute()
    if bundle.get("dekad_timeseries"):
        dekad_payload = _project_rows(bundle["dekad_timeseries"], DEKAD_TIMESERIES_SQL_COLUMNS)
        for start in range(0, len(dekad_payload), 500):
            client.table("dekad_timeseries").upsert(
                dekad_payload[start : start + 500], on_conflict="cell_id,year,dekad"
            ).execute()

    return {"status": "published", "tables": summary_counts}
