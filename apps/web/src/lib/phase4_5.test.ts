import assert from "node:assert/strict";
import test from "node:test";

import { INITIAL_OUTCOME_REPORTS, ROTATION_STRATEGIES } from "../constants/ashanti-pilot.ts";
import {
  buildWhatsAppReplyForInbound,
  evaluateAfricasTalkingUssdText,
  normalizeGhanaPhone,
} from "./comms.ts";
import { computeM8CalibrationPreview } from "./m8-calibration.ts";
import { baseScores } from "./scoring.ts";
import { buildSmsSummaryCard, estimateNitrogenOffsetSummary } from "./sms-export.ts";
import { applyClimateParamsToStrategies, computeMinimaxRegretRankings } from "./stress.ts";

test("computeMinimaxRegretRankings picks non-baseline resilient strategy", () => {
  const out = computeMinimaxRegretRankings(
    ROTATION_STRATEGIES,
    [0.4, 0.3, 0.2, 0.1],
    baseScores,
  );
  assert.ok(out.lowestRegretCode);
  assert.notEqual(out.lowestRegretCode, "baseline");
  assert.ok(out.rowsByCode.baseline.maxRegret > out.rowsByCode[out.lowestRegretCode].maxRegret);
});

test("applyClimateParamsToStrategies penalizes drought stress", () => {
  const baseline = applyClimateParamsToStrategies(ROTATION_STRATEGIES, 1.0, 0.0);
  const elNino = applyClimateParamsToStrategies(ROTATION_STRATEGIES, 0.7, 2.0);
  assert.ok(elNino[0][0] < baseline[0][0]);
  assert.ok(elNino[0][3] < baseline[0][3]);
});

test("buildSmsSummaryCard produces bilingual <320 char summary with urea savings", () => {
  const cowpea = ROTATION_STRATEGIES[1];
  const offset = estimateNitrogenOffsetSummary(cowpea);
  assert.ok(offset.ureaBagsSavedPerHa > 0);
  assert.ok(offset.bareDaysAvoided > 0);
  const msg = buildSmsSummaryCard({
    cellId: "ASH_R05_C05",
    strategy: cowpea,
    baseScorePct: 73,
    winProbPct: 44,
    scenarioLabel: "Baseline",
  });
  assert.ok(msg.length <= 319);
  assert.ok(msg.includes("ASH_R05_C05"));
  assert.ok(msg.includes("Twi:"));
});

test("evaluateAfricasTalkingUssdText walks CON -> END in EN and Twi", () => {
  const root = evaluateAfricasTalkingUssdText("");
  assert.equal(root.terminal, false);
  assert.ok(root.reply.startsWith("CON "));

  const twiCell = evaluateAfricasTalkingUssdText("2");
  assert.equal(twiCell.terminal, false);
  assert.equal(twiCell.lang, "tw");
  assert.ok(twiCell.reply.includes("ASH_R05_C05"));

  const finalRes = evaluateAfricasTalkingUssdText("2*1*2");
  assert.equal(finalRes.terminal, true);
  assert.equal(finalRes.lang, "tw");
  assert.equal(finalRes.cellId, "ASH_R05_C05");
  assert.ok(finalRes.reply.startsWith("END "));

  // Back button "0" pops step cleanly
  const backed = evaluateAfricasTalkingUssdText("1*1*0");
  assert.equal(backed.terminal, false);
  assert.ok(backed.reply.includes("Select Ashanti Cell"));
});

test("normalizeGhanaPhone normalizes 024 and +233 formats cleanly", () => {
  assert.equal(normalizeGhanaPhone("0241234567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("233241234567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("+233 24-123-4567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("invalid"), null);
});

test("buildWhatsAppReplyForInbound parses cell & priority keywords", () => {
  const reply = buildWhatsAppReplyForInbound("SOIL ASH_R04_C04");
  assert.ok(reply.includes("ASH_R04_C04"));
  assert.ok(reply.includes("Mucuna"));
});

test("computeM8CalibrationPreview applies only eligible officer/expert reports", () => {
  const out = computeM8CalibrationPreview(INITIAL_OUTCOME_REPORTS);
  assert.equal(out.verifiedReportsApplied, 1);
  assert.equal(out.ignoredUnverifiedReports, 1);
  const stratB = out.strategies.find((s) => s.code === "strategy_b");
  assert.ok(stratB && stratB.posteriorSigmaMean < stratB.priorSigmaMean);
});
