/**
 * Constants for the Field Shift environmental intelligence interface.
 * Derived from pipeline/config/pilot.yaml and NASA product documentation.
 */

import type {
  MapLayerConfig,
  SeasonDefinition,
  DatasetScaleAssessment,
  ScaleFitCategory,
} from "./types";

/* ─── Pilot Region ───────────────────────────────────────────────────── */

export const PILOT_CENTER: [number, number] = [-1.45, 6.85]; // [lon, lat]
export const PILOT_ZOOM = 10;
export const PILOT_LABEL = "Ashanti Region, Ghana (Forest-Transition Pilot)";

/* ─── Seasons (from pilot.yaml) ──────────────────────────────────────── */

export const SEASONS: SeasonDefinition[] = [
  {
    key: "major",
    label: "Major rainy season (Mar–Jul)",
    startDekad: 7,
    endDekad: 21,
  },
  {
    key: "minor",
    label: "Minor rainy season (Sep–Nov)",
    startDekad: 25,
    endDekad: 33,
  },
];

/* ─── Dataset Resolutions (from pilot.yaml, in km) ───────────────────── */

export const DATASET_RESOLUTIONS_KM: Record<string, number> = {
  imerg: 10.0,
  smap: 9.0,
  modis_ndvi: 0.03,
  landsat: 0.03,
  srtm: 0.09,
  ecostress: 0.07,
  nasa_power: 50.0,
  isdasoil: 0.03,
  soilgrids: 0.25,
  era5_land: 9.0,
  modis_lst: 1.0,
};
/* ─── Map Layer Configurations ───────────────────────────────────────── */

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: "ndvi",
    label: "NDVI Vegetation Index (30 m HLS)",
    variable: "Normalised Difference Vegetation Index",
    unit: "unitless (0–1)",
    resolutionKm: DATASET_RESOLUTIONS_KM.landsat,
    source: "NASA Harmonized Landsat Sentinel-2 (HLSL30 / HLSS30)",
    version: "v2.0",
    temporalFrequency: "2–3 day revisit, cloud-screened via Fmask to 10-day dekad",
    colorRamp: [
      [0.0, "#8B4513"],   // Bare soil
      [0.15, "#D2B48C"],  // Sparse vegetation
      [0.3, "#F5DEB3"],   // Light vegetation
      [0.45, "#90EE90"],  // Moderate vegetation
      [0.6, "#228B22"],   // Dense vegetation
      [0.8, "#006400"],   // Very dense vegetation
      [1.0, "#003300"],   // Maximum vegetation
    ],
  },
  {
    id: "soil-moisture",
    label: "Soil Moisture",
    variable: "Surface soil moisture (top ~5 cm)",
    unit: "m³/m³",
    resolutionKm: DATASET_RESOLUTIONS_KM.smap,
    source: "NASA SMAP L3 (Soil Moisture Active Passive)",
    version: "v8",
    temporalFrequency: "3-day composite, aggregated to dekad mean",
    colorRamp: [
      [0.05, "#8B0000"],  // Very dry
      [0.10, "#CD853F"],
      [0.20, "#DAA520"],
      [0.30, "#4682B4"],  // Moderate
      [0.40, "#4169E1"],
      [0.50, "#00008B"],  // Wet
    ],
  },
  {
    id: "rainfall",
    label: "Rainfall",
    variable: "Dekad precipitation total",
    unit: "mm / dekad",
    resolutionKm: DATASET_RESOLUTIONS_KM.imerg,
    source: "NASA GPM IMERG (Integrated Multi-satellitE Retrievals)",
    version: "v07 Final Run",
    temporalFrequency: "Half-hourly, aggregated to dekad total",
    colorRamp: [
      [0, "#FFF5E6"],
      [10, "#FED976"],
      [25, "#FEB24C"],
      [50, "#FD8D3C"],
      [75, "#FC4E2A"],
      [100, "#E31A1C"],
      [150, "#800026"],
    ],
  },
  {
    id: "srtm",
    label: "SRTM Terrain Elevation",
    variable: "Elevation above sea level",
    unit: "metres",
    resolutionKm: DATASET_RESOLUTIONS_KM.srtm,
    source: "NASA SRTM (Shuttle Radar Topography Mission)",
    version: "v3.0",
    temporalFrequency: "Static (collected February 2000)",
    colorRamp: [
      [100, "#006837"],
      [200, "#31A354"],
      [300, "#78C679"],
      [400, "#C2E699"],
      [500, "#FFFFCC"],
      [600, "#FED976"],
      [700, "#FD8D3C"],
      [800, "#E31A1C"],
    ],
  },
];

