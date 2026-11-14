import type { DekadObservation, AnomalyBadge, BareFieldPeriod, MapLayerConfig } from "@/lib/types";
import { generateIllustrativeDekads, deriveAnomalies, deriveBareFieldPeriods, generateIllustrativeTimeSteps } from "@/lib/illustrative-data";
import { DATASET_RESOLUTIONS_KM, SEASONS } from "@/lib/constants";
import { assessScale } from "@/lib/constants";

const FARM_AREA_HA = 42.5;
const FARM_LABEL = "Ashanti Pilot Cell 1";

export const ILLUSTRATIVE_YEAR = 2025;

export const calendarFixtures = {
  observations: generateIllustrativeDekads(ILLUSTRATIVE_YEAR),
  seasons: SEASONS,
  anomalies: [] as AnomalyBadge[],
  bareFieldPeriods: [] as BareFieldPeriod[],
  farmAreaHa: FARM_AREA_HA,
  farmLabel: FARM_LABEL,
  loadingState: "ready" as const,
  source: "fixtures" as const,
};

calendarFixtures.anomalies = deriveAnomalies(calendarFixtures.observations);
calendarFixtures.bareFieldPeriods = deriveBareFieldPeriods(calendarFixtures.observations);

const mapLayers: MapLayerConfig[] = [
  {
    id: "ndvi",
    label: "NDVI Vegetation Index",
    variable: "Normalised Difference Vegetation Index",
    unit: "unitless (0–1)",
    resolutionKm: DATASET_RESOLUTIONS_KM.modis_ndvi,
    source: "NASA MODIS MOD13Q1 (Terra)",
    version: "v061",
    temporalFrequency: "16-day composite, aggregated to dekad",
    colorRamp: [
      [0.0, "#8B4513"],
      [0.15, "#D2B48C"],
      [0.3, "#F5DEB3"],
      [0.45, "#90EE90"],
      [0.6, "#228B22"],
      [0.8, "#006400"],
      [1.0, "#003300"],
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
      [0.05, "#8B0000"],
      [0.10, "#CD853F"],
      [0.20, "#DAA520"],
      [0.30, "#4682B4"],
      [0.40, "#4169E1"],
      [0.50, "#00008B"],
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

export const mapFixtures = {
  center: [-1.45, 6.85] as [number, number],
  zoom: 10,
  layers: mapLayers,
  timeSteps: generateIllustrativeTimeSteps(ILLUSTRATIVE_YEAR),
  farmBoundary: {
    type: "Feature" as const,
    properties: { name: "Ashanti Pilot Cell 1", area_ha: FARM_AREA_HA },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[
        [-1.62, 6.68],
        [-1.58, 6.72],
        [-1.55, 6.65],
        [-1.65, 6.60],
        [-1.62, 6.68],
      ]],
    },
  },
  farmAreaHa: FARM_AREA_HA,
  loadingState: "ready" as const,
  source: "fixtures" as const,
  selectedTimeStep: generateIllustrativeTimeSteps(ILLUSTRATIVE_YEAR)[0],
  enabledLayers: ["ndvi", "soil-moisture", "rainfall"] as const,
};

export const scaleHonestyFixtures = (farmAreaHa: number = FARM_AREA_HA) => {
  const datasets = [
    { id: "ndvi", resolutionKm: DATASET_RESOLUTIONS_KM.modis_ndvi, source: "MODIS MOD13Q1", label: "NDVI (MODIS)" },
    { id: "soil-moisture", resolutionKm: DATASET_RESOLUTIONS_KM.smap, source: "SMAP L3", label: "Soil Moisture (SMAP)" },
    { id: "rainfall", resolutionKm: DATASET_RESOLUTIONS_KM.imerg, source: "GPM IMERG", label: "Rainfall (IMERG)" },
    { id: "srtm", resolutionKm: DATASET_RESOLUTIONS_KM.srtm, source: "SRTM", label: "Terrain (SRTM)" },
  ];

  return datasets.map((d) => assessScale(d.id, d.resolutionKm, farmAreaHa));
};

export function createEmptyCalendarState() {
  return {
    observations: [] as DekadObservation[],
    seasons: SEASONS,
    anomalies: [] as AnomalyBadge[],
    bareFieldPeriods: [] as BareFieldPeriod[],
    farmAreaHa: FARM_AREA_HA,
    farmLabel: FARM_LABEL,
    loadingState: "empty" as const,
  };
}

export function createLoadingCalendarState() {
  return {
    observations: [] as DekadObservation[],
    seasons: SEASONS,
    anomalies: [] as AnomalyBadge[],
    bareFieldPeriods: [] as BareFieldPeriod[],
    farmAreaHa: FARM_AREA_HA,
    farmLabel: FARM_LABEL,
    loadingState: "loading" as const,
  };
}

export function createErrorCalendarState(message: string) {
  return {
    observations: [] as DekadObservation[],
    seasons: SEASONS,
    anomalies: [] as AnomalyBadge[],
    bareFieldPeriods: [] as BareFieldPeriod[],
    farmAreaHa: FARM_AREA_HA,
    farmLabel: FARM_LABEL,
    loadingState: "error" as const,
    errorMessage: message,
  };
}

export function createUnavailableCalendarState() {
  return {
    observations: [] as DekadObservation[],
    seasons: SEASONS,
    anomalies: [] as AnomalyBadge[],
    bareFieldPeriods: [] as BareFieldPeriod[],
    farmAreaHa: null,
    farmLabel: FARM_LABEL,
    loadingState: "unavailable" as const,
  };
}

export function createEmptyMapState() {
  return {
    center: mapFixtures.center,
    zoom: mapFixtures.zoom,
    layers: mapFixtures.layers,
    timeSteps: mapFixtures.timeSteps,
    farmBoundary: mapFixtures.farmBoundary,
    farmAreaHa: mapFixtures.farmAreaHa,
    loadingState: "empty" as const,
    selectedTimeStep: mapFixtures.timeSteps[0],
    enabledLayers: mapFixtures.enabledLayers,
  };
}