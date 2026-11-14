import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const createClient = () =>
  createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      pilot_cells: {
        Row: {
          id: string;
          name: string;
          geometry: unknown;
          center_lat: number;
          center_lon: number;
          area_ha: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          geometry: unknown;
          center_lat: number;
          center_lon: number;
          area_ha: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          geometry?: unknown;
          center_lat?: number;
          center_lon?: number;
          area_ha?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      dekad_timeseries: {
        Row: {
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
        Insert: {
          id?: string;
          pilot_cell_id: string;
          dekad: string;
          rainfall_mm?: number | null;
          soil_moisture?: number | null;
          ndvi?: number | null;
          lst_c?: number | null;
          et0_mm?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          dekad?: string;
          rainfall_mm?: number | null;
          soil_moisture?: number | null;
          ndvi?: number | null;
          lst_c?: number | null;
          et0_mm?: number | null;
          created_at?: string;
        };
      };
      season_features: {
        Row: {
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
        Insert: {
          id?: string;
          pilot_cell_id: string;
          season: string;
          onset_dekad?: number | null;
          total_rainfall_mm?: number | null;
          rainfall_cv?: number | null;
          longest_dry_spell?: number | null;
          heavy_rain_days?: number | null;
          heat_stress_days?: number | null;
          mean_soil_moisture?: number | null;
          soil_moisture_anomaly?: number | null;
          mean_ndvi?: number | null;
          ndvi_anomaly?: number | null;
          bare_period_fraction?: number | null;
          slope_deg?: number | null;
          erosion_exposure?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          season?: string;
          onset_dekad?: number | null;
          total_rainfall_mm?: number | null;
          rainfall_cv?: number | null;
          longest_dry_spell?: number | null;
          heavy_rain_days?: number | null;
          heat_stress_days?: number | null;
          mean_soil_moisture?: number | null;
          soil_moisture_anomaly?: number | null;
          mean_ndvi?: number | null;
          ndvi_anomaly?: number | null;
          bare_period_fraction?: number | null;
          slope_deg?: number | null;
          erosion_exposure?: number | null;
          created_at?: string;
        };
      };
      strategy_scores: {
        Row: {
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
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          season?: string;
          strategy_name?: string;
          water_efficiency?: number;
          soil_health?: number;
          erosion_protection?: number;
          income_market?: number;
          base_score?: number;
          probability_first?: number;
          mean_rank?: number;
          created_at?: string;
        };
      };
      evidence_passports: {
        Row: {
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
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          season?: string;
          strategy_name?: string;
          evidence_tier?: string;
          datasets?: string[];
          coverage?: number;
          method?: string;
          uncertainty?: number;
          gaps?: string[];
          required_local_review?: string[];
          created_at?: string;
        };
      };
      decision_logs: {
        Row: {
          id: string;
          pilot_cell_id: string;
          season: string;
          user_id: string;
          selected_strategy: string;
          priority_weights: Record<string, number>;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pilot_cell_id: string;
          season: string;
          user_id: string;
          selected_strategy: string;
          priority_weights: Record<string, number>;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          season?: string;
          user_id?: string;
          selected_strategy?: string;
          priority_weights?: Record<string, number>;
          notes?: string | null;
          created_at?: string;
        };
      };
      outcome_reports: {
        Row: {
          id: string;
          pilot_cell_id: string;
          season: string;
          user_id: string;
          actual_outcome: string;
          yield_estimate: number | null;
          feedback_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pilot_cell_id: string;
          season: string;
          user_id: string;
          actual_outcome: string;
          yield_estimate?: number | null;
          feedback_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pilot_cell_id?: string;
          season?: string;
          user_id?: string;
          actual_outcome?: string;
          yield_estimate?: number | null;
          feedback_notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};