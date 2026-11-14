import {
  ASHANTI_PILOT_CELLS,
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
} from "../constants/ashanti-pilot.ts";
import { baseScores, rankProbabilities } from "./scoring.ts";
import {
  buildSmsSummaryCard,
  estimateNitrogenOffsetSummary,
} from "./sms-export.ts";

export interface GatewayCapabilities {
  africastalkingConfigured: boolean;
  africastalkingUsername: string | null;
  africastalkingEnvironment: "sandbox" | "live";
  whatsappConfigured: boolean;
  whatsappVerifyConfigured: boolean;
}

/**
 * Inspect server environment variables without exposing secret keys.
 */
export function getGatewayCapabilities(): GatewayCapabilities {
  const atUser = process.env.AFRICASTALKING_USERNAME?.trim() || null;
  const atKey = process.env.AFRICASTALKING_API_KEY?.trim() || "";
  const waPhone = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "";
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "";
  const waVerify = process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "";

  return {
    africastalkingConfigured: Boolean(atUser && atKey),
    africastalkingUsername: atUser,
    africastalkingEnvironment: atUser === "sandbox" ? "sandbox" : "live",
    whatsappConfigured: Boolean(waPhone && waToken),
    whatsappVerifyConfigured: Boolean(waVerify),
  };
}

/**
 * Normalize common Ghanaian local (024xxxxxxx) or E.164 numbers to +233... format.
 */
export function normalizeGhanaPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-()]/g, "").trim();
  if (!cleaned) {
    return null;
  }
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^0\d{9}$/.test(cleaned)) {
    return `+233${cleaned.slice(1)}`;
  }
  if (/^233\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return null;
}

export interface UssdEvaluationResult {
  reply: string;
  terminal: boolean;
  lang: "en" | "tw";
  cellId?: string;
  selectedStrategyCode?: string;
}

/**
 * Africa's Talking USSD session state machine driven by AT's `*`-joined `text` string.
 * Responses begin strictly with `CON ` (continue menu) or `END ` (terminate session).
 */
export function evaluateAfricasTalkingUssdText(rawText: string): UssdEvaluationResult {
  const normalized = rawText.trim();
  if (!normalized) {
    return {
      reply: "CON Akwaaba / Welcome to Field Shift\n1. English\n2. Asante Twi",
      terminal: false,
      lang: "en",
    };
  }

  // Handle USSD back navigation token "0" safely
  const rawTokens = normalized.split("*").filter((tok) => tok.length > 0);
  const stack: string[] = [];
  for (const tok of rawTokens) {
    if (tok === "0") {
      stack.pop();
    } else {
      stack.push(tok);
    }
  }

  if (stack.length === 0) {
    return {
      reply: "CON Akwaaba / Welcome to Field Shift\n1. English\n2. Asante Twi",
      terminal: false,
      lang: "en",
    };
  }

  const langChoice = stack[0];
  if (langChoice !== "1" && langChoice !== "2") {
    return {
      reply: "CON Invalid choice / Nkyerɛaseɛ bɔne\n1. English\n2. Asante Twi",
      terminal: false,
      lang: "en",
    };
  }
  const lang: "en" | "tw" = langChoice === "2" ? "tw" : "en";

  if (stack.length === 1) {
    const header =
      lang === "tw" ? "CON Paw Ashanti mpɔtam:" : "CON Select Ashanti Cell:";
    const list = ASHANTI_PILOT_CELLS.map(
      (c, i) => `${i + 1}. ${c.cell_id} (${c.region_name.split(" ")[0]})`,
    ).join("\n");
    return {
      reply: `${header}\n${list}\n0. ${lang === "tw" ? "San akyi" : "Back"}`,
      terminal: false,
      lang,
    };
  }

  const cellIdx = Number(stack[1]) - 1;
  if (!Number.isInteger(cellIdx) || cellIdx < 0 || cellIdx >= ASHANTI_PILOT_CELLS.length) {
    return {
      reply:
        lang === "tw"
          ? "CON Nkyekyɛmu nni hɔ. Paw 1 kosi 5.\n0. San akyi"
          : "CON Invalid cell selection. Choose 1-5.\n0. Back",
      terminal: false,
      lang,
    };
  }
  const cell = ASHANTI_PILOT_CELLS[cellIdx];

  if (stack.length === 2) {
    const prompt =
      lang === "tw"
        ? `CON [${cell.cell_id}] Dɛn na ehia wo paa?\n1. Nsuo Kora (Drought)\n2. Asase ne Nwura Nkatae\n3. Sika ne Dwa (Market)\n0. San akyi`
        : `CON [${cell.cell_id}] Main Farm Priority:\n1. Water & Dry-Spell Safety\n2. Soil Cover & Urea Savings\n3. Market Income\n0. Back`;
    return {
      reply: prompt,
      terminal: false,
      lang,
      cellId: cell.cell_id,
    };
  }

  const priorityCode = stack[2];
  const presetMap: Record<string, string> = {
    "1": "water",
    "2": "soil",
    "3": "income",
  };
  const presetId = presetMap[priorityCode];
  if (!presetId) {
    return {
      reply:
        lang === "tw"
          ? "CON Paw 1, 2, anaa 3.\n0. San akyi"
          : "CON Choose priority 1, 2, or 3.\n0. Back",
      terminal: false,
      lang,
      cellId: cell.cell_id,
    };
  }

  const preset = PRIORITY_PRESETS.find((p) => p.id === presetId) ?? PRIORITY_PRESETS[1];
  const matrix = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
  const scores = baseScores(matrix, preset.weights);
  const mc = rankProbabilities(matrix, preset.weights, { runs: 1000, seed: 42 });

  let bestIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[bestIdx]) {
      bestIdx = i;
    }
  }
  const topStrategy = ROTATION_STRATEGIES[bestIdx];
  const scorePct = Math.round(scores[bestIdx] * 100);
  const winPct = Math.round(mc.probabilityFirst[bestIdx] * 100);
  const offset = estimateNitrogenOffsetSummary(topStrategy);

  const summary =
    lang === "tw"
      ? `END [${cell.cell_id}] ${topStrategy.name}: ${scorePct}/100 (Nkonim ${winPct}%). Urea ~${offset.ureaBagsSavedPerHa} bɔtɔ/ha kora, nna ${offset.bareDaysAvoided} asase nkatae. Bisa wɔ MOFA panin hɔ.`
      : `END [${cell.cell_id}] ${topStrategy.name}: ${scorePct}/100 (win ${winPct}%). Saves ~${offset.ureaBagsSavedPerHa} urea bags/ha & avoids ${offset.bareDaysAvoided} bare days. Confirm locally with MOFA.`;

  return {
    reply: summary,
    terminal: true,
    lang,
    cellId: cell.cell_id,
    selectedStrategyCode: topStrategy.code,
  };
}

