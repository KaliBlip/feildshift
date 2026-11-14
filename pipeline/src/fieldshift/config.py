"""Pilot configuration loading, spatial grid generation, and scale-honesty helpers."""
from __future__ import annotations

from dataclasses import dataclass, field
import math
from pathlib import Path
from typing import Any

import yaml

DEFAULT_PILOT_CONFIG_PATH = (
    Path(__file__).resolve().parents[2] / "config" / "pilot.yaml"
)


@dataclass(frozen=True)
class SeasonWindow:
    """Named cropping season defined by inclusive 1-based dekad bounds."""

    label: str
    start_dekad: int
    end_dekad: int


@dataclass(frozen=True)
class PilotConfig:
    """Configuration for a Field Shift pilot analysis region."""

    region_name: str
    region_label: str
    centre_lat: float
    centre_lon: float
    half_width_km: float
    analysis_grid_deg: float
    time_step: str
    baseline_years: tuple[int, int]
    seasons: dict[str, SeasonWindow] = field(default_factory=dict)
    dataset_resolutions_km: dict[str, float] = field(default_factory=dict)


def _wgs84_km_per_degree(lat_deg: float) -> tuple[float, float]:
    """Return (km_per_deg_lat, km_per_deg_lon) on the WGS84 ellipsoid."""
    phi = math.radians(lat_deg)
    km_per_deg_lat = (
        111_132.92
        - 559.82 * math.cos(2.0 * phi)
        + 1.175 * math.cos(4.0 * phi)
        - 0.0023 * math.cos(6.0 * phi)
    ) / 1000.0
    km_per_deg_lon = (
        111_412.84 * math.cos(phi)
        - 93.5 * math.cos(3.0 * phi)
        + 0.118 * math.cos(5.0 * phi)
    ) / 1000.0
    return km_per_deg_lat, km_per_deg_lon


def load_pilot_config(path: Path | str | None = None) -> PilotConfig:
    """Load and validate a pilot YAML configuration file."""
    cfg_path = Path(path) if path is not None else DEFAULT_PILOT_CONFIG_PATH
    with cfg_path.open("r", encoding="utf-8") as fh:
        raw: dict[str, Any] = yaml.safe_load(fh)

    seasons_raw = raw.get("seasons", {})
    seasons = {
        name: SeasonWindow(
            label=str(spec["label"]),
            start_dekad=int(spec["start_dekad"]),
            end_dekad=int(spec["end_dekad"]),
        )
        for name, spec in seasons_raw.items()
    }

    years = raw["baseline_years"]
    cfg = PilotConfig(
        region_name=str(raw["region_name"]),
        region_label=str(raw.get("region_label", raw["region_name"])),
        centre_lat=float(raw["centre_lat"]),
        centre_lon=float(raw["centre_lon"]),
        half_width_km=float(raw["half_width_km"]),
        analysis_grid_deg=float(raw["analysis_grid_deg"]),
        time_step=str(raw.get("time_step", "dekad")),
        baseline_years=(int(years[0]), int(years[1])),
        seasons=seasons,
        dataset_resolutions_km={
            str(k): float(v)
            for k, v in raw.get("dataset_resolutions_km", {}).items()
        },
    )
    if cfg.half_width_km <= 0:
        raise ValueError("half_width_km must be positive")
    if cfg.analysis_grid_deg <= 0:
        raise ValueError("analysis_grid_deg must be positive")
    return cfg


def compute_bounding_box(cfg: PilotConfig) -> tuple[float, float, float, float]:
    """Return (min_lon, min_lat, max_lon, max_lat) covering the pilot area."""
    km_per_deg_lat, km_per_deg_lon = _wgs84_km_per_degree(cfg.centre_lat)
    half_lat_deg = cfg.half_width_km / km_per_deg_lat
    half_lon_deg = cfg.half_width_km / km_per_deg_lon
    return (
        round(cfg.centre_lon - half_lon_deg, 6),
        round(cfg.centre_lat - half_lat_deg, 6),
        round(cfg.centre_lon + half_lon_deg, 6),
        round(cfg.centre_lat + half_lat_deg, 6),
    )


def generate_pilot_cells(cfg: PilotConfig) -> list[dict[str, Any]]:
    """Build the regular analysis grid covering the configured pilot bounding box."""
    min_lon, min_lat, max_lon, max_lat = compute_bounding_box(cfg)
    step = cfg.analysis_grid_deg
    n_rows = math.ceil((max_lat - min_lat) / step)
    n_cols = math.ceil((max_lon - min_lon) / step)

    origin_lat = cfg.centre_lat - (n_rows * step) / 2.0
    origin_lon = cfg.centre_lon - (n_cols * step) / 2.0

    cells: list[dict[str, Any]] = []
    for row in range(n_rows):
        cell_min_lat = round(origin_lat + row * step, 6)
        cell_max_lat = round(origin_lat + (row + 1) * step, 6)
        cell_centre_lat = round(origin_lat + (row + 0.5) * step, 6)
        for col in range(n_cols):
            cell_min_lon = round(origin_lon + col * step, 6)
            cell_max_lon = round(origin_lon + (col + 1) * step, 6)
            cell_centre_lon = round(origin_lon + (col + 0.5) * step, 6)
            cells.append(
                {
                    "cell_id": f"ASH_R{row:02d}_C{col:02d}",
                    "region_name": cfg.region_name,
                    "row_idx": row,
                    "col_idx": col,
                    "centre_lat": cell_centre_lat,
                    "centre_lon": cell_centre_lon,
                    "bbox": (cell_min_lon, cell_min_lat, cell_max_lon, cell_max_lat),
                    "native_resolutions_km": dict(cfg.dataset_resolutions_km),
                }
            )
    return cells


def evaluate_scale_honesty(
    farm_area_ha: float,
    dataset_resolutions_km: dict[str, float],
) -> dict[str, dict[str, Any]]:
    """Compare each dataset's native footprint against the user's farm area."""
    if farm_area_ha <= 0:
        raise ValueError("farm_area_ha must be positive")

    farm_area_km2 = farm_area_ha / 100.0
    assessment: dict[str, dict[str, Any]] = {}
    for dataset, res_km in dataset_resolutions_km.items():
        if res_km <= 0:
            raise ValueError(f"Resolution for {dataset!r} must be positive")
        pixel_area_km2 = res_km**2
        ratio = pixel_area_km2 / farm_area_km2
        resolves_farm = ratio <= 1.0
        if resolves_farm:
            advisory_tier = "field_scale"
        elif ratio <= 25.0:
            advisory_tier = "sub_regional"
        else:
            advisory_tier = "regional_context_only"

        assessment[dataset] = {
            "native_resolution_km": res_km,
            "pixel_area_km2": round(pixel_area_km2, 6),
            "farm_area_km2": round(farm_area_km2, 6),
            "pixel_to_farm_ratio": round(ratio, 3),
            "resolves_farm": resolves_farm,
            "advisory_tier": advisory_tier,
        }
    return assessment
