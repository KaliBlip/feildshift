import type { RotationStrategySpec } from "@/types/database";

export interface NitrogenOffsetSummary {
  nFixKgHa: number;
  ureaBagsSavedPerHa: number;
  bareDaysAvoided: number;
}

const LEGUME_N_FIX_BY_KEYWORD: ReadonlyArray<[string, number]> = [
  ["mucuna", 90],
  ["pigeonpea", 65],
  ["soybean", 55],
  ["groundnut", 50],
  ["cowpea", 45],
];

/**
 * Estimate biological N-fixation (50 kg urea bags @ 46% N = 23 kg N/bag)
 * and Harmattan bare-soil days avoided per strategy descriptor.
 */
export function estimateNitrogenOffsetSummary(
  strategy: RotationStrategySpec,
): NitrogenOffsetSummary {
  if (strategy.isBaseline) {
    return { nFixKgHa: 0, ureaBagsSavedPerHa: 0, bareDaysAvoided: 0 };
  }
  const haystack = `${strategy.code} ${strategy.name} ${strategy.sequence}`.toLowerCase();
  let nFixKgHa = 0;
  for (const [keyword, kg] of LEGUME_N_FIX_BY_KEYWORD) {
    if (haystack.includes(keyword)) {
      nFixKgHa = Math.max(nFixKgHa, kg);
    }
  }
  const bareDaysAvoided =
    haystack.includes("mucuna") || haystack.includes("alley")
      ? 48
      : nFixKgHa > 0 || haystack.includes("cassava")
        ? 32
        : 16;

  return {
    nFixKgHa,
    ureaBagsSavedPerHa: Number((nFixKgHa / 23.0).toFixed(1)),
    bareDaysAvoided,
  };
}

export interface SmsSummaryCardInput {
  cellId: string;
  strategy: RotationStrategySpec;
  baseScorePct: number;
  winProbPct: number;
  scenarioLabel: string;
  stressDeltaPct?: number;
}

/**
 * Build a <320 char bilingual EN + Ashanti Twi SMS advisory suitable for 2G SMS / WhatsApp.
 */
export function buildSmsSummaryCard({
  cellId,
  strategy,
  baseScorePct,
  winProbPct,
  scenarioLabel,
  stressDeltaPct,
}: SmsSummaryCardInput): string {
  const { ureaBagsSavedPerHa, bareDaysAvoided } = estimateNitrogenOffsetSummary(strategy);
  const deltaText =
    typeof stressDeltaPct === "number" && stressDeltaPct !== 0
      ? ` (${stressDeltaPct > 0 ? "+" : ""}${stressDeltaPct}%)`
      : "";
  const nOffsetEn =
    ureaBagsSavedPerHa > 0 ? ` Saves ~${ureaBagsSavedPerHa} urea bags/ha.` : "";
  const coverEn = bareDaysAvoided > 0 ? ` -${bareDaysAvoided} bare d.` : "";
  const twiPick =
    ureaBagsSavedPerHa > 0
      ? `Twi: ${strategy.name} bɔ asase ho ban na ɛtew nnuru (urea ~${ureaBagsSavedPerHa} bags/ha) so.`
      : `Twi: ${strategy.name} boa ma nsuo ne asase gyina pintinn.`;

  const message =
    `FieldShift [${cellId}] ${strategy.name}: ${baseScorePct}/100${deltaText}, ` +
    `win ${winProbPct}% (${scenarioLabel}).${nOffsetEn}${coverEn} ${twiPick}`;

  return message.length <= 319 ? message : `${message.slice(0, 316).trimEnd()}...`;
}

export interface UssdSessionState {
  step: "home" | "language" | "cell" | "priority" | "result";
  lang: "en" | "tw";
  cellIndex: number;
  priorityId: "water" | "soil" | "income";
}

export const USSD_SHORTCODE = "*920*44#";
