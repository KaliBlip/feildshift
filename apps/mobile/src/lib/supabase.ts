import type {
  EvidencePassportEntry,
  RotationStrategySpec,
} from '@/constants/pilot-data';

export interface LivePilotCellPayload {
  strategies: RotationStrategySpec[];
  passports: EvidencePassportEntry[];
  syncedAt?: string;
}

const MEMORY_CELL_CACHE = new Map<string, LivePilotCellPayload>();
const STORAGE_PREFIX = 'fieldshift.pilot.cell.';

function getOptionalWebStorage(): Storage | null {
  try {
    const candidate = (globalThis as { localStorage?: Storage }).localStorage;
    return candidate ?? null;
  } catch {
    return null;
  }
}

export function cachePilotCellPayload(
  cellId: string,
  payload: LivePilotCellPayload,
): void {
  const stamped: LivePilotCellPayload = {
    ...payload,
    syncedAt: payload.syncedAt ?? new Date().toISOString(),
  };
  MEMORY_CELL_CACHE.set(cellId, stamped);
  const storage = getOptionalWebStorage();
  if (storage) {
    try {
      storage.setItem(`${STORAGE_PREFIX}${cellId}`, JSON.stringify(stamped));
    } catch {
      // Ignore quota / private-browsing storage errors cleanly
    }
  }
}

export function readCachedPilotPayload(
  cellId: string,
): LivePilotCellPayload | null {
  const inMem = MEMORY_CELL_CACHE.get(cellId);
  if (inMem) {
    return inMem;
  }
  const storage = getOptionalWebStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${cellId}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as LivePilotCellPayload;
    if (Array.isArray(parsed.strategies) && parsed.strategies.length > 0) {
      MEMORY_CELL_CACHE.set(cellId, parsed);
      return parsed;
    }
  } catch {
    // Ignore malformed cache entries
  }
  return null;
}

interface SupabaseStrategyRow {
  strategy_code: string;
  strategy_name: string;
  rotation_sequence: string;
  is_baseline: boolean;
  criterion_scores: number[];
  expected_benefits: string[];
  information_gaps: string[];
  risks_needing_review: string[];
}

interface SupabasePassportRow {
  passport_id: string;
  strategy_code: string;
  evidence_tier: string;
  observation_summary: string;
  datasets_used: unknown;
  spatial_temporal_coverage: unknown;
  method_applied: string;
  key_finding: string;
  uncertainty_summary: string;
  scale_honesty_note: string;
  information_gaps: string[];
  required_local_review: string[];
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url: url.replace(/\/+$/, ''), anonKey };
}

function toFourScores(values: number[] | undefined): [number, number, number, number] {
  if (!Array.isArray(values) || values.length < 4) {
    return [0.5, 0.5, 0.5, 0.5];
  }
  return [values[0], values[1], values[2], values[3]];
}

function isValidTier(tier: string): tier is EvidencePassportEntry['evidenceTier'] {
  return (
    tier === 'established_science' ||
    tier === 'data_derived_finding' ||
    tier === 'farmer_reported_observation' ||
    tier === 'unverified_hypothesis' ||
    tier === 'expert_validated_insight'
  );
}

function formatDatasetsUsed(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item) => {
    if (typeof item === 'string') {
      return item;
    }
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const product =
        typeof rec.product === 'string'
          ? rec.product
          : String(rec.dataset_key ?? 'Dataset');
      const mode = typeof rec.retrieval_mode === 'string' ? rec.retrieval_mode : 'pilot';
      return `${product} (${mode})`;
    }
    return String(item);
  });
}

function formatCoverage(raw: unknown, cellId: string): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    const years = Array.isArray(rec.years) ? rec.years : [2022, 2025];
    const minY = years[0] ?? 2022;
    const maxY = years[years.length - 1] ?? 2025;
    return `${cellId}, ${minY}-${maxY} (${String(rec.time_step ?? 'dekad')})`;
  }
  return `${cellId}, 2022-2025`;
}

