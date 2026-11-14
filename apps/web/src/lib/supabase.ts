import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ASHANTI_PILOT_CELLS,
  EVIDENCE_PASSPORTS,
  INITIAL_DECISION_LOGS,
  INITIAL_OUTCOME_REPORTS,
  ROTATION_STRATEGIES,
  SEASON_FEATURES_BY_CELL,
} from "@/constants/ashanti-pilot";
import type {
  DecisionLogRecord,
  EvidenceGrade,
  EvidencePassport,
  EvidenceTier,
  OutcomeReportRecord,
  PilotCell,
  RotationStrategySpec,
  SeasonFeatureSummary,
  UserRole,
} from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are present, or null in offline/static fixture mode.
 */
export function createOptionalSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

const CELL_CACHE_PREFIX = "fieldshift.web.cell.";
const DECISION_QUEUE_KEY = "fieldshift.web.queue.decisions";
const OUTCOME_QUEUE_KEY = "fieldshift.web.queue.outcomes";
const LOCAL_DECISIONS_KEY = "fieldshift.web.local.decisions";
const LOCAL_OUTCOMES_KEY = "fieldshift.web.local.outcomes";

export interface PilotWorkspacePayload {
  cellId: string;
  source: "supabase" | "cache" | "fixture";
  cells: PilotCell[];
  strategies: RotationStrategySpec[];
  passports: EvidencePassport[];
  seasonFeature: SeasonFeatureSummary;
  syncedAt: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidTier(tier: string): tier is EvidenceTier {
  return (
    tier === "established_science" ||
    tier === "data_derived_finding" ||
    tier === "farmer_reported_observation" ||
    tier === "unverified_hypothesis" ||
    tier === "expert_validated_insight"
  );
}

function formatDatasetsUsed(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item) => {
    if (typeof item === "string") {
      return item;
    }
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const product =
        typeof rec.product === "string"
          ? rec.product
          : String(rec.dataset_key ?? "Dataset");
      const mode = typeof rec.retrieval_mode === "string" ? rec.retrieval_mode : "pilot";
      return `${product} (${mode})`;
    }
    return String(item);
  });
}

function formatCoverage(raw: unknown, cellId: string): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const years = Array.isArray(rec.years) ? rec.years : [2022, 2025];
    return `${cellId}, ${years[0] ?? 2022}–${years[years.length - 1] ?? 2025} (${String(rec.time_step ?? "dekad")})`;
  }
  return `${cellId}, 2022–2025`;
}

