import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { baseScores, rankProbabilities } from "./scoring.ts";

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
  "../../../../shared/test-vectors/scoring_basic.json",
);
const vector: ScoringVector = JSON.parse(fs.readFileSync(vectorPath, "utf-8"));

test("baseScores matches shared test vector within 1e-9", () => {
  const got = baseScores(vector.scores, vector.weights);
  assert.equal(got.length, vector.expected_base_scores.length);
  for (let i = 0; i < got.length; i++) {
    assert.ok(
      Math.abs(got[i] - vector.expected_base_scores[i]) < 1e-9,
      `strategy ${i}: expected ${vector.expected_base_scores[i]}, got ${got[i]}`,
    );
  }
});

test("rankProbabilities probabilities sum to 1 and match strategy ordering", () => {
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
