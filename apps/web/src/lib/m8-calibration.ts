import { ROTATION_STRATEGIES } from "../constants/ashanti-pilot.ts";
import { baseScores, rankProbabilities } from "./scoring.ts";
import type { EvidenceGrade, OutcomeReportRecord } from "../types/database.ts";

const VERIFIED_GRADES: ReadonlySet<EvidenceGrade> = new Set([
  "officer_reviewed",
  "expert_validated",
]);

function outcomeToObservations(report: OutcomeReportRecord): {
  obsValues: [number, number, number, number];
  obsSigma: number;
} {
  const obsSigma = report.evidence_grade === "expert_validated" ? 0.08 : 0.12;
  const summary = report.outcome_summary.toLowerCase();
  const waterObs = (report.water_stress_observed ?? "").toLowerCase();
  const soilObs = (report.soil_cover_observed ?? "").toLowerCase();

  const waterScore = ["none", "low", "adequate", "optimal"].some((k) => waterObs.includes(k))
    ? 0.78
    : ["severe", "high", "drought", "wilt"].some((k) => waterObs.includes(k))
      ? 0.4
      : 0.62;

  const soilScore = ["dense", "good", "mulch", "full"].some((k) => soilObs.includes(k))
    ? 0.8
    : ["bare", "poor", "eroded"].some((k) => soilObs.includes(k))
      ? 0.42
      : 0.65;

  const erosionScore =
    summary.includes("no erosion") || soilObs.includes("good")
      ? 0.8
      : summary.includes("erosion") || summary.includes("gully")
        ? 0.42
        : 0.65;

  const incomeScore = ["above", "strong", "good yield", "profit"].some((k) =>
    summary.includes(k),
  )
    ? 0.78
    : ["loss", "poor", "failed", "low yield"].some((k) => summary.includes(k))
      ? 0.45
      : 0.62;

  return {
    obsValues: [waterScore, soilScore, erosionScore, incomeScore],
    obsSigma,
  };
}

export interface CalibratedStrategyPreview {
  code: string;
  name: string;
  priorBaseScore: number;
  posteriorBaseScore: number;
  priorSigmaMean: number;
  posteriorSigmaMean: number;
  winProbPct: number;
  updatesApplied: number;
}

export interface M8CalibrationSummary {
  verifiedReportsApplied: number;
  ignoredUnverifiedReports: number;
  strategies: CalibratedStrategyPreview[];
}

function clip(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normal-conjugate Bayesian calibration matching pipeline/src/fieldshift/models/feedback.py.
 * Strictly ignores unverified (`farmer_reported`) or `confounded_excluded` reports.
 */
export function computeM8CalibrationPreview(
  outcomeReports: OutcomeReportRecord[],
  weights: [number, number, number, number] = [0.4, 0.3, 0.2, 0.1],
): M8CalibrationSummary {
  const working = ROTATION_STRATEGIES.map((s) => ({
    code: s.code,
    name: s.name,
    means: [...s.criterionScores] as [number, number, number, number],
    sigmas: [0.1, 0.1, 0.1, 0.1] as [number, number, number, number],
    updates: 0,
  }));

  const priorScores = baseScores(
    ROTATION_STRATEGIES.map((s) => [...s.criterionScores]),
    weights,
  );

  let verifiedReportsApplied = 0;
  let ignoredUnverifiedReports = 0;

  for (const report of outcomeReports) {
    if (!report.eligible_for_model_update || !VERIFIED_GRADES.has(report.evidence_grade)) {
      ignoredUnverifiedReports++;
      continue;
    }

    // Match report target strategy when mentioned in summary or default to strategy_a/b
    const hay = `${report.outcome_summary} ${report.soil_cover_observed ?? ""}`.toLowerCase();
    const targetCode = hay.includes("mucuna")
      ? "strategy_b"
      : hay.includes("groundnut")
        ? "strategy_c"
        : "strategy_a";

    const target = working.find((item) => item.code === targetCode);
    if (!target) {
      ignoredUnverifiedReports++;
      continue;
    }

    const { obsValues, obsSigma } = outcomeToObservations(report);
    const obsVar = obsSigma ** 2;

    for (let i = 0; i < 4; i++) {
      const priorVar = Math.max(1e-4, target.sigmas[i] ** 2);
      const postVar = 1 / (1 / priorVar + 1 / obsVar);
      const postMean = postVar * (target.means[i] / priorVar + obsValues[i] / obsVar);
      target.means[i] = Number(clip(postMean, 0.02, 0.98).toFixed(4));
      target.sigmas[i] = Number(clip(Math.sqrt(postVar), 0.04, 0.25).toFixed(4));
    }

    target.updates++;
    verifiedReportsApplied++;
  }

  const postMatrix = working.map((item) => [...item.means]);
  const postScores = baseScores(postMatrix, weights);
  const mc = rankProbabilities(postMatrix, weights, { runs: 1000, seed: 42 });

  const strategies: CalibratedStrategyPreview[] = working
    .map((item, idx) => ({
      code: item.code,
      name: item.name,
      priorBaseScore: Number(priorScores[idx].toFixed(3)),
      posteriorBaseScore: Number(postScores[idx].toFixed(3)),
      priorSigmaMean: 0.1,
      posteriorSigmaMean: Number(
        (item.sigmas.reduce((a, b) => a + b, 0) / item.sigmas.length).toFixed(3),
      ),
      winProbPct: Math.round(mc.probabilityFirst[idx] * 100),
      updatesApplied: item.updates,
    }))
    .sort((a, b) => b.posteriorBaseScore - a.posteriorBaseScore);

  return {
    verifiedReportsApplied,
    ignoredUnverifiedReports,
    strategies,
  };
}
