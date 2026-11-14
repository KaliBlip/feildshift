-- Phase 1 Field Shift schema: PostGIS pilot grid, dekad EO cube, features,
-- strategy scoring, Evidence Passports, feedback logging, and RLS policies.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Spatial analysis grid (~5.5 km cells covering the 50 x 50 km pilot area)
CREATE TABLE IF NOT EXISTS public.pilot_cells (
  cell_id text PRIMARY KEY,
  region_name text NOT NULL,
  row_idx integer NOT NULL,
  col_idx integer NOT NULL,
  centre_lat double precision NOT NULL,
  centre_lon double precision NOT NULL,
  geom geometry(Polygon, 4326) NOT NULL,
  centroid geometry(Point, 4326) NOT NULL,
  elevation_m double precision,
  slope_pct double precision,
  soil_texture text,
  soil_organic_carbon_g_kg double precision,
  soil_ph double precision,
  native_resolutions_km jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pilot_cells_geom
  ON public.pilot_cells USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_pilot_cells_centroid
  ON public.pilot_cells USING GIST (centroid);

-- 2. Harmonised 10-day (dekad) Earth observation time series cube
CREATE TABLE IF NOT EXISTS public.dekad_timeseries (
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  year integer NOT NULL,
  dekad integer NOT NULL CHECK (dekad BETWEEN 1 AND 36),
  start_date date NOT NULL,
  end_date date NOT NULL,
  rain_imerg_mm double precision,
  rain_era5_mm double precision,
  smap_sm_m3m3 double precision,
  smap_anomaly_z double precision,
  ndvi_raw double precision,
  ndvi_smooth double precision,
  optical_valid_frac double precision CHECK (optical_valid_frac IS NULL OR (optical_valid_frac >= 0 AND optical_valid_frac <= 1)),
  lst_max_c double precision,
  et0_mm double precision,
  water_balance_mm double precision,
  bare_field_flag boolean NOT NULL DEFAULT false,
  qa_tier text NOT NULL CHECK (qa_tier IN ('high', 'moderate', 'low_cloud_gap')),
  provenance_id text,
  PRIMARY KEY (cell_id, year, dekad)
);

CREATE INDEX IF NOT EXISTS idx_dekad_timeseries_cell_year
  ON public.dekad_timeseries (cell_id, year);

-- 3. Seasonal environmental features and M1-M4 unsupervised / trend summaries
CREATE TABLE IF NOT EXISTS public.season_features (
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  year integer NOT NULL,
  season text NOT NULL CHECK (season IN ('major', 'minor', 'annual')),
  onset_dekad integer,
  cessation_dekad integer,
  total_rain_mm double precision,
  rain_cv double precision,
  longest_dry_spell_days integer,
  heavy_rain_days integer,
  heat_stress_days integer,
  mean_sm_anomaly_z double precision,
  ndvi_peak double precision,
  bare_period_fraction double precision,
  erosion_exposure_index double precision,
  anomaly_score_m1 double precision,
  is_anomalous_season boolean NOT NULL DEFAULT false,
  cluster_id_m2 integer,
  cluster_label_m2 text,
  trend_sen_slope_mm_yr double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cell_id, year, season)
);

