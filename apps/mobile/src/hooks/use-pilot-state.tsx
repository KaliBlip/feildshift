import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import * as Network from 'expo-network';

import {
  ASHANTI_PILOT_CELLS,
  DEFAULT_FARM_AREA_HA,
  EVIDENCE_PASSPORTS,
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
  type EvidencePassportEntry,
  type PilotCellSummary,
  type RotationStrategySpec,
} from '@/constants/pilot-data';
import {
  fetchLivePilotStrategies,
  flushQueuedSubmissions,
  getQueuedSubmissionCount,
  hydrateCachedPilotPayloadAsync,
  hydrateQueueFromAsyncStorage,
  readCachedPilotPayload,
  submitDecisionLog,
  submitOutcomeReport,
  type OutcomeReportInput,
  type SubmissionResult,
} from '@/lib/supabase';

export type PriorityWeightsTuple = [number, number, number, number];
export type PilotDataSourceMode = 'fixture' | 'supabase' | 'cached';

export interface FarmerDecisionRequest {
  selectedStrategyCode: string;
  computedBaseScores: Record<string, number>;
  rankProbabilities: Record<string, number>;
  reasoningNotes?: string;
}

interface PilotStateValue {
  cells: PilotCellSummary[];
  selectedCell: PilotCellSummary;
  selectCell: (cellId: string) => void;
  farmAreaHa: number;
  setFarmAreaHa: (area: number) => void;
  weights: PriorityWeightsTuple;
  setWeightAt: (index: number, delta: number) => void;
  setExactWeightAt: (index: number, value: number) => void;
  applyPreset: (weights: PriorityWeightsTuple) => void;
  strategies: RotationStrategySpec[];
  passports: EvidencePassportEntry[];
  dataSourceMode: PilotDataSourceMode;
  lastSyncedAt: string | null;
  queuedLogsCount: number;
  isConnected: boolean;
  isSyncing: boolean;
  refreshLivePilotData: () => Promise<void>;
  logFarmerDecision: (request: FarmerDecisionRequest) => Promise<SubmissionResult>;
  logFieldOutcome: (
    request: Omit<OutcomeReportInput, 'cellId'>,
  ) => Promise<SubmissionResult>;
}

const PilotStateContext = createContext<PilotStateValue | null>(null);

