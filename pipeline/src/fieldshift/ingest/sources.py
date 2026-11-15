"""Data-source adapters (NASA POWER, ERA5-Land, MODIS COGs, Copernicus DEM, SoilGrids, iSDAsoil, earthaccess)."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import math
import os
import time
from typing import Any, Sequence
from urllib.parse import urlencode, urlparse

import numpy as np
import pandas as pd
import requests

from fieldshift.ingest.manifest import (
    DATASETS_REGISTRY,
    ProvenanceManifest,
    ProvenanceRecord,
    compute_payload_sha256,
)

POWER_DAILY_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
SOILGRIDS_QUERY_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
ERA5_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
ELEVATION_API_URL = "https://api.open-meteo.com/v1/elevation"
PLANETARY_COMPUTER_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
PLANETARY_COMPUTER_SAS_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/token"

DEFAULT_POWER_PARAMETERS: tuple[str, ...] = (
    "PRECTOTCORR",
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "ALLSKY_SFC_SW_DWN",
    "RH2M",
)
EXTENDED_POWER_PARAMETERS: tuple[str, ...] = (
    *DEFAULT_POWER_PARAMETERS,
    "GWETTOP",
    "GWETROOT",
    "CLOUD_AMT",
)


def build_power_request_url(
    lat: float,
    lon: float,
    start_yyyymmdd: str,
    end_yyyymmdd: str,
    parameters: Sequence[str] = DEFAULT_POWER_PARAMETERS,
) -> str:
    """Construct a NASA POWER daily agroclimatology API query URL."""
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"Latitude out of range: {lat}")
    if not (-180.0 <= lon <= 180.0):
        raise ValueError(f"Longitude out of range: {lon}")
    if len(start_yyyymmdd) != 8 or len(end_yyyymmdd) != 8:
        raise ValueError("start_yyyymmdd and end_yyyymmdd must use YYYYMMDD format")

    params = {
        "parameters": ",".join(parameters),
        "community": "AG",
        "longitude": f"{lon:.4f}",
        "latitude": f"{lat:.4f}",
        "start": start_yyyymmdd,
        "end": end_yyyymmdd,
        "format": "JSON",
    }
    return f"{POWER_DAILY_BASE_URL}?{urlencode(params)}"


def fetch_nasa_power_daily(
    lat: float,
    lon: float,
    start_yyyymmdd: str,
    end_yyyymmdd: str,
    parameters: Sequence[str] = DEFAULT_POWER_PARAMETERS,
    timeout: int = 20,
    session: requests.Session | None = None,
) -> tuple[pd.DataFrame, ProvenanceRecord]:
    """Fetch daily agroclimatic observations from NASA POWER REST API."""
    url = build_power_request_url(lat, lon, start_yyyymmdd, end_yyyymmdd, parameters)
    client = session or requests
    resp = client.get(url, timeout=timeout)
    resp.raise_for_status()
    payload = resp.json()

    param_map: dict[str, dict[str, float]] = payload.get("properties", {}).get("parameter", {})
    if not param_map:
        raise ValueError("NASA POWER response missing properties.parameter")

    all_dates = sorted({dt for series in param_map.values() for dt in series.keys()})
    rows: list[dict[str, Any]] = []
    for dt_key in all_dates:
        row: dict[str, Any] = {"date": pd.to_datetime(dt_key, format="%Y%m%d")}
        for p_name in parameters:
            val = float(param_map.get(p_name, {}).get(dt_key, -999.0))
            row[p_name.lower()] = np.nan if val <= -990.0 else val
        rows.append(row)

    df = pd.DataFrame(rows).rename(
        columns={
            "prectotcorr": "rain_power_mm",
            "t2m": "tmean_c",
            "t2m_max": "tmax_c",
            "t2m_min": "tmin_c",
            "allsky_sfc_sw_dwn": "solar_rad_mj_m2",
            "rh2m": "rh_pct",
            "gwettop": "power_gwettop",
            "gwetroot": "power_gwetroot",
            "cloud_amt": "cloud_amt_pct",
        }
    )
    spec = DATASETS_REGISTRY["nasa_power"]
    record = ProvenanceRecord(
        dataset_key=spec.dataset_key,
        short_name=spec.short_name,
        product_version=spec.product_version,
        retrieval_mode="live",
        bbox=(round(lon - 0.25, 4), round(lat - 0.25, 4), round(lon + 0.25, 4), round(lat + 0.25, 4)),
        temporal_range=(
            f"{start_yyyymmdd[:4]}-{start_yyyymmdd[4:6]}-{start_yyyymmdd[6:]}",
            f"{end_yyyymmdd[:4]}-{end_yyyymmdd[4:6]}-{end_yyyymmdd[6:]}",
        ),
        source_uri=url,
        payload_sha256=compute_payload_sha256(payload),
        record_count=len(df),
    )
    return df, record


def classify_usda_texture(clay_pct: float, sand_pct: float) -> str:
    """Assign a simplified USDA topsoil texture class from clay and sand percentages."""
    silt_pct = max(0.0, 100.0 - clay_pct - sand_pct)
    if clay_pct >= 40.0:
        return "Clay"
    if clay_pct >= 27.0 and sand_pct < 45.0:
        return "Clay loam"
    if clay_pct >= 20.0 and sand_pct >= 45.0:
        return "Sandy clay loam"
    if silt_pct >= 50.0 and clay_pct < 27.0:
        return "Silt loam"
    if sand_pct >= 70.0 and clay_pct < 15.0:
        return "Sandy loam"
    if sand_pct >= 52.0:
        return "Sandy loam"
    return "Loam"


def fetch_soilgrids_point(
    lat: float,
    lon: float,
    timeout: int = 25,
    session: requests.Session | None = None,
) -> tuple[dict[str, Any], ProvenanceRecord]:
    """Query ISRIC SoilGrids v2.0 (0-5 cm mean), probing sub-cell offsets if exact point is masked."""
    client = session or requests
    # Sub-cell offsets stay inside the 0.05-deg (~5.5 km) grid cell when centroids hit settlements/water
    offsets: tuple[tuple[float, float], ...] = (
        (0.0, 0.0),
        (-0.01, -0.01),
        (0.01, -0.01),
        (-0.01, 0.01),
        (0.01, 0.01),
        (0.0, -0.015),
        (-0.015, 0.0),
    )

    last_error: Exception | None = None
    for dlat, dlon in offsets:
        q_lat = round(lat + dlat, 4)
        q_lon = round(lon + dlon, 4)
        params = [
            ("lon", f"{q_lon:.4f}"),
            ("lat", f"{q_lat:.4f}"),
            ("property", "phh2o"),
            ("property", "soc"),
            ("property", "clay"),
            ("property", "sand"),
            ("property", "silt"),
            ("depth", "0-5cm"),
            ("value", "mean"),
        ]
        payload: dict[str, Any] | None = None
        for attempt in range(3):
            try:
                resp = client.get(SOILGRIDS_QUERY_URL, params=params, timeout=timeout)
                resp.raise_for_status()
                payload = resp.json()
                break
            except Exception as exc:
                last_error = exc
                if session is not None:
                    raise
                time.sleep(0.8 * (attempt + 1))

        if not payload:
            continue

        layers = payload.get("properties", {}).get("layers", [])
        raw_means: dict[str, float] = {}
        for layer in layers:
            name = str(layer.get("name", ""))
            d_factor = float(layer.get("unit_measure", {}).get("d_factor", 1) or 1)
            depths = layer.get("depths", [])
            if depths:
                val = depths[0].get("values", {}).get("mean")
                if val is not None:
                    raw_means[name] = float(val) / d_factor

        required_props = ("phh2o", "soc", "clay", "sand")
        if all(k in raw_means and math.isfinite(raw_means[k]) for k in required_props):
            clay_pct = round(raw_means["clay"], 1)
            sand_pct = round(raw_means["sand"], 1)
            silt_pct = round(raw_means.get("silt", max(0.0, 100.0 - clay_pct - sand_pct)), 1)
            soil_ph = round(raw_means["phh2o"], 2)
            soc_g_kg = round(raw_means["soc"], 2)

            summary: dict[str, Any] = {
                "lat": q_lat,
                "lon": q_lon,
                "soil_ph": soil_ph,
                "soil_organic_carbon_g_kg": soc_g_kg,
                "clay_pct": clay_pct,
                "sand_pct": sand_pct,
                "silt_pct": silt_pct,
                "soil_texture": classify_usda_texture(clay_pct, sand_pct),
            }
            if dlat != 0.0 or dlon != 0.0:
                summary["offset_sampled_from_centroid"] = True

            spec = DATASETS_REGISTRY["soilgrids"]
            record = ProvenanceRecord(
                dataset_key=spec.dataset_key,
                short_name=spec.short_name,
                product_version=spec.product_version,
                retrieval_mode="live",
                bbox=(round(q_lon - 0.002, 4), round(q_lat - 0.002, 4), round(q_lon + 0.002, 4), round(q_lat + 0.002, 4)),
                temporal_range=("static", "static"),
                source_uri=f"{SOILGRIDS_QUERY_URL}?lon={q_lon:.4f}&lat={q_lat:.4f}",
                payload_sha256=compute_payload_sha256(payload),
                record_count=len(layers),
            )
            return summary, record

    if last_error is not None:
        raise RuntimeError(f"ISRIC SoilGrids unavailable at ({lat}, {lon}): {last_error}") from last_error
    raise RuntimeError(f"ISRIC SoilGrids returned only masked pixels around ({lat}, {lon})")


ISDASOIL_BASE_URL = "https://api.isda-africa.com"
_ISDA_TOKEN_CACHE: dict[str, str] = {}


def _extract_isda_value(prop_payload: Any, depth: str = "0-20") -> float | None:
    if isinstance(prop_payload, list):
        for entry in prop_payload:
            if not isinstance(entry, dict):
                continue
            d_obj = entry.get("depth")
            d_val = d_obj.get("value") if isinstance(d_obj, dict) else d_obj
            if d_val in (depth, "0-20cm", None):
                val = entry.get("value")
                if isinstance(val, dict):
                    val = val.get("value", val.get("mean"))
                if val is not None:
                    return float(val)
        return None
    if not isinstance(prop_payload, dict):
        return None
    if depth in prop_payload and isinstance(prop_payload[depth], dict):
        val = prop_payload[depth].get("value", prop_payload[depth].get("mean"))
        if isinstance(val, dict):
            val = val.get("value", val.get("mean"))
        return float(val) if val is not None else None
    for entry in prop_payload.get("property", []) if isinstance(prop_payload.get("property"), list) else []:
        if isinstance(entry, dict):
            d_obj = entry.get("depth")
            d_val = d_obj.get("value") if isinstance(d_obj, dict) else d_obj
            if d_val in (depth, "0-20cm"):
                val = entry.get("value")
                if isinstance(val, dict):
                    val = val.get("value")
                return float(val) if val is not None else None
    return None


def fetch_isdasoil_point(
    lat: float,
    lon: float,
    username: str | None = None,
    password: str | None = None,
    timeout: int = 25,
    session: requests.Session | None = None,
) -> tuple[dict[str, Any], ProvenanceRecord]:
    """Query free CC-BY-4.0 iSDAsoil v2 API (30 m African topsoil) using credentials."""
    user = username if username is not None else os.environ.get("ISDASOIL_USERNAME", "").strip()
    pwd = password if password is not None else os.environ.get("ISDASOIL_PASSWORD", "").strip()
    if not user or not pwd:
        raise ValueError("ISDASOIL_USERNAME and ISDASOIL_PASSWORD are required for iSDAsoil v2 lookup")

    client = session or requests
    token = _ISDA_TOKEN_CACHE.get(user) if session is None else None
    if not token:
        for attempt in range(3):
            try:
                auth_resp = client.post(
                    f"{ISDASOIL_BASE_URL}/login",
                    data={"username": user, "password": pwd},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=timeout,
                )
                auth_resp.raise_for_status()
                token = auth_resp.json().get("access_token")
                break
            except Exception:
                if session is not None or attempt == 2:
                    raise
                time.sleep(1.0 * (attempt + 1))
        if not token:
            raise RuntimeError("iSDAsoil authentication response missing access_token")
        if session is None:
            _ISDA_TOKEN_CACHE[user] = token

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    params = [("lat", f"{lat:.5f}"), ("lon", f"{lon:.5f}"), ("depth", "0-20")]

    payload: dict[str, Any] = {}
    for attempt in range(3):
        try:
            resp = client.get(
                f"{ISDASOIL_BASE_URL}/isdasoil/v2/soilproperty",
                headers=headers,
                params=params,
                timeout=timeout,
            )
            resp.raise_for_status()
            payload = resp.json()
            break
        except Exception:
            if session is not None or attempt == 2:
                raise
            time.sleep(1.0 * (attempt + 1))

    props = payload.get("property", payload) if isinstance(payload, dict) else {}

    ph_val = _extract_isda_value(props.get("ph"))
    soc_val = _extract_isda_value(props.get("carbon_organic"))
    n_val = _extract_isda_value(props.get("nitrogen_total"))
    clay_val = _extract_isda_value(props.get("clay_content"))
    sand_val = _extract_isda_value(props.get("sand_content"))
    silt_val = _extract_isda_value(props.get("silt_content"))

    if ph_val is None or soc_val is None or clay_val is None or sand_val is None:
        raise RuntimeError(f"iSDAsoil v2 returned incomplete properties at ({lat}, {lon}): ph={ph_val}, soc={soc_val}")

    clay_pct = round(clay_val, 1)
    sand_pct = round(sand_val, 1)
    silt_pct = round(silt_val if silt_val is not None else max(0.0, 100.0 - clay_pct - sand_pct), 1)

    summary = {
        "lat": lat,
        "lon": lon,
        "resolution_km": 0.03,
        "source": "isdasoil_v2",
        "soil_ph": round(ph_val, 2),
        "soil_organic_carbon_g_kg": round(soc_val, 2),
        "total_nitrogen_g_kg": round(n_val, 3) if n_val is not None else None,
        "clay_pct": clay_pct,
        "sand_pct": sand_pct,
        "silt_pct": silt_pct,
        "soil_texture": classify_usda_texture(clay_pct, sand_pct),
    }

    spec = DATASETS_REGISTRY["isdasoil"]
    record = ProvenanceRecord(
        dataset_key=spec.dataset_key,
        short_name=spec.short_name,
        product_version=spec.product_version,
        retrieval_mode="live",
        bbox=(round(lon - 0.0003, 4), round(lat - 0.0003, 4), round(lon + 0.0003, 4), round(lat + 0.0003, 4)),
        temporal_range=("static", "static"),
        source_uri=f"{ISDASOIL_BASE_URL}/isdasoil/v2/soilproperty?lat={lat:.4f}&lon={lon:.4f}",
        payload_sha256=compute_payload_sha256(payload),
        record_count=len(props) if isinstance(props, dict) else 1,
    )
    return summary, record


def search_earthaccess_granules(
    short_name: str,
    bbox: tuple[float, float, float, float],
    temporal: tuple[str, str],
    dry_run: bool = True,
    count: int = 10,
) -> dict[str, Any]:
    """Query NASA Earthdata CMR granules via earthaccess (supports offline dry_run)."""
    if len(bbox) != 4 or bbox[0] >= bbox[2] or bbox[1] >= bbox[3]:
        raise ValueError("bbox must be (min_lon, min_lat, max_lon, max_lat)")
    if len(temporal) != 2:
        raise ValueError("temporal must be (start_iso_date, end_iso_date)")

    if dry_run:
        return {
            "short_name": short_name,
            "bounding_box": bbox,
            "temporal": temporal,
            "count": count,
            "mode": "dry_run",
            "granules": [],
        }

    import earthaccess

    results = earthaccess.search_data(
        short_name=short_name,
        bounding_box=bbox,
        temporal=temporal,
        count=count,
    )
    granules = [
        {
            "producer_granule_id": item.get("umm", {}).get("GranuleUR", ""),
            "links": item.data_links() if hasattr(item, "data_links") else [],
        }
        for item in results
    ]
    return {
        "short_name": short_name,
        "bounding_box": bbox,
        "temporal": temporal,
        "count": len(granules),
        "mode": "live",
        "granules": granules,
    }


def generate_ashanti_pilot_raw_daily(
    cell_id: str,
    year: int,
    seed: int = 42,
    centre_lat: float = 6.85,
    centre_lon: float = -1.45,
    half_width_deg: float = 0.025,
) -> tuple[pd.DataFrame, ProvenanceManifest]:
    """Generate synthetic bimodal Ashanti daily observations plus a ProvenanceManifest."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(f"{year}-01-01", f"{year}-12-31", freq="D")
    n_days = len(dates)
    doy = dates.day_of_year.to_numpy(dtype=float)

    # Bimodal Ashanti rainy seasons: major (~DOY 135, May) and minor (~DOY 280, Oct)
    major_wave = np.exp(-0.5 * ((doy - 135.0) / 36.0) ** 2)
    minor_wave = 0.80 * np.exp(-0.5 * ((doy - 280.0) / 26.0) ** 2)
    rain_prob = np.clip(0.06 + 0.56 * major_wave + 0.48 * minor_wave, 0.03, 0.78)

    rain_events = rng.random(n_days) < rain_prob
    rain_intensity = rng.gamma(shape=1.8, scale=8.5, size=n_days)
    rain_imerg_mm = np.where(rain_events, rain_intensity, 0.0)
    rain_era5_mm = np.clip(
        rain_imerg_mm * rng.normal(0.95, 0.14, size=n_days) + rng.normal(0.1, 0.4, size=n_days),
        0.0,
        None,
    )

    sm_series = np.empty(n_days, dtype=float)
    sm_val = 0.15
    for idx in range(n_days):
        sm_val = 0.90 * sm_val + 0.006 * rain_imerg_mm[idx] + rng.normal(0.0, 0.004)
        sm_val = float(np.clip(sm_val, 0.08, 0.44))
        sm_series[idx] = sm_val

    cloud_prob = np.clip(
        0.14 + 0.62 * major_wave + 0.52 * minor_wave + rng.normal(0.0, 0.10, size=n_days),
        0.02,
        0.96,
    )

    ndvi_true = np.clip(
        0.22 + 0.46 * major_wave + 0.36 * minor_wave + 0.25 * (sm_series - 0.15),
        0.18,
        0.82,
    )
    cloud_bias = np.where(cloud_prob > 0.35, -0.18 * cloud_prob, 0.0)
    ndvi_raw = np.clip(ndvi_true + cloud_bias + rng.normal(0.0, 0.025, size=n_days), 0.05, 0.92)

    seasonal_cool = 3.6 * major_wave + 2.8 * minor_wave
    tmax_c = np.round(33.8 - seasonal_cool + rng.normal(0.0, 1.1, size=n_days), 2)
    tmin_c = np.round(21.4 - 0.4 * seasonal_cool + rng.normal(0.0, 0.8, size=n_days), 2)
    lst_max_c = np.round(tmax_c + np.where(ndvi_true < 0.30, 5.2, 2.1), 2)
    et0_mm = np.round(np.clip(4.6 - 0.9 * major_wave + rng.normal(0.0, 0.35, size=n_days), 2.5, 6.8), 2)

    cell_bbox = (
        round(centre_lon - half_width_deg, 6),
        round(centre_lat - half_width_deg, 6),
        round(centre_lon + half_width_deg, 6),
        round(centre_lat + half_width_deg, 6),
    )

    df = pd.DataFrame(
        {
            "cell_id": cell_id,
            "date": dates,
            "rain_imerg_mm": np.round(rain_imerg_mm, 2),
            "rain_era5_mm": np.round(rain_era5_mm, 2),
            "smap_sm_m3m3": np.round(sm_series, 4),
            "ndvi_raw": np.round(ndvi_raw, 4),
            "cloud_prob": np.round(cloud_prob, 3),
            "tmax_c": tmax_c,
            "tmin_c": tmin_c,
            "lst_max_c": lst_max_c,
            "et0_mm": et0_mm,
        }
    )

    payload_digest = compute_payload_sha256(df.to_csv(index=False))
    temporal_range = (f"{year}-01-01", f"{year}-12-31")

    manifest = ProvenanceManifest(
        manifest_id=f"{cell_id}_{year}_pilot",
        region_name="ashanti_pilot",
        cell_id=cell_id,
        notes="Synthetic Ashanti bimodal pilot archive for offline pipeline QC & testing.",
    )
    power_uri = build_power_request_url(centre_lat, centre_lon, f"{year}0101", f"{year}1231")

    for ds_key in ("imerg", "smap", "smap_root_zone", "modis_ndvi", "nasa_power", "era5_land", "srtm"):
        spec = DATASETS_REGISTRY[ds_key]
        manifest.add_record(
            ProvenanceRecord(
                dataset_key=spec.dataset_key,
                short_name=spec.short_name,
                product_version=spec.product_version,
                retrieval_mode="synthetic_pilot",
                bbox=cell_bbox,
                temporal_range=temporal_range,
                source_uri=power_uri if ds_key == "nasa_power" else f"cmr://{spec.short_name}.{spec.product_version}",
                payload_sha256=payload_digest,
                record_count=n_days,
            )
        )

    return df, manifest