/**
 * Parse inbound WhatsApp command text (e.g., "TWI ASH_R05_C05", "SOIL ASH_R04_C04", "HELP")
 * and return a bilingual WhatsApp reply card.
 */
export function buildWhatsAppReplyForInbound(bodyText: string): string {
  const upper = bodyText.trim().toUpperCase();
  const matchedCell =
    ASHANTI_PILOT_CELLS.find((c) => upper.includes(c.cell_id)) ?? ASHANTI_PILOT_CELLS[0];

  const priorityId = upper.includes("SOIL")
    ? "soil"
    : upper.includes("INCOME")
      ? "income"
      : "water";
  const preset = PRIORITY_PRESETS.find((p) => p.id === priorityId) ?? PRIORITY_PRESETS[1];

  const matrix = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
  const scores = baseScores(matrix, preset.weights);
  const mc = rankProbabilities(matrix, preset.weights, { runs: 1000, seed: 42 });

  let bestIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[bestIdx]) {
      bestIdx = i;
    }
  }
  const strategy = ROTATION_STRATEGIES[bestIdx];

  if (upper === "HELP" || upper === "MENU" || upper === "HI") {
    return (
      `Field Shift Ashanti Bot (${matchedCell.cell_id}): Reply with WATER, SOIL, or INCOME ` +
      `(optionally add cell ID e.g. "SOIL ASH_R04_C04") for bilingual EN/Twi crop-rotation advice.`
    );
  }

  return buildSmsSummaryCard({
    cellId: matchedCell.cell_id,
    strategy,
    baseScorePct: Math.round(scores[bestIdx] * 100),
    winProbPct: Math.round(mc.probabilityFirst[bestIdx] * 100),
    scenarioLabel: priorityId,
  });
}

export function buildAfricasTalkingSmsForm(params: {
  username: string;
  to: string;
  message: string;
  senderId?: string;
}): URLSearchParams {
  const form = new URLSearchParams();
  form.set("username", params.username);
  form.set("to", params.to);
  form.set("message", params.message);
  if (params.senderId) {
    form.set("from", params.senderId);
  }
  return form;
}

export function buildWhatsAppCloudPayload(toE164: string, message: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toE164.replace(/^\+/, ""),
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };
}
