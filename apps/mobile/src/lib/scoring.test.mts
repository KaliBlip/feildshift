import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { authenticateWithPhonePin } from './auth.ts';
import { baseScores, rankProbabilities } from './scoring.ts';
import { buildSmsSummaryCard, estimateNitrogenOffsetSummary } from './sms-export.ts';
import {
  applyClimateStressToStrategies,
  type ClimateStressId,
  computeMinimaxRegretRankings,
} from './stress.ts';
import { classifyRgbaPatch } from './vision-classifier.ts';

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

test('applyClimateStressToStrategies and Minimax Regret match shared stress vector', () => {
  const stressVectorPath = path.resolve(
    currentDir,
    '../../../../shared/test-vectors/stress_test_basic.json',
  );
  const sv = JSON.parse(fs.readFileSync(stressVectorPath, 'utf-8')) as {
    strategies: string[];
    is_baseline: boolean[];
    scores: number[][];
    weights: number[];
    expected_lowest_regret_strategy: string;
    scenarios: Record<
      ClimateStressId,
      {
        expected_stressed_scores: number[][];
        expected_base_scores: number[];
      }
    >;
  };

  const specs = sv.strategies.map((name, idx) => ({
    code: name,
    name,
    sequence: '',
    isBaseline: sv.is_baseline[idx],
    criterionScores: sv.scores[idx] as [number, number, number, number],
    expectedBenefits: [],
    informationGaps: [],
    risksNeedingReview: [],
  }));

  for (const scenarioId of Object.keys(sv.scenarios) as ClimateStressId[]) {
    const expected = sv.scenarios[scenarioId];
    const stressed = applyClimateStressToStrategies(specs, scenarioId);
    for (let i = 0; i < stressed.length; i++) {
      for (let j = 0; j < 4; j++) {
        assert.ok(
          Math.abs(stressed[i][j] - expected.expected_stressed_scores[i][j]) < 2e-4,
          `${scenarioId}[${i}][${j}]: expected ${expected.expected_stressed_scores[i][j]}, got ${stressed[i][j]}`,
        );
      }
    }
    const gotBase = baseScores(stressed, sv.weights);
    for (let i = 0; i < gotBase.length; i++) {
      assert.ok(
        Math.abs(gotBase[i] - expected.expected_base_scores[i]) < 2e-4,
        `${scenarioId} base[${i}]: expected ${expected.expected_base_scores[i]}, got ${gotBase[i]}`,
      );
    }
  }

  const mm = computeMinimaxRegretRankings(specs, sv.weights, baseScores);
  assert.equal(mm.lowestRegretCode, sv.expected_lowest_regret_strategy);
});

test('classifyRgbaPatch distinguishes Intact green canopy, Partial cover, and Bare soil', () => {
  const mkPatch = (r: number, g: number, b: number, n = 16) => {
    const buf = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      buf[i * 4] = r;
      buf[i * 4 + 1] = g;
      buf[i * 4 + 2] = b;
      buf[i * 4 + 3] = 255;
    }
    return buf;
  };

  const intact = classifyRgbaPatch(mkPatch(45, 145, 45), 4, 4);
  assert.equal(intact.soilCover, 'Intact');
  assert.equal(intact.waterStressHint, 'None');
  assert.ok(intact.canopyPct >= 90);

  const bare = classifyRgbaPatch(mkPatch(145, 92, 65), 4, 4);
  assert.equal(bare.soilCover, 'Bare');
  assert.equal(bare.waterStressHint, 'Severe');
  assert.ok(bare.barePct >= 90);

  // 50% green canopy + 50% bare soil -> Partial
  const mixed = new Uint8Array(16 * 4);
  for (let i = 0; i < 16; i++) {
    const isGreen = i < 8;
    mixed[i * 4] = isGreen ? 45 : 145;
    mixed[i * 4 + 1] = isGreen ? 145 : 92;
    mixed[i * 4 + 2] = isGreen ? 45 : 65;
    mixed[i * 4 + 3] = 255;
  }
  const partial = classifyRgbaPatch(mixed, 4, 4);
  assert.equal(partial.soilCover, 'Partial');
});

test('authenticateWithPhonePin resolves challenge phone and 4-digit PIN pairs', () => {
  const f = authenticateWithPhonePin('0512345601', '1111');
  assert.equal(f.ok, true);
  if (f.ok) assert.equal(f.session.role, 'farmer');

  const o = authenticateWithPhonePin('0512345602', '2222');
  assert.equal(o.ok, true);
  if (o.ok) assert.equal(o.session.role, 'extension_officer');

  const a = authenticateWithPhonePin('0512345603', '3333');
  assert.equal(a.ok, true);
  if (a.ok) assert.equal(a.session.role, 'agronomist');

  const bad = authenticateWithPhonePin('0512345601', '9999');
  assert.equal(bad.ok, false);
});