def fetch_earthdata_ashanti_snapshot(
    bbox: tuple[float, float, float, float] = (-1.70, 6.60, -1.20, 7.10),
    temporal: tuple[str, str] = ("2024-05-01", "2024-05-05"),
    sample_imerg_netcdf: bool = True,
) -> tuple[dict[str, Any], list[ProvenanceRecord]]:
    """Verify live NASA Earthdata CMR granules and optionally sample a live GPM IMERG NetCDF granule."""
    import earthaccess

    auth = earthaccess.login(strategy="environment")
    if not auth.authenticated:
        raise RuntimeError("Earthdata environment authentication failed (check EARTHDATA_* env vars)")

    dataset_keys = ("imerg", "smap", "smap_root_zone", "modis_ndvi", "modis_lst")
    granule_summary: dict[str, Any] = {}
    records: list[ProvenanceRecord] = []

    imerg_results: list[Any] = []
    for ds_key in dataset_keys:
        spec = DATASETS_REGISTRY[ds_key]
        cmr_version = "07" if ds_key == "imerg" else spec.product_version
        hits = earthaccess.search_data(
            short_name=spec.short_name,
            version=cmr_version,
            bounding_box=bbox,
            temporal=temporal,
            count=5,
        )
        links = [link for item in hits[:2] for link in (item.data_links() if hasattr(item, "data_links") else [])]
        granule_summary[ds_key] = {
            "short_name": spec.short_name,
            "version": cmr_version,
            "granule_count": len(hits),
            "sample_links": links[:2],
        }
        if ds_key == "imerg":
            imerg_results = list(hits)
        if hits:
            records.append(
                ProvenanceRecord(
                    dataset_key=spec.dataset_key,
                    short_name=spec.short_name,
                    product_version=cmr_version,
                    retrieval_mode="live",
                    bbox=bbox,
                    temporal_range=temporal,
                    source_uri=links[0] if links else f"cmr://{spec.short_name}.{cmr_version}",
                    payload_sha256=compute_payload_sha256(granule_summary[ds_key]),
                    record_count=len(hits),
                )
            )

    imerg_sample: dict[str, Any] | None = None
    if sample_imerg_netcdf and imerg_results:
        try:
            import netCDF4

            opened = earthaccess.open([imerg_results[0]])
            if opened:
                with opened[0] as fobj:
                    raw_bytes = fobj.read()
                with netCDF4.Dataset("inmemory.nc4", memory=raw_bytes) as nc:
                    lats = np.asarray(nc.variables["lat"][:], dtype=float)
                    lons = np.asarray(nc.variables["lon"][:], dtype=float)
                    lat_idx = np.where((lats >= bbox[1]) & (lats <= bbox[3]))[0]
                    lon_idx = np.where((lons >= bbox[0]) & (lons <= bbox[2]))[0]
                    precip_var = nc.variables["precipitation"]
                    if lat_idx.size > 0 and lon_idx.size > 0:
                        # GPM_3IMERGDF shape is usually (time, lon, lat) or (time, lat, lon)
                        dims = precip_var.dimensions
                        arr = np.asarray(precip_var[:], dtype=float)
                        if dims == ("time", "lon", "lat"):
                            sub = arr[0, np.ix_(lon_idx, lat_idx)]
                        else:
                            sub = arr[0, np.ix_(lat_idx, lon_idx)]
                        valid = sub[np.isfinite(sub) & (sub >= 0.0)]
                        imerg_sample = {
                            "mean_rain_mm_day": round(float(np.mean(valid)), 3) if valid.size > 0 else None,
                            "max_rain_mm_day": round(float(np.max(valid)), 3) if valid.size > 0 else None,
                            "pixel_count": int(valid.size),
                            "temporal_sample": temporal[0],
                        }
        except Exception as exc:
            imerg_sample = {"note": f"CMR verified; NetCDF subset deferred ({type(exc).__name__})"}

    return {"granules": granule_summary, "imerg_sample": imerg_sample}, records