/**
 * Fetch precomputed Phase 3 strategy scores and Evidence Passports from Supabase
 * PostgREST when EXPO_PUBLIC_SUPABASE_URL / ANON_KEY are configured.
 * Persists successful results in the offline cell cache and returns null cleanly
 * when unconfigured or offline.
 */
export async function fetchLivePilotStrategies(
  cellId: string,
): Promise<LivePilotCellPayload | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return null;
  }

  const headers = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    Accept: 'application/json',
  };

  try {
    const encodedCell = encodeURIComponent(cellId);
    const [stratRes, passRes] = await Promise.all([
      fetch(
        `${cfg.url}/rest/v1/strategy_scores?cell_id=eq.${encodedCell}&select=strategy_code,strategy_name,rotation_sequence,is_baseline,criterion_scores,expected_benefits,information_gaps,risks_needing_review`,
        { headers },
      ),
      fetch(
        `${cfg.url}/rest/v1/evidence_passports?cell_id=eq.${encodedCell}&select=passport_id,strategy_code,evidence_tier,observation_summary,datasets_used,spatial_temporal_coverage,method_applied,key_finding,uncertainty_summary,scale_honesty_note,information_gaps,required_local_review`,
        { headers },
      ),
    ]);

    if (!stratRes.ok || !passRes.ok) {
      return null;
    }

    const stratRows = (await stratRes.json()) as SupabaseStrategyRow[];
    const passRows = (await passRes.json()) as SupabasePassportRow[];
    if (!Array.isArray(stratRows) || stratRows.length === 0) {
      return null;
    }

    const strategies: RotationStrategySpec[] = stratRows.map((row) => ({
      code: row.strategy_code,
      name: row.strategy_name,
      sequence: row.rotation_sequence,
      isBaseline: Boolean(row.is_baseline),
      criterionScores: toFourScores(row.criterion_scores),
      expectedBenefits: Array.isArray(row.expected_benefits) ? row.expected_benefits : [],
      informationGaps: Array.isArray(row.information_gaps) ? row.information_gaps : [],
      risksNeedingReview: Array.isArray(row.risks_needing_review)
        ? row.risks_needing_review
        : [],
    }));

    const passports: EvidencePassportEntry[] = Array.isArray(passRows)
      ? passRows.map((row) => ({
          id: row.passport_id,
          strategyCode: row.strategy_code,
          title: row.key_finding || row.strategy_code,
          evidenceTier: isValidTier(row.evidence_tier)
            ? row.evidence_tier
            : 'data_derived_finding',
          observationSummary: row.observation_summary,
          datasetsUsed: formatDatasetsUsed(row.datasets_used),
          spatialTemporalCoverage: formatCoverage(row.spatial_temporal_coverage, cellId),
          methodApplied: row.method_applied,
          uncertaintySummary: row.uncertainty_summary,
          scaleHonestyNote: row.scale_honesty_note,
          informationGaps: Array.isArray(row.information_gaps) ? row.information_gaps : [],
          requiredLocalReview: Array.isArray(row.required_local_review)
            ? row.required_local_review
            : [],
        }))
      : [];

    const payload: LivePilotCellPayload = {
      strategies,
      passports,
      syncedAt: new Date().toISOString(),
    };
    cachePilotCellPayload(cellId, payload);
    return payload;
  } catch {
    return null;
  }
}

export interface DecisionLogInput {
  cellId: string;
  sessionLabel?: string | null;
  existingRotation?: string;
  selectedStrategyCode: string;
  farmAreaHa: number;
  priorityWeights: number[];
  computedBaseScores: Record<string, number>;
  rankProbabilities: Record<string, number>;
  reasoningNotes?: string | null;
}

export interface OutcomeReportInput {
  cellId: string;
  seasonYear: number;
  seasonName: string;
  outcomeSummary: string;
  soilCoverObserved?: string | null;
  waterStressObserved?: string | null;
  pestOrDiseaseNotes?: string | null;
}

interface QueuedSubmission {
  table: 'decision_logs' | 'outcome_reports';
  row: Record<string, unknown>;
}

export interface SubmissionResult {
  status: 'submitted' | 'queued';
  queuedCount: number;
}