export function getOfflineCellPayload(cellId: string): PilotWorkspacePayload {
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(`${CELL_CACHE_PREFIX}${cellId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as PilotWorkspacePayload;
        if (Array.isArray(parsed.strategies) && parsed.strategies.length > 0) {
          return { ...parsed, source: "cache" };
        }
      }
    } catch {
      // Ignore corrupt storage entries
    }
  }

  return {
    cellId,
    source: "fixture",
    cells: ASHANTI_PILOT_CELLS,
    strategies: ROTATION_STRATEGIES,
    passports: EVIDENCE_PASSPORTS.map((ep) => ({ ...ep, cellId })),
    seasonFeature: SEASON_FEATURES_BY_CELL[cellId] ?? SEASON_FEATURES_BY_CELL.ASH_R05_C05,
    syncedAt: "2026-11-14T00:00:00Z",
  };
}

export async function fetchPilotWorkspaceData(
  cellId: string,
): Promise<PilotWorkspacePayload> {
  const client = createOptionalSupabaseClient();
  const fallback = getOfflineCellPayload(cellId);
  if (!client) {
    return fallback;
  }

  try {
    const [stratRes, passRes, featRes] = await Promise.all([
      client
        .from("strategy_scores")
        .select(
          "strategy_code, strategy_name, rotation_sequence, is_baseline, criterion_scores, expected_benefits, information_gaps, risks_needing_review",
        )
        .eq("cell_id", cellId),
      client
        .from("evidence_passports")
        .select(
          "passport_id, strategy_code, evidence_tier, observation_summary, datasets_used, spatial_temporal_coverage, method_applied, key_finding, uncertainty_summary, scale_honesty_note, information_gaps, required_local_review",
        )
        .eq("cell_id", cellId),
      client
        .from("season_features")
        .select("*")
        .eq("cell_id", cellId)
        .order("year", { ascending: false })
        .limit(1),
    ]);

    const stratRows = stratRes.data;
    const passRows = passRes.data;

    if (
      stratRes.error ||
      !Array.isArray(stratRows) ||
      stratRows.length === 0
    ) {
      return fallback;
    }

    const strategies: RotationStrategySpec[] = stratRows.map((row) => {
      const scores = Array.isArray(row.criterion_scores) ? row.criterion_scores : [0.5, 0.5, 0.5, 0.5];
      return {
        code: String(row.strategy_code),
        name: String(row.strategy_name),
        sequence: String(row.rotation_sequence),
        isBaseline: Boolean(row.is_baseline),
        criterionScores: [
          Number(scores[0] ?? 0.5),
          Number(scores[1] ?? 0.5),
          Number(scores[2] ?? 0.5),
          Number(scores[3] ?? 0.5),
        ],
        expectedBenefits: Array.isArray(row.expected_benefits) ? row.expected_benefits : [],
        informationGaps: Array.isArray(row.information_gaps) ? row.information_gaps : [],
        risksNeedingReview: Array.isArray(row.risks_needing_review)
          ? row.risks_needing_review
          : [],
      };
    });

    const passports: EvidencePassport[] = Array.isArray(passRows) && passRows.length > 0
      ? passRows.map((row) => ({
          id: String(row.passport_id),
          cellId,
          strategyCode: String(row.strategy_code),
          title: String(row.key_finding || row.strategy_code),
          evidenceTier: isValidTier(String(row.evidence_tier))
            ? (row.evidence_tier as EvidenceTier)
            : "data_derived_finding",
          observationSummary: String(row.observation_summary ?? ""),
          datasetsUsed: formatDatasetsUsed(row.datasets_used),
          spatialTemporalCoverage: formatCoverage(row.spatial_temporal_coverage, cellId),
          methodApplied: String(row.method_applied ?? ""),
          uncertaintySummary: String(row.uncertainty_summary ?? ""),
          scaleHonestyNote: String(row.scale_honesty_note ?? ""),
          informationGaps: Array.isArray(row.information_gaps) ? row.information_gaps : [],
          requiredLocalReview: Array.isArray(row.required_local_review)
            ? row.required_local_review
            : [],
        }))
      : fallback.passports;

    const latestFeatureRow =
      Array.isArray(featRes.data) && featRes.data.length > 0
        ? (featRes.data[0] as SeasonFeatureSummary)
        : fallback.seasonFeature;

    const payload: PilotWorkspacePayload = {
      cellId,
      source: "supabase",
      cells: ASHANTI_PILOT_CELLS,
      strategies,
      passports,
      seasonFeature: latestFeatureRow,
      syncedAt: new Date().toISOString(),
    };

    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(`${CELL_CACHE_PREFIX}${cellId}`, JSON.stringify(payload));
      } catch {
        // Ignore storage quota errors
      }
    }
    return payload;
  } catch {
    return fallback;
  }
}

function readJsonList<T>(key: string, defaultValue: T[]): T[] {
  const storage = getStorage();
  if (!storage) {
    return defaultValue;
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeJsonList<T>(key: string, items: T[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export function getPendingQueueCount(): number {
  const d = readJsonList<DecisionLogRecord>(DECISION_QUEUE_KEY, []);
  const o = readJsonList<OutcomeReportRecord>(OUTCOME_QUEUE_KEY, []);
  return d.length + o.length;
}

export async function listDecisionLogs(): Promise<DecisionLogRecord[]> {
  const localItems = readJsonList<DecisionLogRecord>(LOCAL_DECISIONS_KEY, INITIAL_DECISION_LOGS);
  const client = createOptionalSupabaseClient();
  if (!client) {
    return localItems;
  }
  try {
    const { data, error } = await client
      .from("decision_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !Array.isArray(data) || data.length === 0) {
      return localItems;
    }
    const remote = data.map((row) => ({ ...(row as DecisionLogRecord), synced: true }));
    const queued = readJsonList<DecisionLogRecord>(DECISION_QUEUE_KEY, []);
    return [...queued, ...remote];
  } catch {
    return localItems;
  }
}

export interface SubmitDecisionInput {
  cellId: string;
  sessionLabel: string;
  loggedByRole: UserRole;
  existingRotation: string;
  selectedStrategyCode: string;
  farmAreaHa: number;
  priorityWeights: Record<string, number>;
  computedBaseScores: Record<string, number>;
  rankProbabilities: Record<string, number>;
  reasoningNotes: string;
}

export async function logDecisionRecord(
  input: SubmitDecisionInput,
): Promise<{ status: "submitted" | "queued"; record: DecisionLogRecord }> {
  const record: DecisionLogRecord = {
    decision_id: `dec-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    cell_id: input.cellId,
    session_label: input.sessionLabel || null,
    logged_by_role: input.loggedByRole,
    existing_rotation: input.existingRotation,
    selected_strategy_code: input.selectedStrategyCode,
    farm_area_ha: input.farmAreaHa,
    priority_weights: input.priorityWeights,
    computed_base_scores: input.computedBaseScores,
    rank_probabilities: input.rankProbabilities,
    reasoning_notes: input.reasoningNotes || null,
    created_at: new Date().toISOString(),
    synced: false,
  };

  const client = createOptionalSupabaseClient();
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  if (client && isOnline) {
    try {
      const { error } = await client.from("decision_logs").insert({
        cell_id: record.cell_id,
        session_label: record.session_label,
        logged_by_role: record.logged_by_role,
        existing_rotation: record.existing_rotation,
        selected_strategy_code: record.selected_strategy_code,
        farm_area_ha: record.farm_area_ha,
        priority_weights: record.priority_weights,
        computed_base_scores: record.computed_base_scores,
        rank_probabilities: record.rank_probabilities,
        reasoning_notes: record.reasoning_notes,
      });
      if (!error) {
        const syncedRecord = { ...record, synced: true };
        const existing = readJsonList<DecisionLogRecord>(LOCAL_DECISIONS_KEY, INITIAL_DECISION_LOGS);
        writeJsonList(LOCAL_DECISIONS_KEY, [syncedRecord, ...existing].slice(0, 30));
        return { status: "submitted", record: syncedRecord };
      }
    } catch {
      // Fall through to offline queue
    }
  }

  const queue = readJsonList<DecisionLogRecord>(DECISION_QUEUE_KEY, []);
  writeJsonList(DECISION_QUEUE_KEY, [record, ...queue]);
  const existing = readJsonList<DecisionLogRecord>(LOCAL_DECISIONS_KEY, INITIAL_DECISION_LOGS);
  writeJsonList(LOCAL_DECISIONS_KEY, [record, ...existing].slice(0, 30));
  return { status: "queued", record };
}