-- 4. Structured Evidence Passports for every finding / strategy recommendation
CREATE TABLE IF NOT EXISTS public.evidence_passports (
  passport_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  strategy_code text NOT NULL,
  evidence_tier text NOT NULL CHECK (
    evidence_tier IN (
      'established_science',
      'data_derived_finding',
      'farmer_reported_observation',
      'unverified_hypothesis',
      'expert_validated_insight'
    )
  ),
  observation_summary text NOT NULL,
  datasets_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  spatial_temporal_coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  method_applied text NOT NULL,
  key_finding text NOT NULL,
  uncertainty_summary text NOT NULL,
  scale_honesty_note text NOT NULL,
  information_gaps text[] NOT NULL DEFAULT '{}',
  required_local_review text[] NOT NULL DEFAULT '{}',
  validator_roles text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_passports_cell_strategy
  ON public.evidence_passports (cell_id, strategy_code);

-- 5. Multi-criteria strategy scores & default Monte Carlo stability summaries
CREATE TABLE IF NOT EXISTS public.strategy_scores (
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  strategy_code text NOT NULL,
  strategy_name text NOT NULL,
  rotation_sequence text NOT NULL,
  is_baseline boolean NOT NULL DEFAULT false,
  criteria text[] NOT NULL,
  criterion_scores double precision[] NOT NULL,
  score_uncertainties double precision[] NOT NULL,
  default_weights double precision[] NOT NULL,
  default_base_score double precision NOT NULL,
  default_prob_first double precision NOT NULL,
  default_mean_rank double precision NOT NULL,
  expected_benefits text[] NOT NULL DEFAULT '{}',
  information_gaps text[] NOT NULL DEFAULT '{}',
  risks_needing_review text[] NOT NULL DEFAULT '{}',
  passport_id uuid REFERENCES public.evidence_passports(passport_id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cell_id, strategy_code)
);

-- 6. Logged farmer & extension-officer rotation decisions
CREATE TABLE IF NOT EXISTS public.decision_logs (
  decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  session_label text,
  logged_by_role text NOT NULL CHECK (logged_by_role IN ('farmer', 'extension_officer', 'agronomist')),
  existing_rotation text NOT NULL,
  selected_strategy_code text NOT NULL,
  farm_area_ha double precision CHECK (farm_area_ha IS NULL OR farm_area_ha > 0),
  priority_weights jsonb NOT NULL,
  computed_base_scores jsonb NOT NULL,
  rank_probabilities jsonb NOT NULL,
  reasoning_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Controlled feedback outcome reports (graded by officers before model updates)
CREATE TABLE IF NOT EXISTS public.outcome_reports (
  outcome_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES public.decision_logs(decision_id) ON DELETE SET NULL,
  cell_id text NOT NULL REFERENCES public.pilot_cells(cell_id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  season_name text NOT NULL,
  outcome_summary text NOT NULL,
  soil_cover_observed text,
  water_stress_observed text,
  pest_or_disease_notes text,
  evidence_grade text NOT NULL DEFAULT 'farmer_reported' CHECK (
    evidence_grade IN (
      'farmer_reported',
      'officer_reviewed',
      'expert_validated',
      'confounded_excluded'
    )
  ),
  graded_by_officer_id uuid,
  eligible_for_model_update boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- Row-Level Security (RLS)
ALTER TABLE public.pilot_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dekad_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_reports ENABLE ROW LEVEL SECURITY;

-- Public read access for precomputed Earth observation & decision tables (writes via service_role only)
CREATE POLICY "Public read pilot_cells"
  ON public.pilot_cells FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read dekad_timeseries"
  ON public.dekad_timeseries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read season_features"
  ON public.season_features FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read evidence_passports"
  ON public.evidence_passports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read strategy_scores"
  ON public.strategy_scores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Decision logs: readable by authenticated/anon pilot clients; farmers & officers can insert
CREATE POLICY "Read decision_logs"
  ON public.decision_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon insert farmer decision_logs"
  ON public.decision_logs FOR INSERT
  TO anon
  WITH CHECK (logged_by_role = 'farmer');

CREATE POLICY "Authenticated insert decision_logs"
  ON public.decision_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Outcome reports: farmers submit unverified reports; only officers/agronomists grade them
CREATE POLICY "Read outcome_reports"
  ON public.outcome_reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Insert ungraded outcome_reports"
  ON public.outcome_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    evidence_grade = 'farmer_reported'
    AND eligible_for_model_update = false
  );

CREATE POLICY "Officers grade outcome_reports"
  ON public.outcome_reports FOR UPDATE
  TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('extension_officer', 'agronomist')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('extension_officer', 'agronomist')
  );
