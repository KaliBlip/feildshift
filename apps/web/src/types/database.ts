export type EvidenceTier =
  | "established_science"
  | "data_derived_finding"
  | "farmer_reported_observation"
  | "unverified_hypothesis"
  | "expert_validated_insight";

export type EvidenceGrade =
  | "farmer_reported"
  | "officer_reviewed"
  | "expert_validated"
  | "confounded_excluded";

export type QaTier = "high" | "moderate" | "low_cloud_gap";

export type UserRole = "farmer" | "extension_officer" | "agronomist";

export interface PilotCell {
  cell_id: string;
  region_name: string;
  row_idx: number;
  col_idx: number;
  centre_lat: number;
  centre_lon: number;
  elevation_m: number;
  slope_pct: number;
  soil_texture: string;
  soil_organic_carbon_g_kg: number;
  soil_ph: number;
  typical_annual_rain_mm: number;
  native_resolutions_km: Record<string, number>;
  /** GeoJSON polygon ring [[lon, lat], ...] covering the ~5.5 km cell */
  polygonCoords: [number, number][];
}

export interface DekadWindowSummary {
  id: string;
  dekadIndex: number; // 1..36 representative index
  monthLabel: string;
  dekadRange: string;
  seasonLabel: string;
  rainReliability: "High" | "Moderate" | "Low";
  rainMm: number;
  et0Mm: number;
  smapAnomalyZ: number;
  ndviSmooth: number;
  bareFieldRisk: boolean;
  qaTier: QaTier;
  summaryNote: string;
  summaryNoteTw: string;
}

export interface SeasonFeatureSummary {
  cell_id: string;
  year: number;
  season: "major" | "minor" | "annual";
  onset_dekad: number;
  cessation_dekad: number;
  total_rain_mm: number;
  rain_cv: number;
  longest_dry_spell_days: number;
  heavy_rain_days: number;
  heat_stress_days: number;
  mean_sm_anomaly_z: number;
  ndvi_peak: number;
  bare_period_fraction: number;
  erosion_exposure_index: number;
  anomaly_score_m1: number;
  is_anomalous_season: boolean;
  cluster_label_m2: string;
  trend_sen_slope_mm_yr: number;
}

export interface RotationStrategySpec {
  code: string;
  name: string;
  sequence: string;
  isBaseline: boolean;
  criterionScores: [number, number, number, number];
  expectedBenefits: string[];
  informationGaps: string[];
  risksNeedingReview: string[];
}

export interface EvidencePassport {
  id: string;
  cellId: string;
  strategyCode: string;
  title: string;
  evidenceTier: EvidenceTier;
  observationSummary: string;
  datasetsUsed: string[];
  spatialTemporalCoverage: string;
  methodApplied: string;
  uncertaintySummary: string;
  scaleHonestyNote: string;
  informationGaps: string[];
  requiredLocalReview: string[];
}

export interface ScaleHonestyEntry {
  dataset: string;
  nativeResolutionKm: number;
  pixelAreaKm2: number;
  resolvesFarm: boolean;
  advisoryTier: "field_scale" | "sub_regional" | "regional_context_only";
  note: string;
}

export interface GlossaryItem {
  id: string;
  term: string;
  termTw: string;
  plainMeaning: string;
  plainMeaningTw: string;
  whyItMatters: string;
}

export interface DecisionLogRecord {
  decision_id: string;
  cell_id: string;
  session_label: string | null;
  logged_by_role: UserRole;
  existing_rotation: string;
  selected_strategy_code: string;
  farm_area_ha: number | null;
  priority_weights: Record<string, number>;
  computed_base_scores: Record<string, number>;
  rank_probabilities: Record<string, number>;
  reasoning_notes: string | null;
  created_at: string;
  synced?: boolean;
}

export interface OutcomeReportRecord {
  outcome_id: string;
  decision_id: string | null;
  cell_id: string;
  season_year: number;
  season_name: string;
  outcome_summary: string;
  soil_cover_observed: string | null;
  water_stress_observed: string | null;
  pest_or_disease_notes: string | null;
  evidence_grade: EvidenceGrade;
  graded_by_officer_id: string | null;
  eligible_for_model_update: boolean;
  created_at: string;
  reviewed_at: string | null;
  synced?: boolean;
}

export type PriorityCriteria = {
  key: "water_efficiency" | "soil_health" | "erosion_protection" | "income_market";
  label: string;
  description: string;
  defaultWeight: number;
};

export const PRIORITY_CRITERIA: PriorityCriteria[] = [
  {
    key: "water_efficiency",
    label: "Water Efficiency",
    description: "Optimize for rainfall capture and root-zone moisture balance",
    defaultWeight: 0.4,
  },
  {
    key: "soil_health",
    label: "Soil Health",
    description: "Build soil organic matter, biological nitrogen, and structure",
    defaultWeight: 0.3,
  },
  {
    key: "erosion_protection",
    label: "Erosion Protection",
    description: "Maintain Harmattan & early-storm ground cover on slopes",
    defaultWeight: 0.2,
  },
  {
    key: "income_market",
    label: "Income & Market Access",
    description: "Balance market value and input-cost savings across seasons",
    defaultWeight: 0.1,
  },
];

export type ExistingRotationInput = {
  cropSequence: string[];
  yearsOfData: number;
  typicalYield: number | null;
  soilCondition: "poor" | "fair" | "good" | "excellent";
  irrigationAccess: boolean;
  notes: string;
};