export async function listOutcomeReports(): Promise<OutcomeReportRecord[]> {
  const localItems = readJsonList<OutcomeReportRecord>(LOCAL_OUTCOMES_KEY, INITIAL_OUTCOME_REPORTS);
  const client = createOptionalSupabaseClient();
  if (!client) {
    return localItems;
  }
  try {
    const { data, error } = await client
      .from("outcome_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !Array.isArray(data) || data.length === 0) {
      return localItems;
    }
    const remote = data.map((row) => ({ ...(row as OutcomeReportRecord), synced: true }));
    const queued = readJsonList<OutcomeReportRecord>(OUTCOME_QUEUE_KEY, []);
    return [...queued, ...remote];
  } catch {
    return localItems;
  }
}

export interface SubmitOutcomeInput {
  cellId: string;
  seasonYear: number;
  seasonName: string;
  outcomeSummary: string;
  soilCoverObserved: string;
  waterStressObserved: string;
  pestOrDiseaseNotes: string;
}

export async function submitOutcomeReport(
  input: SubmitOutcomeInput,
): Promise<{ status: "submitted" | "queued"; record: OutcomeReportRecord }> {
  const record: OutcomeReportRecord = {
    outcome_id: `out-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    decision_id: null,
    cell_id: input.cellId,
    season_year: input.seasonYear,
    season_name: input.seasonName,
    outcome_summary: input.outcomeSummary,
    soil_cover_observed: input.soilCoverObserved || null,
    water_stress_observed: input.waterStressObserved || null,
    pest_or_disease_notes: input.pestOrDiseaseNotes || null,
    evidence_grade: "farmer_reported",
    graded_by_officer_id: null,
    eligible_for_model_update: false,
    created_at: new Date().toISOString(),
    reviewed_at: null,
    synced: false,
  };

  const client = createOptionalSupabaseClient();
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  if (client && isOnline) {
    try {
      const { error } = await client.from("outcome_reports").insert({
        cell_id: record.cell_id,
        season_year: record.season_year,
        season_name: record.season_name,
        outcome_summary: record.outcome_summary,
        soil_cover_observed: record.soil_cover_observed,
        water_stress_observed: record.water_stress_observed,
        pest_or_disease_notes: record.pest_or_disease_notes,
        evidence_grade: "farmer_reported",
        eligible_for_model_update: false,
      });
      if (!error) {
        const syncedRecord = { ...record, synced: true };
        const existing = readJsonList<OutcomeReportRecord>(LOCAL_OUTCOMES_KEY, INITIAL_OUTCOME_REPORTS);
        writeJsonList(LOCAL_OUTCOMES_KEY, [syncedRecord, ...existing].slice(0, 30));
        return { status: "submitted", record: syncedRecord };
      }
    } catch {
      // Queue cleanly
    }
  }

  const queue = readJsonList<OutcomeReportRecord>(OUTCOME_QUEUE_KEY, []);
  writeJsonList(OUTCOME_QUEUE_KEY, [record, ...queue]);
  const existing = readJsonList<OutcomeReportRecord>(LOCAL_OUTCOMES_KEY, INITIAL_OUTCOME_REPORTS);
  writeJsonList(LOCAL_OUTCOMES_KEY, [record, ...existing].slice(0, 30));
  return { status: "queued", record };
}

export async function gradeOutcomeReport(
  outcomeId: string,
  grade: EvidenceGrade,
  eligibleForModelUpdate: boolean,
  officerId: string,
): Promise<{ status: "updated" | "local_only"; reports: OutcomeReportRecord[] }> {
  const now = new Date().toISOString();
  const localItems = readJsonList<OutcomeReportRecord>(LOCAL_OUTCOMES_KEY, INITIAL_OUTCOME_REPORTS);
  const updated = localItems.map((item) =>
    item.outcome_id === outcomeId
      ? {
          ...item,
          evidence_grade: grade,
          eligible_for_model_update:
            grade === "confounded_excluded" || grade === "farmer_reported"
              ? false
              : eligibleForModelUpdate,
          graded_by_officer_id: officerId,
          reviewed_at: now,
        }
      : item,
  );
  writeJsonList(LOCAL_OUTCOMES_KEY, updated);

  const client = createOptionalSupabaseClient();
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  if (client && isOnline && !outcomeId.startsWith("out-demo-") && !outcomeId.startsWith("out-17")) {
    try {
      const { error } = await client
        .from("outcome_reports")
        .update({
          evidence_grade: grade,
          eligible_for_model_update:
            grade === "confounded_excluded" || grade === "farmer_reported"
              ? false
              : eligibleForModelUpdate,
          reviewed_at: now,
        })
        .eq("outcome_id", outcomeId);
      if (!error) {
        return { status: "updated", reports: updated };
      }
    } catch {
      // Local demo update preserved
    }
  }

  return { status: "local_only", reports: updated };
}

export async function flushPendingOfflineQueue(): Promise<{
  flushed: number;
  remaining: number;
}> {
  const client = createOptionalSupabaseClient();
  if (!client || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { flushed: 0, remaining: getPendingQueueCount() };
  }

  let flushed = 0;
  const decQueue = readJsonList<DecisionLogRecord>(DECISION_QUEUE_KEY, []);
  const remainingDec: DecisionLogRecord[] = [];
  for (const row of decQueue) {
    try {
      const { error } = await client.from("decision_logs").insert({
        cell_id: row.cell_id,
        session_label: row.session_label,
        logged_by_role: row.logged_by_role,
        existing_rotation: row.existing_rotation,
        selected_strategy_code: row.selected_strategy_code,
        farm_area_ha: row.farm_area_ha,
        priority_weights: row.priority_weights,
        computed_base_scores: row.computed_base_scores,
        rank_probabilities: row.rank_probabilities,
        reasoning_notes: row.reasoning_notes,
      });
      if (error) {
        remainingDec.push(row);
      } else {
        flushed++;
      }
    } catch {
      remainingDec.push(row);
    }
  }
  writeJsonList(DECISION_QUEUE_KEY, remainingDec);

  const outQueue = readJsonList<OutcomeReportRecord>(OUTCOME_QUEUE_KEY, []);
  const remainingOut: OutcomeReportRecord[] = [];
  for (const row of outQueue) {
    try {
      const { error } = await client.from("outcome_reports").insert({
        cell_id: row.cell_id,
        season_year: row.season_year,
        season_name: row.season_name,
        outcome_summary: row.outcome_summary,
        soil_cover_observed: row.soil_cover_observed,
        water_stress_observed: row.water_stress_observed,
        pest_or_disease_notes: row.pest_or_disease_notes,
        evidence_grade: "farmer_reported",
        eligible_for_model_update: false,
      });
      if (error) {
        remainingOut.push(row);
      } else {
        flushed++;
      }
    } catch {
      remainingOut.push(row);
    }
  }
  writeJsonList(OUTCOME_QUEUE_KEY, remainingOut);

  return { flushed, remaining: remainingDec.length + remainingOut.length };
}