/* ─── Scale Honesty ──────────────────────────────────────────────────── */

/**
 * Compute the scale-honesty assessment for a dataset against a farm area.
 * This uses the actual resolution metadata from pilot.yaml.
 */
export function assessScale(
  datasetName: string,
  resolutionKm: number,
  farmAreaHa: number | null,
): DatasetScaleAssessment {
  const pixelFootprintHa = resolutionKm * resolutionKm * 100; // km² → ha

  if (farmAreaHa === null || farmAreaHa <= 0) {
    return {
      datasetName,
      nativeResolutionKm: resolutionKm,
      pixelFootprintHa,
      farmAreaHa: null,
      pixelToFarmRatio: null,
      fit: "unknown",
      limitation:
        "Farm area is not specified. Cannot assess whether this dataset's resolution is appropriate for field-level analysis.",
    };
  }

  const pixelToFarmRatio = pixelFootprintHa / farmAreaHa;
  let fit: ScaleFitCategory;
  let limitation: string;

  if (pixelToFarmRatio <= 0.25) {
    fit = "suitable";
    limitation = `Each pixel covers approximately ${pixelFootprintHa.toFixed(
      1,
    )} ha — well within the ${farmAreaHa.toFixed(
      1,
    )} ha farm boundary. Multiple pixels fall within the farm, supporting field-level interpretation.`;
  } else if (pixelToFarmRatio <= 4) {
    fit = "contextual";
    limitation = `Each pixel covers approximately ${pixelFootprintHa.toFixed(
      0,
    )} ha while the farm is ${farmAreaHa.toFixed(
      1,
    )} ha. The pixel mixes the farm with surrounding land. Values represent the broader area, not the farm alone.`;
  } else {
    fit = "insufficient";
    limitation = `Each pixel covers approximately ${pixelFootprintHa.toFixed(
      0,
    )} ha — roughly ${Math.round(
      pixelToFarmRatio,
    )}× the ${farmAreaHa.toFixed(
      1,
    )} ha farm area. This dataset provides regional context only and cannot resolve conditions specific to this farm.`;
  }

  return {
    datasetName,
    nativeResolutionKm: resolutionKm,
    pixelFootprintHa,
    farmAreaHa,
    pixelToFarmRatio,
    fit,
    limitation,
  };
}

/* ─── Dekad Date Utilities ───────────────────────────────────────────── */

/**
 * Convert a dekad number (1–36) and year into a date range.
 * Dekad 1 = Jan 1–10, Dekad 2 = Jan 11–20, Dekad 3 = Jan 21–31, etc.
 */
export function dekadToDateRange(
  dekadNumber: number,
  year: number,
): { start: Date; end: Date; label: string } {
  const month = Math.floor((dekadNumber - 1) / 3); // 0-based month
  const posInMonth = ((dekadNumber - 1) % 3); // 0, 1, or 2

  let startDay: number;
  let endDay: number;

  if (posInMonth === 0) {
    startDay = 1;
    endDay = 10;
  } else if (posInMonth === 1) {
    startDay = 11;
    endDay = 20;
  } else {
    startDay = 21;
    // Last dekad extends to end of month
    endDay = new Date(year, month + 1, 0).getDate();
  }

  const start = new Date(year, month, startDay);
  const end = new Date(year, month, endDay);

  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

  return {
    start,
    end,
    label: `${fmt.format(start)} – ${fmt.format(end)}`,
  };
}

/**
 * Generate a dekad identifier string, e.g. "2025-D07".
 */
export function dekadId(dekadNumber: number, year: number): string {
  return `${year}-D${String(dekadNumber).padStart(2, "0")}`;
}

/* ─── Colour Utilities ───────────────────────────────────────────────── */

export const ANOMALY_COLOURS: Record<string, string> = {
  "rainfall-deficit": "#DC6B2F",
  "rainfall-excess": "#2D5FA6",
  "high-temperature": "#C62828",
  "soil-moisture-deficit": "#A0522D",
  "soil-moisture-excess": "#1565C0",
  "vegetation-decline": "#6D4C41",
  "bare-field-exposure": "#8D6E63",
  "compound-anomaly": "#6A1B9A",
};

export const SEVERITY_COLOURS: Record<string, string> = {
  info: "#5C7C65",
  moderate: "#DC6B2F",
  severe: "#C62828",
};