def fetch_era5_land_daily(
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
    timeout: int = 30,
    session: requests.Session | None = None,
) -> tuple[pd.DataFrame, ProvenanceRecord]:
    """Fetch live ECMWF ERA5-Land daily rainfall, ET0, cloud cover, and 0-7 cm soil moisture."""
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join(
            (
                "precipitation_sum",
                "et0_fao_evapotranspiration",
                "temperature_2m_max",
                "temperature_2m_min",
                "cloud_cover_mean",
                "soil_moisture_0_to_7cm_mean",
            )
        ),
        "timezone": "UTC",
    }
    client = session or requests
    resp = client.get(ERA5_ARCHIVE_URL, params=params, timeout=timeout)
    resp.raise_for_status()
    payload = resp.json()
    daily = payload.get("daily", {})
    times = daily.get("time", [])
    if not times:
        raise ValueError(f"Open-Meteo ERA5-Land returned no daily timestamps for ({lat}, {lon})")

    cloud_pct = pd.to_numeric(pd.Series(daily.get("cloud_cover_mean")), errors="coerce")
    df = pd.DataFrame(
        {
            "date": pd.to_datetime(times),
            "rain_era5_mm": pd.to_numeric(pd.Series(daily.get("precipitation_sum")), errors="coerce"),
            "et0_mm": pd.to_numeric(pd.Series(daily.get("et0_fao_evapotranspiration")), errors="coerce"),
            "tmax_era5_c": pd.to_numeric(pd.Series(daily.get("temperature_2m_max")), errors="coerce"),
            "tmin_era5_c": pd.to_numeric(pd.Series(daily.get("temperature_2m_min")), errors="coerce"),
            "cloud_prob_era5": np.clip(cloud_pct / 100.0, 0.0, 1.0),
            "smap_sm_m3m3": pd.to_numeric(pd.Series(daily.get("soil_moisture_0_to_7cm_mean")), errors="coerce"),
        }
    )
    spec = DATASETS_REGISTRY["era5_land"]
    record = ProvenanceRecord(
        dataset_key=spec.dataset_key,
        short_name=spec.short_name,
        product_version=spec.product_version,
        retrieval_mode="live",
        bbox=(round(lon - 0.05, 4), round(lat - 0.05, 4), round(lon + 0.05, 4), round(lat + 0.05, 4)),
        temporal_range=(start_date, end_date),
        source_uri=f"{ERA5_ARCHIVE_URL}?latitude={lat:.4f}&longitude={lon:.4f}&start_date={start_date}&end_date={end_date}",
        payload_sha256=compute_payload_sha256(payload),
        record_count=len(df),
    )
    return df, record


