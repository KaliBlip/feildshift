import assert from "node:assert/strict";
import test from "node:test";
import { createDecisionFixtures } from "./decision-data.ts";

test("decision fixtures include the baseline and three strategies with stable rank probabilities", () => {
  const data = createDecisionFixtures();

  assert.equal(data.source, "fixtures");
  assert.deepEqual(
    data.strategies.map((strategy) => strategy.code),
    ["baseline", "strategy_a", "strategy_b", "strategy_c"],
  );
  assert.equal(data.strategies.filter((strategy) => strategy.isBaseline).length, 1);
  assert.ok(data.strategies.every((strategy) => strategy.passport !== null));
  assert.ok(data.strategies.every((strategy) => strategy.criteria.length === 4));
  assert.ok(data.strategies.every((strategy) => strategy.baseScore >= 0 && strategy.baseScore <= 1));

  const firstPlaceProbability = data.strategies.reduce(
    (sum, strategy) => sum + strategy.probabilityFirst,
    0,
  );
  assert.ok(Math.abs(firstPlaceProbability - 1) < 1e-9);
});
