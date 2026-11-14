import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

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
  readCachedPilotPayload,
} from '@/lib/supabase';

export type PriorityWeightsTuple = [number, number, number, number];
export type PilotDataSourceMode = 'fixture' | 'supabase' | 'cached';

interface PilotStateValue {
  cells: PilotCellSummary[];
  selectedCell: PilotCellSummary;
  selectCell: (cellId: string) => void;
  farmAreaHa: number;
  setFarmAreaHa: (area: number) => void;
  weights: PriorityWeightsTuple;
  setWeightAt: (index: number, delta: number) => void;
  applyPreset: (weights: PriorityWeightsTuple) => void;
  strategies: RotationStrategySpec[];
  passports: EvidencePassportEntry[];
  dataSourceMode: PilotDataSourceMode;
  lastSyncedAt: string | null;
  refreshLivePilotData: () => Promise<void>;
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

  const applyHydratedOrCached = useCallback((cellId: string, live: Awaited<ReturnType<typeof fetchLivePilotStrategies>>) => {
    if (live && live.strategies.length > 0) {
      setStrategies(live.strategies);
      if (live.passports.length > 0) {
        setPassports(live.passports);
      }
      setDataSourceMode('supabase');
      setLastSyncedAt(live.syncedAt ?? null);
      return;
    }

    const cached = readCachedPilotPayload(cellId);
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
  }, []);

  const refreshLivePilotData = useCallback(async () => {
    const live = await fetchLivePilotStrategies(selectedCellId);
    applyHydratedOrCached(selectedCellId, live);
  }, [applyHydratedOrCached, selectedCellId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const live = await fetchLivePilotStrategies(selectedCellId);
      if (!active) {
        return;
      }
      applyHydratedOrCached(selectedCellId, live);
    })();
    return () => {
      active = false;
    };
  }, [applyHydratedOrCached, selectedCellId]);

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
        applyPreset,
        strategies,
        passports,
        dataSourceMode,
        lastSyncedAt,
        refreshLivePilotData,
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
