/**
 * Transparent multi-criteria scoring with Monte Carlo rank probabilities.
 * Mirrors apps/api/scoring.py so TypeScript and Python produce identical base scores.
 */

export interface RankProbabilityOptions {
  scoreUncertainty?: number;
  weightUncertainty?: number;
  runs?: number;
  seed?: number;
}

export interface RankProbabilityResult {
  probabilityFirst: number[];
  meanRank: number[];
}

function validateInputs(scores: number[][], weights: number[]): void {
  if (scores.length === 0) {
    throw new Error("scores must contain at least one strategy");
  }
  const nCriteria = weights.length;
  if (nCriteria === 0) {
    throw new Error("weights must contain at least one criterion");
  }
  for (let i = 0; i < scores.length; i++) {
    if (scores[i].length !== nCriteria) {
      throw new Error("scores must have dimensions strategies x criteria");
    }
  }
  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  if (weightSum <= 0) {
    throw new Error("weights must sum to a positive value");
  }
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createNormalSampler(seed: number): () => number {
  const uniform = createMulberry32(seed);
  let spare: number | null = null;

  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    // Keep u1 strictly positive to prevent Math.log(0) -> -Infinity.
    const u1 = Math.max(1 - uniform(), Number.MIN_VALUE);
    const u2 = uniform();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    spare = radius * Math.sin(angle);
    return radius * Math.cos(angle);
  };
}

/**
 * Weighted sum per strategy.
 * @param scores Matrix of shape (strategies, criteria) in [0, 1].
 * @param weights One non-negative weight per criterion (normalised internally).
 */
export function baseScores(scores: number[][], weights: number[]): number[] {
  validateInputs(scores, weights);
  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const normalizedWeights = weights.map((w) => w / weightSum);

  return scores.map((row) =>
    row.reduce((sum, score, idx) => sum + score * normalizedWeights[idx], 0),
  );
}

/**
 * Perturb weights and criterion scores using Monte Carlo sampling,
 * then report how often each strategy ranks first and its 1-indexed mean rank.
 */
export function rankProbabilities(
  scores: number[][],
  weights: number[],
  options: RankProbabilityOptions = {},
): RankProbabilityResult {
  validateInputs(scores, weights);
  const {
    scoreUncertainty = 0.1,
    weightUncertainty = 0.1,
    runs = 2000,
    seed = 42,
  } = options;

  if (runs < 1) {
    throw new Error("runs must be at least 1");
  }

  const nStrategies = scores.length;
  const nCriteria = weights.length;
  const nextNormal = createNormalSampler(seed);

  const firstCounts = new Array<number>(nStrategies).fill(0);
  const rankSums = new Array<number>(nStrategies).fill(0);
  const perturbedWeights = new Array<number>(nCriteria);
  const totals = new Array<number>(nStrategies);
  const order = Array.from({ length: nStrategies }, (_, i) => i);

  for (let r = 0; r < runs; r++) {
    let wSum = 0;
    for (let c = 0; c < nCriteria; c++) {
      const w = Math.max(
        0,
        weights[c] * (1 + weightUncertainty * nextNormal()),
      );
      perturbedWeights[c] = w;
      wSum += w;
    }
    const normFactor = wSum === 0 ? 1 : wSum;
    for (let c = 0; c < nCriteria; c++) {
      perturbedWeights[c] /= normFactor;
    }

    for (let s = 0; s < nStrategies; s++) {
      let total = 0;
      for (let c = 0; c < nCriteria; c++) {
        const perturbedScore = Math.min(
          1,
          Math.max(0, scores[s][c] + scoreUncertainty * nextNormal()),
        );
        total += perturbedScore * perturbedWeights[c];
      }
      totals[s] = total;
      order[s] = s;
    }

    order.sort((a, b) => totals[b] - totals[a] || a - b);

    firstCounts[order[0]] += 1;
    for (let rankIdx = 0; rankIdx < nStrategies; rankIdx++) {
      rankSums[order[rankIdx]] += rankIdx + 1;
    }
  }

  return {
    probabilityFirst: firstCounts.map((count) => count / runs),
    meanRank: rankSums.map((sum) => sum / runs),
  };
}
