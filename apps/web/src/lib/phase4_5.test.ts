import assert from "node:assert/strict";
import test from "node:test";

import { ROTATION_STRATEGIES } from "../constants/ashanti-pilot.ts";
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
  const sampleReports = [
    {
      outcome_id: "out-test-1",
      decision_id: "dec-test-1",
      cell_id: "ASH_R05_C05",
      season_year: 2025,
      season_name: "Minor" as const,
      outcome_summary: "Unverified farmer report",
      soil_cover_observed: "Good",
      water_stress_observed: "Low",
      pest_or_disease_notes: "None",
      evidence_grade: "farmer_reported" as const,
      graded_by_officer_id: null,
      eligible_for_model_update: false,
      created_at: "2025-11-13T09:15:00Z",
      reviewed_at: null,
      synced: true,
    },
    {
      outcome_id: "out-test-2",
      decision_id: "dec-test-2",
      cell_id: "ASH_R04_C04",
      season_year: 2025,
      season_name: "Major" as const,
      outcome_summary: "Officer-reviewed Mucuna mulch observation",
      soil_cover_observed: "Dense surface residue maintained into Jan",
      water_stress_observed: "None observed on plot",
      pest_or_disease_notes: "Cleared 3 m perimeter firebreak",
      evidence_grade: "officer_reviewed" as const,
      graded_by_officer_id: "00000000-0000-0000-0000-000000000101",
      eligible_for_model_update: true,
      created_at: "2025-11-11T16:40:00Z",
      reviewed_at: "2025-11-12T08:30:00Z",
      synced: true,
    },
  ];
  const out = computeM8CalibrationPreview(sampleReports);
  assert.equal(out.verifiedReportsApplied, 1);
  assert.equal(out.ignoredUnverifiedReports, 1);
  const stratB = out.strategies.find((s) => s.code === "strategy_b");
  assert.ok(stratB && stratB.posteriorSigmaMean < stratB.priorSigmaMean);
});