def fetch_copernicus_dem_topography(
    cells: Sequence[dict[str, Any]],
    step_deg: float = 0.002,
    timeout: int = 20,
    session: requests.Session | None = None,
) -> tuple[dict[str, dict[str, float]], ProvenanceRecord]:
    """Query live Copernicus DEM GLO-90 elevations and compute 4-neighbor finite-difference slopes."""
    if not cells:
        raise ValueError("cells must be non-empty")

    lats: list[str] = []
    lons: list[str] = []
    for cell in cells:
        clat = float(cell["centre_lat"])
        clon = float(cell["centre_lon"])
        for dlat, dlon in ((0.0, 0.0), (step_deg, 0.0), (-step_deg, 0.0), (0.0, step_deg), (0.0, -step_deg)):
            lats.append(f"{clat + dlat:.4f}")
            lons.append(f"{clon + dlon:.4f}")

    client = session or requests
    resp = client.get(
        ELEVATION_API_URL,
        params={"latitude": ",".join(lats), "longitude": ",".join(lons)},
        timeout=timeout,
    )
    resp.raise_for_status()
    payload = resp.json()
    elevs = payload.get("elevation", [])
    if len(elevs) != len(cells) * 5:
        raise ValueError(f"Expected {len(cells) * 5} DEM elevation values, got {len(elevs)}")

    topo_by_cell: dict[str, dict[str, float]] = {}
    mean_lat = float(np.mean([float(c["centre_lat"]) for c in cells]))
    dx = 2.0 * step_deg * 111320.0 * math.cos(math.radians(mean_lat))
    dy = 2.0 * step_deg * 110574.0

    for idx, cell in enumerate(cells):
        cid = str(cell["cell_id"])
        center_m, north_m, south_m, east_m, west_m = [float(v) for v in elevs[idx * 5 : (idx + 1) * 5]]
        dz_dx = (east_m - west_m) / dx
        dz_dy = (north_m - south_m) / dy
        slope_pct = math.sqrt(dz_dx ** 2 + dz_dy ** 2) * 100.0
        topo_by_cell[cid] = {
            "elevation_m": round(center_m, 1),
            "slope_pct": round(slope_pct, 2),
        }

    spec = DATASETS_REGISTRY["copernicus_dem"]
    all_lons = [float(c["centre_lon"]) for c in cells]
    all_lats = [float(c["centre_lat"]) for c in cells]
    record = ProvenanceRecord(
        dataset_key=spec.dataset_key,
        short_name=spec.short_name,
        product_version=spec.product_version,
        retrieval_mode="live",
        bbox=(round(min(all_lons) - 0.025, 4), round(min(all_lats) - 0.025, 4), round(max(all_lons) + 0.025, 4), round(max(all_lats) + 0.025, 4)),
        temporal_range=("static", "static"),
        source_uri=ELEVATION_API_URL,
        payload_sha256=compute_payload_sha256(payload),
        record_count=len(cells),
    )
    return topo_by_cell, record


