/**
 * Core data types for the Field Shift environmental intelligence interface.
 *
 * These types align with the Supabase `dekad_timeseries` and `season_features`
 * tables (see src/lib/supabase.ts) and the pipeline pilot configuration
 * (pipeline/config/pilot.yaml).
 *
 * Naming conventions:
 *  - `_mm`  → millimetres
 *  - `_c`   → degrees Celsius
 *  - `_frac`→ unitless fraction [0, 1]
 *  - `_km`  → kilometres
 */

/* ─── Dekad (10-day period) ──────────────────────────────────────────── */

/** A single dekad observation record. Nullable fields indicate missing data. */
export interface DekadObservation {
  /** Dekad identifier, e.g. "2025-D07" (7th dekad of 2025). */
  dekad: string;
  /** 1-based dekad number within the year (1–36). */
  dekadNumber: number;
  /** ISO date string for the start of the dekad. */
  dateStart: string;
  /** ISO date string for the end of the dekad. */
  dateEnd: string;
  /** Observed rainfall in mm over the dekad period. */
  rainfallMm: number | null;
  /** Climatological (historical-mean) rainfall for this dekad, in mm. */
  rainfallClimatologyMm: number | null;
  /** Rainfall reliability: fraction of historical years meeting threshold. */
  rainfallReliability: number | null;
  /** Soil moisture observation (volumetric water content, m³/m³). */
  soilMoisture: number | null;
  /** Historical-mean soil moisture for this dekad. */
  soilMoistureClimatology: number | null;
  /** NDVI vegetation index (unitless, typically 0–1). */
  ndvi: number | null;
  /** Historical-mean NDVI for this dekad. */
  ndviClimatology: number | null;
  /** Land surface temperature in °C (satellite-derived, not air temperature). */
  lstC: number | null;
  /** Historical-mean LST for this dekad, °C. */
  lstClimatologyC: number | null;
  /** Reference evapotranspiration in mm. */
  et0Mm: number | null;
  /** Quality flags for each variable. */
  quality: ObservationQuality;
}
/** Per-variable quality indicators for a dekad observation. */
export interface ObservationQuality {
  rainfallSource: DataSource;
  soilMoistureSource: DataSource;
  ndviSource: DataSource;
  lstSource: DataSource;
}

export type DataSource =
  | "observed"
  | "interpolated"
  | "climatology-fill"
  | "missing"
  | "cloud-obscured"
  | "quality-flagged";

/* ─── Anomalies ──────────────────────────────────────────────────────── */

export type AnomalyCategory =
  | "rainfall-deficit"
  | "rainfall-excess"
  | "high-temperature"
  | "soil-moisture-deficit"
  | "soil-moisture-excess"
  | "vegetation-decline"
  | "bare-field-exposure"
  | "compound-anomaly";

export type AnomalySeverity = "info" | "moderate" | "severe";

export interface AnomalyBadge {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  /** The dekad(s) this anomaly spans. */
  dekadRange: { start: string; end: string };
  /** Human-readable summary. */
  label: string;
  /** The variable(s) involved. */
  variables: string[];
  /** Observed condition that triggered the flag. */
  observation: string;
  /** Evidence or methodology supporting the flag. */
  evidence: string;
}

/* ─── Bare-Field Exposure ────────────────────────────────────────────── */

export interface BareFieldPeriod {
  /** Start dekad. */
  dekadStart: string;
  /** End dekad. */
  dekadEnd: string;
  /** Duration in dekads. */
  durationDekads: number;
  /** Mean NDVI during this period. */
  meanNdvi: number | null;
  /** How this was determined. */
  method: "ndvi-threshold" | "calendar-inferred" | "combined";
  /** Confidence in the bare-field classification. */
  confidence: "low" | "medium" | "high";
  /** Reason for low confidence, if applicable. */
  caveat?: string;
}

/* ─── Season Calendar ────────────────────────────────────────────────── */

export interface SeasonDefinition {
  key: string;
  label: string;
  startDekad: number;
  endDekad: number;
}

/* ─── Map Layers ─────────────────────────────────────────────────────── */

export type MapLayerId = "ndvi" | "soil-moisture" | "rainfall" | "srtm";

export interface MapLayerConfig {
  id: MapLayerId;
  label: string;
  variable: string;
  unit: string;
  /** Colour ramp stops: [value, colour]. */
  colorRamp: [number, string][];
  /** Native resolution in km. */
  resolutionKm: number;
  /** Source product name. */
  source: string;
  /** Source product version. */
  version?: string;
  /** Temporal frequency description. */
  temporalFrequency: string;
}

export interface MapTimeStep {
  /** ISO date string. */
  date: string;
  /** Which layers have data at this timestep. */
  availableLayers: MapLayerId[];
  /** Label, e.g. "2025-D07 (1–10 Mar 2025)". */
  label: string;
}

/* ─── Scale Honesty ──────────────────────────────────────────────────── */

export type ScaleFitCategory =
  | "suitable"
  | "contextual"
  | "insufficient"
  | "unknown";

export interface DatasetScaleAssessment {
  datasetName: string;
  nativeResolutionKm: number;
  /** Approximate pixel footprint in hectares. */
  pixelFootprintHa: number;
  farmAreaHa: number | null;
  /** How many farm-areas fit inside one pixel (or vice-versa). */
  pixelToFarmRatio: number | null;
  fit: ScaleFitCategory;
  limitation: string;
}

/* ─── Component Props ────────────────────────────────────────────────── */

export type LoadingState = "loading" | "ready" | "error" | "empty" | "unavailable";

export interface CalendarProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
  anomalies: AnomalyBadge[];
  bareFieldPeriods: BareFieldPeriod[];
  loadingState: LoadingState;
  errorMessage?: string;
  selectedDekad: string | null;
  onSelectDekad: (dekad: string | null) => void;
}

export interface MapExplorerProps {
  center: [number, number];
  zoom: number;
  layers: MapLayerConfig[];
  timeSteps: MapTimeStep[];
  loadingState: LoadingState;
  errorMessage?: string;
  farmBoundary?: GeoJSON.Feature | null;
}

export interface ScaleHonestyProps {
  assessments: DatasetScaleAssessment[];
  farmAreaHa: number | null;
  farmLabel?: string;
}
