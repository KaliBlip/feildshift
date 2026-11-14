import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  ASHANTI_PILOT_CELLS,
  DEFAULT_FARM_AREA_HA,
  PRIORITY_PRESETS,
  type PilotCellSummary,
} from '@/constants/pilot-data';

export type PriorityWeightsTuple = [number, number, number, number];

interface PilotStateValue {
  cells: PilotCellSummary[];
  selectedCell: PilotCellSummary;
  selectCell: (cellId: string) => void;
  farmAreaHa: number;
  setFarmAreaHa: (area: number) => void;
  weights: PriorityWeightsTuple;
  setWeightAt: (index: number, delta: number) => void;
  applyPreset: (weights: PriorityWeightsTuple) => void;
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
