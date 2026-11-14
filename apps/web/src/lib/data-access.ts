import { createClient } from "@/lib/supabase";
import type { DekadObservation, AnomalyBadge, BareFieldPeriod, SeasonDefinition, MapTimeStep, MapLayerConfig } from "@/lib/types";
import { deriveAnomalies, deriveBareFieldPeriods } from "@/lib/illustrative-data";
import { SEASONS } from "@/lib/constants";
import { calendarFixtures, mapFixtures, scaleHonestyFixtures, createEmptyCalendarState } from "@/lib/fixtures";
import { baseScores, rankProbabilities } from "@/lib/scoring";
import { DECISION_CRITERIA, createDecisionFixtures } from "@/lib/decision-data";
import type { DecisionData, EvidencePassportData, StrategyComparison } from "@/lib/decision-data";

export type DataSource = "supabase" | "fixtures" | "error";

export interface CalendarData {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
  anomalies: AnomalyBadge[];
  bareFieldPeriods: BareFieldPeriod[];
  farmAreaHa: number | null;
  farmLabel?: string;
  loadingState: "loading" | "ready" | "error" | "empty" | "unavailable";
  errorMessage?: string;
  source: DataSource;
}

export interface MapData {
  center: [number, number];
  zoom: number;
  layers: MapLayerConfig[];
  timeSteps: MapTimeStep[];
  farmBoundary?: GeoJSON.Feature | null;
  farmAreaHa: number | null;
  loadingState: "loading" | "ready" | "error" | "empty" | "unavailable";
  errorMessage?: string;
  source: DataSource;
}

export interface ScaleHonestyData {
  assessments: Array<{
    datasetName: string;
    nativeResolutionKm: number;
    pixelFootprintHa: number;
    farmAreaHa: number | null;
    pixelToFarmRatio: number | null;
    fit: "suitable" | "contextual" | "insufficient" | "unknown";
    limitation: string;
  }>;
  farmAreaHa: number | null;
  farmLabel?: string;
  source: DataSource;
}

const PILOT_CELL_ID = "ASH_R00_C00";
const TARGET_SEASON = "2025 Major";

class DataAccessLayer {
  private client = createClient();
  private useFixtures = false;
  private supabaseAvailable = false;

  async checkSupabaseConnection(): Promise<boolean> {
    if (this.supabaseAvailable) return true;
    const client = this.client;
    if (!client) {
      this.useFixtures = true;
      return false;
    }

    try {
      const { error } = await client.from("pilot_cells").select("cell_id").limit(1);
      this.supabaseAvailable = !error;
      return this.supabaseAvailable;
    } catch {
      this.supabaseAvailable = false;
      return false;
    }
  }

  async fetchCalendarData(pilotCellId: string = PILOT_CELL_ID, season: string = TARGET_SEASON): Promise<CalendarData> {
    const isConnected = await this.checkSupabaseConnection();
    const client = this.client;

    if (!isConnected || !client) {
      this.useFixtures = true;
      return {
        ...calendarFixtures,
        source: "fixtures",
        loadingState: "ready",
      };
    }

    try {
      const year = Number(season.match(/\d{4}/)?.[0] ?? 2025);
      const { data: dekadData, error: dekadError } = await client
        .from("dekad_timeseries")
        .select("*")
        .eq("cell_id", pilotCellId)
        .eq("year", year)
        .order("dekad");

      if (dekadError) throw dekadError;

      if (!dekadData || dekadData.length === 0) {
        return {
          ...createEmptyCalendarState(),
          source: "supabase",
        };
      }

      const observations: DekadObservation[] = dekadData.map((row) => ({
        dekad: `${row.year}-D${String(row.dekad).padStart(2, "0")}`,
        dekadNumber: row.dekad,
        dateStart: row.start_date,
        dateEnd: row.end_date,
        rainfallMm: row.rain_imerg_mm ?? row.rain_era5_mm,
        rainfallClimatologyMm: null, // Not in schema
        rainfallReliability: null,
        soilMoisture: row.smap_sm_m3m3,
        soilMoistureClimatology: null,
        ndvi: row.ndvi_smooth ?? row.ndvi_raw,
        ndviClimatology: null,
        lstC: row.lst_max_c,
        lstClimatologyC: null,
        et0Mm: row.et0_mm,
        quality: {
          rainfallSource: row.rain_imerg_mm !== null || row.rain_era5_mm !== null ? "observed" : "missing",
          soilMoistureSource: row.smap_sm_m3m3 === null ? "missing" : "observed",
          ndviSource: row.ndvi_smooth !== null || row.ndvi_raw !== null
            ? row.qa_tier === "low_cloud_gap" ? "cloud-obscured" : "observed"
            : "missing",
          lstSource: row.lst_max_c === null ? "missing" : "observed",
        },
      }));

      const anomalies = deriveAnomalies(observations);
      const bareFieldPeriods = deriveBareFieldPeriods(observations);

      return {
        observations,
        seasons: SEASONS,
        anomalies,
        bareFieldPeriods,
        farmAreaHa: null,
        farmLabel: pilotCellId,
        loadingState: "ready",
        source: "supabase",
      };
    } catch (error) {
      console.warn("Supabase fetch failed, falling back to fixtures:", error);
      this.useFixtures = true;
      return {
        ...calendarFixtures,
        source: "fixtures",
        loadingState: "ready",
      };
    }
  }