const QUEUE_STORAGE_KEY = 'fieldshift.pending.submissions';
let MEMORY_SUBMISSION_QUEUE: QueuedSubmission[] | null = null;

function readQueue(): QueuedSubmission[] {
  if (MEMORY_SUBMISSION_QUEUE !== null) {
    return [...MEMORY_SUBMISSION_QUEUE];
  }
  const storage = getOptionalWebStorage();
  if (storage) {
    try {
      const raw = storage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          MEMORY_SUBMISSION_QUEUE = parsed as QueuedSubmission[];
          return [...MEMORY_SUBMISSION_QUEUE];
        }
      }
    } catch {
      // Ignore corrupt local queue entries
    }
  }
  MEMORY_SUBMISSION_QUEUE = [];
  return [];
}

function writeQueue(items: QueuedSubmission[]): void {
  MEMORY_SUBMISSION_QUEUE = [...items];
  const storage = getOptionalWebStorage();
  if (storage) {
    try {
      storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota / private mode failures
    }
  }
}

async function postSupabaseRow(
  cfg: { url: string; anonKey: string },
  table: QueuedSubmission['table'],
  row: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function submitOrQueue(
  table: QueuedSubmission['table'],
  row: Record<string, unknown>,
): Promise<SubmissionResult> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    const ok = await postSupabaseRow(cfg, table, row);
    if (ok) {
      return { status: 'submitted', queuedCount: readQueue().length };
    }
  }
  const nextQueue = [...readQueue(), { table, row }];
  writeQueue(nextQueue);
  return { status: 'queued', queuedCount: nextQueue.length };
}

export function getQueuedSubmissionCount(): number {
  return readQueue().length;
}

export async function flushQueuedSubmissions(): Promise<{
  flushed: number;
  remaining: number;
}> {
  const cfg = getSupabaseConfig();
  const pending = readQueue();
  if (!cfg || pending.length === 0) {
    return { flushed: 0, remaining: pending.length };
  }
  const stillPending: QueuedSubmission[] = [];
  let flushed = 0;
  for (const item of pending) {
    const ok = await postSupabaseRow(cfg, item.table, item.row);
    if (ok) {
      flushed += 1;
    } else {
      stillPending.push(item);
    }
  }
  writeQueue(stillPending);
  return { flushed, remaining: stillPending.length };
}

/**
 * Submit a farmer strategy selection to Supabase `decision_logs` (RLS: logged_by_role = 'farmer'),
 * or store it in the offline queue when disconnected.
 */
export async function submitDecisionLog(
  input: DecisionLogInput,
): Promise<SubmissionResult> {
  return submitOrQueue('decision_logs', {
    cell_id: input.cellId,
    session_label: input.sessionLabel ?? null,
    logged_by_role: 'farmer',
    existing_rotation: input.existingRotation ?? 'continuous_maize',
    selected_strategy_code: input.selectedStrategyCode,
    farm_area_ha: Number(input.farmAreaHa.toFixed(2)),
    priority_weights: input.priorityWeights,
    computed_base_scores: input.computedBaseScores,
    rank_probabilities: input.rankProbabilities,
    reasoning_notes: input.reasoningNotes ?? null,
  });
}

/**
 * Submit an end-of-season field observation to Supabase `outcome_reports`
 * (RLS: evidence_grade = 'farmer_reported' AND eligible_for_model_update = false).
 */
export async function submitOutcomeReport(
  input: OutcomeReportInput,
): Promise<SubmissionResult> {
  return submitOrQueue('outcome_reports', {
    decision_id: null,
    cell_id: input.cellId,
    season_year: input.seasonYear,
    season_name: input.seasonName,
    outcome_summary: input.outcomeSummary,
    soil_cover_observed: input.soilCoverObserved ?? null,
    water_stress_observed: input.waterStressObserved ?? null,
    pest_or_disease_notes: input.pestOrDiseaseNotes ?? null,
    evidence_grade: 'farmer_reported',
    eligible_for_model_update: false,
  });
}
