import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type PilotCell = {
  cell_id: string;
  region_name: string;
  row_idx: number;
  col_idx: number;
  centre_lat: number;
  centre_lon: number;
  geom: unknown;
  centroid: unknown;
  elevation_m: number | null;
  slope_pct: number | null;
  soil_texture: string | null;
  soil_organic_carbon_g_kg: number | null;
  soil_ph: number | null;
  native_resolutions_km: Json;
  created_at: string;
};

type DekadTimeseries = {
  cell_id: string;
  year: number;
  dekad: number;
  start_date: string;
  end_date: string;
  rain_imerg_mm: number | null;
  rain_era5_mm: number | null;
  smap_sm_m3m3: number | null;
  smap_anomaly_z: number | null;
  ndvi_raw: number | null;
  ndvi_smooth: number | null;
  optical_valid_frac: number | null;
  lst_max_c: number | null;
  et0_mm: number | null;
  water_balance_mm: number | null;
  bare_field_flag: boolean;
  qa_tier: string;
  provenance_id: string | null;
};

type SeasonFeatures = {
  cell_id: string;
  year: number;
  season: string;
  onset_dekad: number | null;
  cessation_dekad: number | null;
  total_rain_mm: number | null;
  rain_cv: number | null;
  longest_dry_spell_days: number | null;
  heavy_rain_days: number | null;
  heat_stress_days: number | null;
  mean_sm_anomaly_z: number | null;
  ndvi_peak: number | null;
  bare_period_fraction: number | null;
  erosion_exposure_index: number | null;
  anomaly_score_m1: number | null;
  is_anomalous_season: boolean;
  cluster_id_m2: number | null;
  cluster_label_m2: string | null;
  trend_sen_slope_mm_yr: number | null;
  created_at: string;
};

type EvidencePassport = {
  passport_id: string;
  cell_id: string;
  strategy_code: string;
  evidence_tier: string;
  observation_summary: string;
  datasets_used: Json;
  spatial_temporal_coverage: Json;
  method_applied: string;
  key_finding: string;
  uncertainty_summary: string;
  scale_honesty_note: string;
  information_gaps: string[];
  required_local_review: string[];
  validator_roles: string[];
  created_at: string;
};

type StrategyScore = {
  cell_id: string;
  strategy_code: string;
  strategy_name: string;
  rotation_sequence: string;
  is_baseline: boolean;
  criteria: string[];
  criterion_scores: number[];
  score_uncertainties: number[];
  default_weights: number[];
  default_base_score: number;
  default_prob_first: number;
  default_mean_rank: number;
  expected_benefits: string[];
  information_gaps: string[];
  risks_needing_review: string[];
  passport_id: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      pilot_cells: Table<PilotCell>;
      dekad_timeseries: Table<DekadTimeseries>;
      season_features: Table<SeasonFeatures>;
      evidence_passports: Table<EvidencePassport>;
      strategy_scores: Table<StrategyScore>;
      decision_logs: Table<Record<string, Json>>;
      outcome_reports: Table<Record<string, Json>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}