export function PilotStateProvider({ children }: { children: ReactNode }) {
  const [selectedCellId, setSelectedCellId] = useState<string>(
    ASHANTI_PILOT_CELLS[0].cellId,
  );
  const [farmAreaHa, setFarmAreaHaState] = useState<number>(DEFAULT_FARM_AREA_HA);
  const [weights, setWeights] = useState<PriorityWeightsTuple>(
    PRIORITY_PRESETS[0].weights,
  );
  const [strategies, setStrategies] =
    useState<RotationStrategySpec[]>(ROTATION_STRATEGIES);
  const [passports, setPassports] =
    useState<EvidencePassportEntry[]>(EVIDENCE_PASSPORTS);
  const [dataSourceMode, setDataSourceMode] =
    useState<PilotDataSourceMode>('fixture');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [queuedLogsCount, setQueuedLogsCount] = useState<number>(() =>
    getQueuedSubmissionCount(),
  );
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const applyHydratedOrCached = useCallback(
    async (
      cellId: string,
      live: Awaited<ReturnType<typeof fetchLivePilotStrategies>>,
    ) => {
      if (live && live.strategies.length > 0) {
        setStrategies(live.strategies);
        if (live.passports.length > 0) {
          setPassports(live.passports);
        }
        setDataSourceMode('supabase');
        setLastSyncedAt(live.syncedAt ?? null);
        return;
      }

      const cached =
        readCachedPilotPayload(cellId) ??
        (await hydrateCachedPilotPayloadAsync(cellId));
      if (cached && cached.strategies.length > 0) {
        setStrategies(cached.strategies);
        if (cached.passports.length > 0) {
          setPassports(cached.passports);
        }
        setDataSourceMode('cached');
        setLastSyncedAt(cached.syncedAt ?? null);
        return;
      }

      setStrategies(ROTATION_STRATEGIES);
      setPassports(EVIDENCE_PASSPORTS);
      setDataSourceMode('fixture');
      setLastSyncedAt(null);
    },
    [],
  );

  const refreshLivePilotData = useCallback(async () => {
    setIsSyncing(true);
    try {
      await hydrateQueueFromAsyncStorage();
      const [live, flushResult] = await Promise.all([
        fetchLivePilotStrategies(selectedCellId),
        flushQueuedSubmissions(),
      ]);
      await applyHydratedOrCached(selectedCellId, live);
      setQueuedLogsCount(flushResult.remaining);
    } finally {
      setIsSyncing(false);
    }
  }, [applyHydratedOrCached, selectedCellId]);

  useEffect(() => {
    let active = true;
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && typeof state.isConnected === 'boolean') {
          setIsConnected(state.isConnected);
        }
      })
      .catch(() => undefined);

    const sub = Network.addNetworkStateListener((state) => {
      const online = Boolean(state.isConnected);
      setIsConnected(online);
      if (online) {
        void flushQueuedSubmissions().then((res) =>
          setQueuedLogsCount(res.remaining),
        );
      }
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsSyncing(true);
    void (async () => {
      await hydrateQueueFromAsyncStorage();
      const [live, flushResult] = await Promise.all([
        fetchLivePilotStrategies(selectedCellId),
        flushQueuedSubmissions(),
      ]);
      if (!active) {
        return;
      }
      await applyHydratedOrCached(selectedCellId, live);
      setQueuedLogsCount(flushResult.remaining);
      setIsSyncing(false);
    })();
    return () => {
      active = false;
    };
  }, [applyHydratedOrCached, selectedCellId]);

  const logFarmerDecision = useCallback(
    async (request: FarmerDecisionRequest): Promise<SubmissionResult> => {
      const result = await submitDecisionLog({
        cellId: selectedCellId,
        selectedStrategyCode: request.selectedStrategyCode,
        farmAreaHa,
        priorityWeights: [...weights],
        computedBaseScores: request.computedBaseScores,
        rankProbabilities: request.rankProbabilities,
        reasoningNotes: request.reasoningNotes ?? null,
      });
      setQueuedLogsCount(result.queuedCount);
      return result;
    },
    [farmAreaHa, selectedCellId, weights],
  );

  const logFieldOutcome = useCallback(
    async (
      request: Omit<OutcomeReportInput, 'cellId'>,
    ): Promise<SubmissionResult> => {
      const result = await submitOutcomeReport({
        cellId: selectedCellId,
        ...request,
      });
      setQueuedLogsCount(result.queuedCount);
      return result;
    },
    [selectedCellId],
  );

  const selectedCell =
    ASHANTI_PILOT_CELLS.find((cell) => cell.cellId === selectedCellId) ??
    ASHANTI_PILOT_CELLS[0];

  const setFarmAreaHa = (area: number) => {
    const clamped = Math.min(50, Math.max(0.5, Number(area.toFixed(1))));
    setFarmAreaHaState(clamped);
  };

  const setWeightAt = (index: number, delta: number) => {
    setWeights((prev) => {
      const next: PriorityWeightsTuple = [...prev] as PriorityWeightsTuple;
      next[index] = Math.min(1, Math.max(0.05, Number((next[index] + delta).toFixed(2))));
      return next;
    });
  };

  const setExactWeightAt = (index: number, value: number) => {
    setWeights((prev) => {
      const next: PriorityWeightsTuple = [...prev] as PriorityWeightsTuple;
      next[index] = Math.min(1, Math.max(0.05, Number(value.toFixed(2))));
      return next;
    });
  };

  const applyPreset = (presetWeights: PriorityWeightsTuple) => {
    setWeights([...presetWeights] as PriorityWeightsTuple);
  };

  return (
    <PilotStateContext.Provider
      value={{
        cells: ASHANTI_PILOT_CELLS,
        selectedCell,
        selectCell: setSelectedCellId,
        farmAreaHa,
        setFarmAreaHa,
        weights,
        setWeightAt,
        setExactWeightAt,
        applyPreset,
        strategies,
        passports,
        dataSourceMode,
        lastSyncedAt,
        queuedLogsCount,
        isConnected,
        isSyncing,
        refreshLivePilotData,
        logFarmerDecision,
        logFieldOutcome,
      }}>
      {children}
    </PilotStateContext.Provider>
  );
}

export function usePilotState(): PilotStateValue {
  const ctx = useContext(PilotStateContext);
  if (!ctx) {
    throw new Error('usePilotState must be used inside PilotStateProvider');
  }
  return ctx;
}
