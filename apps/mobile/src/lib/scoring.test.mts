import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { baseScores, rankProbabilities } from './scoring.ts';
import { buildSmsSummaryCard, estimateNitrogenOffsetSummary } from './sms-export.ts';
import { computeMinimaxRegretRankings } from './stress.ts';

interface ScoringVector {
  strategies: string[];
  criteria: string[];
  scores: number[][];
  weights: number[];
  expected_base_scores: number[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const vectorPath = path.resolve(
  currentDir,
  '../../../../shared/test-vectors/scoring_basic.json',
);
const vector: ScoringVector = JSON.parse(fs.readFileSync(vectorPath, 'utf-8'));

test('baseScores matches shared test vector within 1e-9', () => {
  const got = baseScores(vector.scores, vector.weights);
  assert.equal(got.length, vector.expected_base_scores.length);
  for (let i = 0; i < got.length; i++) {
    assert.ok(
      Math.abs(got[i] - vector.expected_base_scores[i]) < 1e-9,
      `strategy ${i}: expected ${vector.expected_base_scores[i]}, got ${got[i]}`,
    );
  }
});

test('rankProbabilities probabilities sum to 1 and match strategy ordering', () => {
  const out = rankProbabilities(vector.scores, vector.weights, {
    runs: 2000,
    seed: 42,
  });
  assert.equal(out.probabilityFirst.length, vector.strategies.length);
  assert.equal(out.meanRank.length, vector.strategies.length);

  const probSum = out.probabilityFirst.reduce((acc, p) => acc + p, 0);
  assert.ok(
    Math.abs(probSum - 1.0) < 1e-9,
    `expected probabilityFirst sum ~1.0, got ${probSum}`,
  );

  // Strategy B (0.675) and Strategy A (0.65) outscore Existing rotation (0.47).
  assert.ok(out.probabilityFirst[1] > out.probabilityFirst[0]);
  assert.ok(out.probabilityFirst[2] > out.probabilityFirst[0]);
  assert.ok(out.meanRank[2] < out.meanRank[0]);
});

test('computeMinimaxRegretRankings identifies robust lowest-regret strategy', () => {
  const sampleStrategies = [
    {
      code: 'continuous_maize',
      name: 'Continuous Maize',
      sequence: 'Maize -> Maize',
      isBaseline: true,
      criterionScores: [0.46, 0.42, 0.38, 0.56] as [number, number, number, number],
      expectedBenefits: [],
      informationGaps: [],
      risksNeedingReview: [],
    },
    {
      code: 'maize_cowpea_relay',
      name: 'Maize-Cowpea Relay',
      sequence: 'Maize -> Cowpea',
      isBaseline: false,
      criterionScores: [0.76, 0.78, 0.81, 0.72] as [number, number, number, number],
      expectedBenefits: [],
      informationGaps: [],
      risksNeedingReview: [],
    },
  ];
  const mm = computeMinimaxRegretRankings(sampleStrategies, [0.35, 0.25, 0.2, 0.2], baseScores);
  assert.equal(mm.lowestRegretCode, 'maize_cowpea_relay');
  assert.equal(mm.rowsByCode.maize_cowpea_relay.maxRegret, 0);
  assert.ok(mm.rowsByCode.continuous_maize.maxRegret > 0.2);

  const offset = estimateNitrogenOffsetSummary(sampleStrategies[1]);
  assert.ok(offset.ureaBagsSavedPerHa > 1.5);
  assert.ok(offset.bareDaysAvoided >= 30);

  const sms = buildSmsSummaryCard({
    cellId: 'ASH_R05_C05',
    strategy: sampleStrategies[1],
    baseScorePct: 77,
    winProbPct: 84,
    scenarioLabel: 'Baseline',
  });
  assert.ok(sms.length <= 320, `SMS card exceeded 320 chars: ${sms.length}`);
  assert.ok(sms.includes('ASH_R05_C05'));
  assert.ok(sms.includes('Twi:'));
  assert.ok(sms.includes('urea'));
});
