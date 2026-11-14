/**
 * Phase 4 client-side climate stress perturbation curves matching apps/api/index.py.
 */
import type { RotationStrategySpec } from '@/constants/pilot-data';

export type ClimateStressId =
  | 'baseline'
  | 'moderate_drought'
  | 'severe_heat_drought'
  | 'intense_rainfall';

export interface ClimateStressScenario {
  id: ClimateStressId;
  shortLabel: string;
  label: string;
  rainFactor: number;
  tempDeltaC: number;
  drySpellDeltaDays: number;
}

export const CLIMATE_STRESS_SCENARIOS: ClimateStressScenario[] = [
  {
    id: 'baseline',
    shortLabel: 'Baseline',
    label: '2022–2025 median Ashanti regime',
    rainFactor: 1.0,
    tempDeltaC: 0.0,
    drySpellDeltaDays: 0,
  },
  {
    id: 'moderate_drought',
    shortLabel: 'Dry −20%',
    label: 'Late onset / dry minor season (−20% rain, +4 dry days)',
    rainFactor: 0.8,
    tempDeltaC: 1.0,
    drySpellDeltaDays: 4,
  },
  {
    id: 'severe_heat_drought',
    shortLabel: 'Heat +2°C',
    label: 'El Niño heat-drought analog (−30% rain, +2.0°C)',
    rainFactor: 0.7,
    tempDeltaC: 2.0,
    drySpellDeltaDays: 7,
  },
  {
    id: 'intense_rainfall',
    shortLabel: 'Squall +20%',
    label: 'Intense rainfall / erosion year (+20% rain)',
    rainFactor: 1.2,
    tempDeltaC: 0.5,
    drySpellDeltaDays: 0,
  },
];

function clipUnit(value: number): number {
  return Math.max(0.02, Math.min(0.98, Number(value.toFixed(4))));
}

/**
 * Perturb [water, soil, erosion, income] scores for a strategy under a Phase 4 stress preset.
 * Strategies with higher baseline resilience lose slightly less under drought/squall stress
 * than bare continuous cropping.
 */
export function applyClimateStressToStrategies(
  strategies: RotationStrategySpec[],
  scenarioId: ClimateStressId,
): number[][] {
  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((item) => item.id === scenarioId) ??
    CLIMATE_STRESS_SCENARIOS[0];

  if (scenario.id === 'baseline') {
    return strategies.map((s) => [...s.criterionScores]);
  }

  const rainDeficit = Math.max(0, 1 - scenario.rainFactor);
  const rainExcess = Math.max(0, scenario.rainFactor - 1);
  const heatFactor = scenario.tempDeltaC / 2.0;

  return strategies.map((strategy) => {
    const [water, soil, erosion, income] = strategy.criterionScores;
    const baselinePenalty = strategy.isBaseline ? 1.35 : 0.8;

    const stressedWater = clipUnit(
      water - (0.28 * rainDeficit + 0.04 * heatFactor) * baselinePenalty,
    );
    const stressedSoil = clipUnit(
      soil - 0.08 * (rainDeficit + rainExcess) * baselinePenalty,
    );
    const stressedErosion = clipUnit(
      erosion - 0.35 * rainExcess * (1.2 - erosion * 0.5),
    );
    const stressedIncome = clipUnit(
      income - (0.22 * rainDeficit + 0.06 * heatFactor + 0.1 * rainExcess) * baselinePenalty,
    );

    return [stressedWater, stressedSoil, stressedErosion, stressedIncome];
  });
}

export interface MinimaxRegretRow {
  code: string;
  worstCaseScore: number;
  maxRegret: number;
}

export interface MinimaxRegretSummary {
  lowestRegretCode: string;
  rowsByCode: Record<string, MinimaxRegretRow>;
}

/**
 * Minimax climate regret across all stress presets: picks the strategy with
 * the smallest worst-case gap to the best possible choice in any weather scenario.
 */
export function computeMinimaxRegretRankings(
  strategies: RotationStrategySpec[],
  weights: number[],
  scoreFn: (scores: number[][], weights: number[]) => number[],
): MinimaxRegretSummary {
  if (strategies.length === 0) {
    return { lowestRegretCode: '', rowsByCode: {} };
  }

  const scenarioMatrices = CLIMATE_STRESS_SCENARIOS.map((scenario) =>
    scoreFn(applyClimateStressToStrategies(strategies, scenario.id), weights),
  );
  const scenarioBest = scenarioMatrices.map((scores) => Math.max(...scores));

  let lowestRegretCode = strategies[0].code;
  let smallestMaxRegret = Number.POSITIVE_INFINITY;
  let bestTieWorstCase = Number.NEGATIVE_INFINITY;
  const rowsByCode: Record<string, MinimaxRegretRow> = {};

  for (let i = 0; i < strategies.length; i++) {
    const code = strategies[i].code;
    let worstCase = Number.POSITIVE_INFINITY;
    let maxRegret = 0;

    for (let s = 0; s < scenarioMatrices.length; s++) {
      const score = scenarioMatrices[s][i];
      const regret = Math.max(0, scenarioBest[s] - score);
      if (score < worstCase) {
        worstCase = score;
      }
      if (regret > maxRegret) {
        maxRegret = regret;
      }
    }

    const row: MinimaxRegretRow = {
      code,
      worstCaseScore: Number(worstCase.toFixed(4)),
      maxRegret: Number(maxRegret.toFixed(4)),
    };
    rowsByCode[code] = row;

    if (
      row.maxRegret < smallestMaxRegret ||
      (row.maxRegret === smallestMaxRegret && row.worstCaseScore > bestTieWorstCase)
    ) {
      smallestMaxRegret = row.maxRegret;
      bestTieWorstCase = row.worstCaseScore;
      lowestRegretCode = code;
    }
  }

  return { lowestRegretCode, rowsByCode };
}