def _search_planetary_computer_all(
    collections: Sequence[str],
    lon: float,
    lat: float,
    start_date: str,
    end_date: str,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    features: list[dict[str, Any]] = []
    start_yr = int(start_date[:4])
    end_yr = int(end_date[:4])
    for yr in range(start_yr, end_yr + 1):
        yr_start = start_date if yr == start_yr else f"{yr}-01-01"
        yr_end = end_date if yr == end_yr else f"{yr}-12-31"
        body: dict[str, Any] = {
            "collections": list(collections),
            "intersects": {"type": "Point", "coordinates": [lon, lat]},
            "datetime": f"{yr_start}T00:00:00Z/{yr_end}T23:59:59Z",
            "limit": 250,
        }
        last_err: Exception | None = None
        resp = None
        for attempt in range(4):
            try:
                resp = requests.post(PLANETARY_COMPUTER_STAC_URL, json=body, timeout=timeout)
                resp.raise_for_status()
                break
            except Exception as exc:
                last_err = exc
                time.sleep(1.5 * (attempt + 1))
        if resp is None:
            raise RuntimeError(f"Planetary Computer STAC search failed for {yr}: {last_err}") from last_err
        data = resp.json()
        features.extend(data.get("features", []))
    features.sort(
        key=lambda feat: str(
            feat.get("properties", {}).get("datetime")
            or feat.get("properties", {}).get("start_datetime")
            or ""
        )
    )
    return features


def _date_str_to_dekad_key(dt_str: str) -> tuple[int, int]:
    ts = pd.Timestamp(dt_str[:10])
    in_month = 1 if ts.day <= 10 else (2 if ts.day <= 20 else 3)
    return int(ts.year), (int(ts.month) - 1) * 3 + in_month


def _sample_cog_points_1x1(
    href: str,
    sas_token: str,
    coords: Sequence[tuple[float, float]],
    retries: int = 2,
) -> list[float]:
    import rasterio
    from pyproj import Transformer

    os.environ["GDAL_DISABLE_READDIR_ON_OPEN"] = "EMPTY_DIR"
    os.environ["CPL_VSIL_CURL_ALLOWED_EXTENSIONS"] = ".tif,.tiff"
    os.environ["VSI_CACHE"] = "FALSE"
    os.environ["CPL_VSIL_CURL_CACHE_SIZE"] = "268435456"
    os.environ["GDAL_HTTP_TIMEOUT"] = "10"
    os.environ["GDAL_HTTP_CONNECTTIMEOUT"] = "8"
    os.environ["GDAL_HTTP_MAX_RETRY"] = "2"

    for attempt in range(retries):
        try:
            with rasterio.open(f"{href}?{sas_token}") as src:
                tr = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
                out: list[float] = []
                for lon, lat in coords:
                    try:
                        r_idx, c_idx = src.index(*tr.transform(lon, lat))
                        win = rasterio.windows.Window(c_idx, r_idx, 1, 1)
                        val = float(src.read(1, window=win)[0, 0])
                        out.append(val)
                    except Exception:
                        out.append(float("nan"))
                if any(np.isfinite(v) for v in out):
                    return out
        except Exception:
            time.sleep(0.4 * (attempt + 1))
    return [float("nan") for _ in coords]


def fetch_hls_30m_planetary_computer_series(
    cells: Sequence[dict[str, Any]],
    start_date: str,
    end_date: str,
    max_workers: int = 8,
) -> tuple[pd.DataFrame, pd.DataFrame, list[ProvenanceRecord]]:
    """Fetch 30 m NASA HLS (hls2-l30 + hls2-s30) NDVI + Fmask and 1 km MOD11A2 LST across Ashanti cells."""
    if not cells:
        raise ValueError("cells must be non-empty")

    ref_lon = float(cells[0]["centre_lon"])
    ref_lat = float(cells[0]["centre_lat"])
    coords = [(float(c["centre_lon"]), float(c["centre_lat"])) for c in cells]
    cell_ids = [str(c["cell_id"]) for c in cells]

    hls_all = _search_planetary_computer_all(("hls2-l30", "hls2-s30"), ref_lon, ref_lat, start_date, end_date)
    lst_all = _search_planetary_computer_all(("modis-11A2-061",), ref_lon, ref_lat, start_date, end_date)
    if not hls_all or not lst_all:
        raise RuntimeError(f"Planetary Computer returned empty series (HLS={len(hls_all)}, LST={len(lst_all)})")

    # Select the clearest 30 m HLS scene per (year, dekad) to avoid reading redundant overcast overpasses
    best_hls_by_dekad: dict[tuple[int, int], dict[str, Any]] = {}
    for feat in hls_all:
        props = feat.get("properties", {})
        dt_str = str(props.get("datetime") or props.get("start_datetime") or "")[:10]
        if not dt_str:
            continue
        key = _date_str_to_dekad_key(dt_str)
        cloud_cov = float(props.get("eo:cloud_cover", 100.0) or 100.0)
        prev = best_hls_by_dekad.get(key)
        if prev is None or cloud_cov < float(prev.get("properties", {}).get("eo:cloud_cover", 100.0) or 100.0):
            best_hls_by_dekad[key] = feat
    hls_feats = [best_hls_by_dekad[k] for k in sorted(best_hls_by_dekad.keys())]

    # Select one MOD11A2 8-day composite per (year, dekad)
    best_lst_by_dekad: dict[tuple[int, int], dict[str, Any]] = {}
    for feat in lst_all:
        dt_str = str(feat.get("properties", {}).get("start_datetime", ""))[:10]
        if dt_str:
            best_lst_by_dekad.setdefault(_date_str_to_dekad_key(dt_str), feat)
    lst_feats = [best_lst_by_dekad[k] for k in sorted(best_lst_by_dekad.keys())]

    def _fetch_sas_token(asset_href: str) -> str:
        u = urlparse(asset_href)
        url = f"{PLANETARY_COMPUTER_SAS_URL}/{u.netloc.split('.')[0]}/{u.path.strip('/').split('/')[0]}"
        last_err: Exception | None = None
        for attempt in range(4):
            try:
                r = requests.get(url, timeout=20)
                r.raise_for_status()
                return str(r.json()["token"])
            except Exception as exc:
                last_err = exc
                time.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"Failed to fetch Planetary Computer SAS token from {url}: {last_err}") from last_err

    hls_tok = _fetch_sas_token(hls_feats[0]["assets"]["B04"]["href"])
    lst_tok = _fetch_sas_token(lst_feats[0]["assets"]["LST_Day_1km"]["href"])

    def _read_hls_scene(feat: dict[str, Any]) -> list[dict[str, Any]]:
        props = feat.get("properties", {})
        dt_str = str(props.get("datetime") or props.get("start_datetime"))[:10]
        col = str(feat.get("collection", "hls2-s30"))
        cloud_cov = float(props.get("eo:cloud_cover", 100.0) or 100.0)
        if cloud_cov >= 78.0:
            return [
                {
                    "cell_id": cid,
                    "date": pd.to_datetime(dt_str),
                    "ndvi_raw": np.nan,
                    "cloud_prob_modis": round(min(0.99, cloud_cov / 100.0), 3),
                    "hls_collection": col,
                    "fmask": 2,
                }
                for cid in cell_ids
            ]
        fmasks = _sample_cog_points_1x1(feat["assets"]["Fmask"]["href"], hls_tok, coords)
        if all((not np.isfinite(fm)) or ((int(fm) & 0b00001010) != 0) for fm in fmasks):
            return [
                {
                    "cell_id": cid,
                    "date": pd.to_datetime(dt_str),
                    "ndvi_raw": np.nan,
                    "cloud_prob_modis": 0.90,
                    "hls_collection": col,
                    "fmask": int(fm) if np.isfinite(fm) else 2,
                }
                for cid, fm in zip(cell_ids, fmasks)
            ]
        nir_band = "B05" if col == "hls2-l30" else "B8A"
        reds = _sample_cog_points_1x1(feat["assets"]["B04"]["href"], hls_tok, coords)
        nirs = _sample_cog_points_1x1(feat["assets"][nir_band]["href"], hls_tok, coords)
        rows: list[dict[str, Any]] = []
        for cid, red, nir, fmask_f in zip(cell_ids, reds, nirs, fmasks):
            fmask = int(fmask_f) if np.isfinite(fmask_f) else 2
            # HLS Fmask bits: 1=cloud, 2=adjacent to cloud/shadow, 3=cloud shadow, 4=snow/ice
            is_cloud_or_shadow = (fmask & 0b00001010) != 0
            is_adjacent = (fmask & 0b00000100) != 0
            valid_refl = (
                np.isfinite(red)
                and np.isfinite(nir)
                and (red > 0)
                and (nir > 0)
                and ((nir + red) > 0)
                and not is_cloud_or_shadow
            )
            ndvi_val = round(float((nir - red) / (nir + red)), 4) if valid_refl else np.nan
            if np.isfinite(ndvi_val):
                ndvi_val = float(np.clip(ndvi_val, -0.2, 1.0))
            cloud_p = 0.90 if is_cloud_or_shadow else (0.28 if is_adjacent else 0.05)
            rows.append(
                {
                    "cell_id": cid,
                    "date": pd.to_datetime(dt_str),
                    "ndvi_raw": ndvi_val,
                    "cloud_prob_modis": cloud_p,
                    "hls_collection": col,
                    "fmask": fmask,
                }
            )
        return rows

    def _read_lst_scene(feat: dict[str, Any]) -> list[dict[str, Any]]:
        dt_str = str(feat["properties"]["start_datetime"])[:10]
        qc_raw = _sample_cog_points_1x1(feat["assets"]["QC_Day"]["href"], lst_tok, coords)
        if all((not np.isfinite(qc)) or ((int(qc) & 0b11) > 1) for qc in qc_raw):
            return [{"cell_id": cid, "date": pd.to_datetime(dt_str), "lst_max_c": np.nan} for cid in cell_ids]
        lst_raw = _sample_cog_points_1x1(feat["assets"]["LST_Day_1km"]["href"], lst_tok, coords)
        rows: list[dict[str, Any]] = []
        for cid, raw_l, qc in zip(cell_ids, lst_raw, qc_raw):
            valid_qc = np.isfinite(raw_l) and np.isfinite(qc) and (int(qc) & 0b11) <= 1 and int(raw_l) > 0
            lst_c = round(float(raw_l) * 0.02 - 273.15, 2) if valid_qc else np.nan
            rows.append({"cell_id": cid, "date": pd.to_datetime(dt_str), "lst_max_c": lst_c})
        return rows

    with ThreadPoolExecutor(max_workers=10) as pool:
        ndvi_batches = list(pool.map(_read_hls_scene, hls_feats))
        lst_batches = list(pool.map(_read_lst_scene, lst_feats))

    ndvi_df = pd.DataFrame([r for batch in ndvi_batches for r in batch])
    lst_df = pd.DataFrame([r for batch in lst_batches for r in batch])

    bbox = (
        round(min(c[0] for c in coords) - 0.025, 4),
        round(min(c[1] for c in coords) - 0.025, 4),
        round(max(c[0] for c in coords) + 0.025, 4),
        round(max(c[1] for c in coords) + 0.025, 4),
    )
    records = [
        ProvenanceRecord(
            dataset_key="landsat",
            short_name="HLSL30",
            product_version="2.0",
            retrieval_mode="live",
            bbox=bbox,
            temporal_range=(start_date, end_date),
            source_uri=f"{PLANETARY_COMPUTER_STAC_URL}?collections=hls2-l30,hls2-s30",
            payload_sha256=compute_payload_sha256(ndvi_df.to_csv(index=False)),
            record_count=len(ndvi_df),
        ),
        ProvenanceRecord(
            dataset_key="modis_lst",
            short_name="MOD11A2",
            product_version="061",
            retrieval_mode="live",
            bbox=bbox,
            temporal_range=(start_date, end_date),
            source_uri=f"{PLANETARY_COMPUTER_STAC_URL}?collections=modis-11A2-061",
            payload_sha256=compute_payload_sha256(lst_df.to_csv(index=False)),
            record_count=len(lst_df),
        ),
    ]
    return ndvi_df, lst_df, records


# Alias retained for backward compatibility
fetch_modis_planetary_computer_series = fetch_hls_30m_planetary_computer_series