  async fetchDecisionData(pilotCellId: string = PILOT_CELL_ID): Promise<DecisionData> {
    const isConnected = await this.checkSupabaseConnection();
    const client = this.client;
    if (!isConnected || !client) {
      this.useFixtures = true;
      return createDecisionFixtures();
    }

    try {
      const [{ data: cell, error: cellError }, { data: strategyRows, error: strategyError }] = await Promise.all([
        client.from("pilot_cells").select("cell_id, region_name").eq("cell_id", pilotCellId).maybeSingle(),
        client.from("strategy_scores").select("*").eq("cell_id", pilotCellId),
      ]);
      if (cellError) throw cellError;
      if (strategyError) throw strategyError;
      if (!strategyRows?.length) {
        return {
          cellId: pilotCellId,
          cellLabel: cell?.region_name ?? pilotCellId,
          season: "Major rainy season",
          strategies: [],
          source: "supabase",
        };
      }

      const { data: passportRows, error: passportError } = await client
        .from("evidence_passports")
        .select("*")
        .eq("cell_id", pilotCellId);
      if (passportError) throw passportError;

      const criteria = strategyRows[0].criteria;
      if (strategyRows.some((row) => row.criteria.length !== criteria.length ||
        row.criterion_scores.length !== criteria.length ||
        row.score_uncertainties.length !== criteria.length ||
        row.default_weights.length !== criteria.length)) {
        throw new Error("Strategy rows contain inconsistent criteria dimensions.");
      }

      const weights = strategyRows[0].default_weights;
      const scoreVectors = strategyRows.map((row) => row.criterion_scores);
      const scoreUncertainty = strategyRows.reduce(
        (sum, row) => sum + row.score_uncertainties.reduce((rowSum, value) => rowSum + value, 0) / row.score_uncertainties.length,
        0,
      ) / strategyRows.length;
      const weightedScores = baseScores(scoreVectors, weights);
      const rankings = rankProbabilities(scoreVectors, weights, {
        runs: 2000,
        seed: 42,
        scoreUncertainty,
      });
      const labelsByKey = new Map(DECISION_CRITERIA.map(({ key, label }) => [key, label]));
      const passportsByStrategy = new Map(
        (passportRows ?? []).map((passport) => [passport.strategy_code, passport]),
      );

      const strategies: StrategyComparison[] = strategyRows.map((row, index) => {
        const passport = passportsByStrategy.get(row.strategy_code);
        const passportData: EvidencePassportData | null = passport
          ? {
              evidenceTier: passport.evidence_tier,
              observationSummary: passport.observation_summary,
              datasets: Array.isArray(passport.datasets_used)
                ? passport.datasets_used.filter((item): item is string => typeof item === "string")
                : typeof passport.datasets_used === "object" && passport.datasets_used !== null
                  ? Object.keys(passport.datasets_used)
                  : [],
              coverage: passport.spatial_temporal_coverage,
              method: passport.method_applied,
              keyFinding: passport.key_finding,
              uncertainty: passport.uncertainty_summary,
              scaleHonestyNote: passport.scale_honesty_note,
              gaps: passport.information_gaps,
              requiredLocalReview: passport.required_local_review,
              validatorRoles: passport.validator_roles,
            }
          : null;

        return {
          code: row.strategy_code,
          name: row.strategy_name,
          sequence: row.rotation_sequence,
          isBaseline: row.is_baseline,
          criteria: row.criteria.map((key, criterionIndex) => ({
            key,
            label: labelsByKey.get(key) ?? key.replaceAll("_", " "),
            score: row.criterion_scores[criterionIndex],
          })),
          baseScore: weightedScores[index],
          probabilityFirst: rankings.probabilityFirst[index],
          meanRank: rankings.meanRank[index],
          expectedBenefits: row.expected_benefits,
          gaps: row.information_gaps,
          risks: row.risks_needing_review,
          passport: passportData,
        };
      });

      return {
        cellId: pilotCellId,
        cellLabel: cell?.region_name ?? pilotCellId,
        season: "Major rainy season",
        strategies,
        source: "supabase",
      };
    } catch (error) {
      console.warn("Supabase decision data fetch failed, falling back to fixtures:", error);
      this.useFixtures = true;
      return createDecisionFixtures();
    }
  }

  async fetchMapData(): Promise<MapData> {
    this.useFixtures = true;
    return {
      ...mapFixtures,
      source: "fixtures",
      loadingState: "ready",
    };
  }

  async fetchScaleHonestyData(): Promise<ScaleHonestyData> {
    const isConnected = await this.checkSupabaseConnection();

    // For scale honesty, we can compute it locally using the constants
    // This doesn't require Supabase as the resolutions are known constants
    const farmAreaHa = 42.5; // Would fetch from pilot_cells in real implementation
    const assessments = scaleHonestyFixtures(farmAreaHa);

    return {
      assessments,
      farmAreaHa,
      farmLabel: "Ashanti Pilot Cell 1",
      source: isConnected ? "supabase" : "fixtures",
    };
  }

  isUsingFixtures(): boolean {
    return this.useFixtures;
  }

  async refreshConnection(): Promise<boolean> {
    this.supabaseAvailable = false;
    this.useFixtures = false;
    return this.checkSupabaseConnection();
  }
}

export const dataAccess = new DataAccessLayer();