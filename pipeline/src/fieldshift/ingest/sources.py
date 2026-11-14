"""Data-source adapters (NASA POWER, ISRIC SoilGrids, earthaccess CMR) and pilot generator."""
from __future__ import annotations

from typing import Any, Sequence
from urllib.parse import urlencode

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
DEFAULT_POWER_PARAMETERS: tuple[str, ...] = (
    "PRECTOTCORR",
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "ALLSKY_SFC_SW_DWN",
    "RH2M",
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
    timeout: int = 20,
    session: requests.Session | None = None,
) -> tuple[dict[str, Any], ProvenanceRecord]:
    """Query ISRIC SoilGrids v2.0 (0-5 cm mean) for Ashanti/global baseline soil properties."""
    params = [
        ("lon", f"{lon:.4f}"),
        ("lat", f"{lat:.4f}"),
        ("property", "phh2o"),
        ("property", "soc"),
        ("property", "clay"),
        ("property", "sand"),
        ("property", "silt"),
        ("depth", "0-5cm"),
        ("value", "mean"),
    ]
    client = session or requests
    resp = client.get(SOILGRIDS_QUERY_URL, params=params, timeout=timeout)
    resp.raise_for_status()
    payload = resp.json()

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

    clay_pct = round(raw_means.get("clay", 20.0), 1)
    sand_pct = round(raw_means.get("sand", 50.0), 1)
    silt_pct = round(raw_means.get("silt", max(0.0, 100.0 - clay_pct - sand_pct)), 1)
    soil_ph = round(raw_means.get("phh2o", 5.8), 2)
    soc_g_kg = round(raw_means.get("soc", 14.0), 2)

    summary = {
        "lat": lat,
        "lon": lon,
        "soil_ph": soil_ph,
        "soil_organic_carbon_g_kg": soc_g_kg,
        "clay_pct": clay_pct,
        "sand_pct": sand_pct,
        "silt_pct": silt_pct,
        "soil_texture": classify_usda_texture(clay_pct, sand_pct),
    }

    spec = DATASETS_REGISTRY["soilgrids"]
    record = ProvenanceRecord(
        dataset_key=spec.dataset_key,
        short_name=spec.short_name,
        product_version=spec.product_version,
        retrieval_mode="live",
        bbox=(round(lon - 0.002, 4), round(lat - 0.002, 4), round(lon + 0.002, 4), round(lat + 0.002, 4)),
        temporal_range=("static", "static"),
        source_uri=f"{SOILGRIDS_QUERY_URL}?lon={lon:.4f}&lat={lat:.4f}",
        payload_sha256=compute_payload_sha256(payload),
        record_count=len(layers),
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

    dataset_keys = ("imerg", "smap", "smap_root_zone", "modis_ndvi", "gedi_canopy")
    granule_summary: dict[str, Any] = {}
    records: list[ProvenanceRecord] = []

    imerg_results: list[Any] = []
    for ds_key in dataset_keys:
        spec = DATASETS_REGISTRY[ds_key]
        hits = earthaccess.search_data(
            short_name=spec.short_name,
            version=spec.product_version,
            bounding_box=bbox,
            temporal=temporal,
            count=5,
        )
        links = [link for item in hits[:2] for link in (item.data_links() if hasattr(item, "data_links") else [])]
        granule_summary[ds_key] = {
            "short_name": spec.short_name,
            "version": spec.product_version,
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
                    product_version=spec.product_version,
                    retrieval_mode="live",
                    bbox=bbox,
                    temporal_range=temporal,
                    source_uri=links[0] if links else f"cmr://{spec.short_name}.{spec.product_version}",
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

