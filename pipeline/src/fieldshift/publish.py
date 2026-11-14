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


def build_pilot_bundle(
    cfg: PilotConfig | None = None,
    years: Sequence[int] = (2022, 2023, 2024, 2025),
    farm_area_ha: float = 2.0,
    cell_limit: int | None = 3,
    fetch_live_baseline: bool = False,
) -> dict[str, Any]:
    """Run the end-to-end Ashanti pilot pipeline and assemble Supabase-ready JSON tables."""
    config = cfg or load_pilot_config()
    crops_df = load_crops_table()
    rotations_df = load_rotations_table()

    all_cells = generate_pilot_cells(config)
    selected_cells = all_cells[:cell_limit] if cell_limit is not None else all_cells
    start_yyyymmdd = f"{min(years)}0101"
    end_yyyymmdd = f"{max(years)}1231"

    pilot_cell_rows: list[dict[str, Any]] = []
    daily_frames_by_cell: dict[str, pd.DataFrame] = {}
    cube_frames: list[pd.DataFrame] = []
    feature_frames: list[pd.DataFrame] = []
    phenology_rows: list[dict[str, Any]] = []
    soil_baselines: dict[str, dict[str, Any]] = {}
    provenance_by_cell: dict[str, list[dict[str, Any]]] = {}

    scale_assessment = evaluate_scale_honesty(farm_area_ha, config.dataset_resolutions_km)
    scale_honesty_payload = {
        "farm_area_ha": farm_area_ha,
        "datasets": scale_assessment,
        "summary": _scale_honesty_summary(farm_area_ha, scale_assessment),
    }

    for idx, cell in enumerate(selected_cells):
        cell_id = str(cell["cell_id"])
        slope_pct = round(3.8 + 1.4 * idx, 2)

        power_df: pd.DataFrame | None = None
        soil_summary: dict[str, Any] | None = None
        live_prov: list[dict[str, Any]] = []
        if fetch_live_baseline:
            power_df, soil_summary, live_prov = _fetch_optional_live_cell_baselines(
                lat=float(cell["centre_lat"]),
                lon=float(cell["centre_lon"]),
                start_date=start_yyyymmdd,
                end_date=end_yyyymmdd,
            )

        if soil_summary:
            soil_baselines[cell_id] = soil_summary

        year_dailies: list[pd.DataFrame] = []
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
            if not cell_prov or yr == years[0]:
                for rec in manifest.records:
                    d_rec = asdict(rec)
                    # Avoid listing synthetic baseline entries for the same dataset already fetched live
                    if not any(
                        existing.get("dataset_key") == d_rec["dataset_key"]
                        and existing.get("retrieval_mode") == "live"
                        for existing in live_prov
                    ):
                        cell_prov.append(d_rec)

        daily_all = pd.concat(year_dailies, ignore_index=True)
        if power_df is not None and not power_df.empty:
            daily_all = _merge_power_rain_and_temp(daily_all, power_df)

        daily_frames_by_cell[cell_id] = daily_all
        provenance_by_cell[cell_id] = cell_prov

        cube = build_dekad_cube(daily_all)
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
                "slope_pct": slope_pct,
                "soil_texture": soil_summary.get("soil_texture") if soil_summary else "sandy_clay_loam",
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
    url = supabase_url or os.environ.get("SUPABASE_URL", "")
    key = service_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    summary_counts = {
        "pilot_cells": len(bundle.get("pilot_cells", [])),
        "dekad_timeseries": len(bundle.get("dekad_timeseries", [])),
        "season_features": len(bundle.get("season_features", [])),
        "evidence_passports": len(bundle.get("evidence_passports", [])),
        "strategy_scores": len(bundle.get("strategy_scores", [])),
    }

    if dry_run:
        return {"status": "dry_run", "tables": summary_counts}

    if not url or not key:
        return {"status": "skipped_no_credentials", "tables": summary_counts}

    from supabase import create_client

    client = create_client(url, key)
    if bundle.get("pilot_cells"):
        client.table("pilot_cells").upsert(bundle["pilot_cells"], on_conflict="cell_id").execute()
    if bundle.get("evidence_passports"):
        client.table("evidence_passports").upsert(
            bundle["evidence_passports"], on_conflict="passport_id"
        ).execute()
    if bundle.get("strategy_scores"):
        client.table("strategy_scores").upsert(
            bundle["strategy_scores"], on_conflict="cell_id,strategy_code"
        ).execute()
    if bundle.get("season_features"):
        client.table("season_features").upsert(
            bundle["season_features"], on_conflict="cell_id,year,season"
        ).execute()
    if bundle.get("dekad_timeseries"):
        client.table("dekad_timeseries").upsert(
            bundle["dekad_timeseries"], on_conflict="cell_id,year,dekad"
        ).execute()

    return {"status": "published", "tables": summary_counts}
