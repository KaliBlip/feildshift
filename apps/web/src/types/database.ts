export type PilotCell = {
  id: string;
  name: string;
  geometry: unknown;
  center_lat: number;
  center_lon: number;
  area_ha: number;
  created_at: string;
  updated_at: string;
};

export type DekadTimeseries = {
  id: string;
  pilot_cell_id: string;
  dekad: string;
  rainfall_mm: number | null;
  soil_moisture: number | null;
  ndvi: number | null;
  lst_c: number | null;
  et0_mm: number | null;
  created_at: string;
};

export type SeasonFeatures = {
  id: string;
  pilot_cell_id: string;
  season: string;
  onset_dekad: number | null;
  total_rainfall_mm: number | null;
  rainfall_cv: number | null;
  longest_dry_spell: number | null;
  heavy_rain_days: number | null;
  heat_stress_days: number | null;
  mean_soil_moisture: number | null;
  soil_moisture_anomaly: number | null;
  mean_ndvi: number | null;
  ndvi_anomaly: number | null;
  bare_period_fraction: number | null;
  slope_deg: number | null;
  erosion_exposure: number | null;
  created_at: string;
};

export type StrategyScore = {
  id: string;
  pilot_cell_id: string;
  season: string;
  strategy_name: string;
  water_efficiency: number;
  soil_health: number;
  erosion_protection: number;
  income_market: number;
  base_score: number;
  probability_first: number;
  mean_rank: number;
  created_at: string;
};

export type EvidencePassport = {
  id: string;
  pilot_cell_id: string;
  season: string;
  strategy_name: string;
  evidence_tier: string;
  datasets: string[];
  coverage: number;
  method: string;
  uncertainty: number;
  gaps: string[];
  required_local_review: string[];
  created_at: string;
};

export type DecisionLog = {
  id: string;
  pilot_cell_id: string;
  season: string;
  user_id: string;
  selected_strategy: string;
  priority_weights: Record<string, number>;
  notes: string | null;
  created_at: string;
};

export type OutcomeReport = {
  id: string;
  pilot_cell_id: string;
  season: string;
  user_id: string;
  actual_outcome: string;
  yield_estimate: number | null;
  feedback_notes: string | null;
  created_at: string;
};

export type PriorityCriteria = {
  key: string;
  label: string;
  description: string;
  defaultWeight: number;
};

export const PRIORITY_CRITERIA: PriorityCriteria[] = [
  {
    key: "water_efficiency",
    label: "Water Efficiency",
    description: "Optimize for rainfall capture and irrigation efficiency",
    defaultWeight: 0.4,
  },
  {
    key: "soil_health",
    label: "Soil Health",
    description: "Maintain and improve soil organic matter and fertility",
    defaultWeight: 0.3,
  },
  {
    key: "erosion_protection",
    label: "Erosion Protection",
    description: "Minimize soil loss from wind and water erosion",
    defaultWeight: 0.2,
  },
  {
    key: "income_market",
    label: "Income & Market Access",
    description: "Maximize profitability and market opportunities",
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

export type FarmContext = {
  pilotCell: PilotCell | null;
  season: string;
  existingRotation: ExistingRotationInput | null;
  priorityWeights: Record<string, number>;
};