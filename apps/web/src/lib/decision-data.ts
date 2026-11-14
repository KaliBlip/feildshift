import { baseScores, rankProbabilities } from "./scoring.ts";

export type DecisionSource = "supabase" | "fixtures";

export interface EvidencePassportData {
  evidenceTier: string;
  observationSummary: string;
  datasets: string[];
  coverage: unknown;
  method: string;
  keyFinding: string;
  uncertainty: string;
  scaleHonestyNote: string;
  gaps: string[];
  requiredLocalReview: string[];
  validatorRoles: string[];
}

export interface StrategyComparison {
  code: string;
  name: string;
  sequence: string;
  isBaseline: boolean;
  criteria: Array<{ key: string; label: string; score: number }>;
  baseScore: number;
  probabilityFirst: number;
  meanRank: number;
  expectedBenefits: string[];
  gaps: string[];
  risks: string[];
  passport: EvidencePassportData | null;
}

export interface DecisionData {
  cellId: string;
  cellLabel: string;
  season: string;
  strategies: StrategyComparison[];
  source: DecisionSource;
}

export const DECISION_CRITERIA = [
  { key: "water_efficiency", label: "Water efficiency" },
  { key: "soil_health", label: "Soil health" },
  { key: "erosion_protection", label: "Erosion protection" },
  { key: "income_market", label: "Income & market fit" },
];

const illustrativeStrategies = [
  {
    code: "baseline",
    name: "Farmer's Baseline",
    sequence: "Continuous maize",
    isBaseline: true,
    scores: [0.48, 0.42, 0.38, 0.62],
    benefits: ["Keeps the familiar crop and current production routine"],
    gaps: ["Current field rotation and soil condition need farmer confirmation"],
    risks: ["Repeated cereal cropping may increase nutrient and pest pressure"],
  },
  {
    code: "strategy_a",
    name: "Strategy A · Cereal–legume",
    sequence: "Maize → soybean → maize",
    isBaseline: false,
    scores: [0.72, 0.82, 0.66, 0.68],
    benefits: ["Legume phase may support soil nitrogen", "Alternating crops can disrupt some pest cycles"],
    gaps: ["Local seed supply, inoculant access, and market price are unverified"],
    risks: ["Legume performance depends on timely planting and suitable varieties"],
  },
  {
    code: "strategy_b",
    name: "Strategy B · Soil-cover emphasis",
    sequence: "Maize → legume cover / retained residue",
    isBaseline: false,
    scores: [0.68, 0.86, 0.88, 0.55],
    benefits: ["More cover between crops may reduce exposed-soil periods", "Residue can help protect soil from heavy rain"],
    gaps: ["Residue availability and livestock-feed competition need local review"],
    risks: ["Cover crops require seed, labour, and management in the dry season"],
  },
  {
    code: "strategy_c",
    name: "Strategy C · Water resilience",
    sequence: "Early maize → drought-tolerant legume",
    isBaseline: false,
    scores: [0.84, 0.70, 0.62, 0.73],
    benefits: ["Planting windows can be adjusted to reduce exposure to dry spells", "Drought-tolerant varieties may buffer rainfall variability"],
    gaps: ["Variety availability and local maturity timing are unverified"],
    risks: ["Planting-window shifts depend on reliable local rainfall onset information"],
  },
];

export function createDecisionFixtures(): DecisionData {
  const weights = [0.4, 0.3, 0.2, 0.1];
  const scores = illustrativeStrategies.map((strategy) => strategy.scores);
  const base = baseScores(scores, weights);
  const ranks = rankProbabilities(scores, weights, { runs: 2000, seed: 42 });

  return {
    cellId: "ASH_R00_C00",
    cellLabel: "Ashanti pilot cell",
    season: "Major rainy season",
    source: "fixtures",
    strategies: illustrativeStrategies.map((strategy, index) => ({
      code: strategy.code,
      name: strategy.name,
      sequence: strategy.sequence,
      isBaseline: strategy.isBaseline,
      criteria: DECISION_CRITERIA.map((criterion, criterionIndex) => ({
        ...criterion,
        score: strategy.scores[criterionIndex],
      })),
      baseScore: base[index],
      probabilityFirst: ranks.probabilityFirst[index],
      meanRank: ranks.meanRank[index],
      expectedBenefits: strategy.benefits,
      gaps: strategy.gaps,
      risks: strategy.risks,
      passport: {
        evidenceTier: "Illustrative fixture",
        observationSummary: "Synthetic strategy and evidence example for interface development.",
        datasets: ["Illustrative environmental fixtures"],
        coverage: "No live observation coverage; values are synthetic.",
        method: "Illustrative weighted criteria and seeded Monte Carlo simulation.",
        keyFinding: "This example demonstrates how evidence and uncertainty will be presented.",
        uncertainty: "All scores and rank probabilities are placeholders, not scientific results.",
        scaleHonestyNote: "This fixture is not derived from satellite or field observations.",
        gaps: strategy.gaps,
        requiredLocalReview: ["Confirm the farmer's existing rotation", "Verify seed, labour, and market availability"],
        validatorRoles: ["Farmer", "Extension officer"],
      },
    })),
  };
}
