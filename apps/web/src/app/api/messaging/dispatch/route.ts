import { NextResponse } from "next/server";
import { ROTATION_STRATEGIES } from "@/constants/ashanti-pilot";
import {
  buildAfricasTalkingSmsForm,
  buildWhatsAppCloudPayload,
  getGatewayCapabilities,
  normalizeGhanaPhone,
} from "@/lib/comms";
import { baseScores, rankProbabilities } from "@/lib/scoring";
import { buildSmsSummaryCard } from "@/lib/sms-export";
import {
  CLIMATE_STRESS_SCENARIOS,
  applyClimateStressToStrategies,
  type ClimateStressId,
} from "@/lib/stress";

export async function GET() {
  const caps = getGatewayCapabilities();
  return NextResponse.json({
    ok: true,
    ...caps,
    ussdEndpoint: "/api/ussd",
    whatsappWebhook: "/api/whatsapp/webhook",
  });
}

interface DispatchRequestBody {
  channel?: "sms" | "whatsapp" | "both";
  to?: string;
  cellId?: string;
  strategyCode?: string;
  scenarioId?: Exclude<ClimateStressId, "custom">;
  customMessage?: string;
  dryRun?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DispatchRequestBody;
  const channel = body.channel ?? "sms";
  const recipient = normalizeGhanaPhone(String(body.to ?? ""));
  if (!recipient) {
    return NextResponse.json(
      { ok: false, error: "Invalid phone number. Provide Ghanaian local (024...) or E.164 (+233...) format." },
      { status: 400 },
    );
  }

  const cellId = body.cellId || "ASH_R05_C05";
  const scenarioId = body.scenarioId ?? "baseline";
  const strategy =
    ROTATION_STRATEGIES.find((s) => s.code === body.strategyCode) ??
    ROTATION_STRATEGIES[1];
  const scenario =
    CLIMATE_STRESS_SCENARIOS.find((s) => s.id === scenarioId) ??
    CLIMATE_STRATEGIES_DEFAULT();

  let message = body.customMessage?.trim() ?? "";
  if (!message) {
    const weights: [number, number, number, number] = [0.4, 0.3, 0.2, 0.1];
    const baseMat = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
    const stressedMat = applyClimateStressToStrategies(ROTATION_STRATEGIES, scenarioId);
    const baseTotals = baseScores(baseMat, weights);
    const stressedTotals = baseScores(stressedMat, weights);
    const mc = rankProbabilities(stressedMat, weights, { runs: 1000, seed: 42 });
    const idx = Math.max(
      0,
      ROTATION_STRATEGIES.findIndex((s) => s.code === strategy.code),
    );
    message = buildSmsSummaryCard({
      cellId,
      strategy,
      baseScorePct: Math.round(stressedTotals[idx] * 100),
      winProbPct: Math.round(mc.probabilityFirst[idx] * 100),
      scenarioLabel: scenario.shortLabel,
      stressDeltaPct: Math.round((stressedTotals[idx] - baseTotals[idx]) * 100),
    });
  }

  const caps = getGatewayCapabilities();
  const forceDryRun = Boolean(body.dryRun);
  const deliveries: Record<string, unknown>[] = [];

  if (channel === "sms" || channel === "both") {
    const username = process.env.AFRICASTALKING_USERNAME?.trim() || "sandbox";
    const apiKey = process.env.AFRICASTALKING_API_KEY?.trim() || "";
    const senderId = process.env.AFRICASTALKING_SENDER_ID?.trim() || undefined;
    const endpoint =
      username === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging";

    const form = buildAfricasTalkingSmsForm({
      username,
      to: recipient,
      message,
      senderId,
    });

    if (caps.africastalkingConfigured && !forceDryRun) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            apiKey,
          },
          body: form.toString(),
        });
        const data = await res.json().catch(() => ({ rawStatus: res.status }));
        deliveries.push({
          provider: "africas_talking_sms",
          mode: caps.africastalkingEnvironment,
          ok: res.ok,
          endpoint,
          to: recipient,
          response: data,
        });
      } catch (err) {
        deliveries.push({
          provider: "africas_talking_sms",
          mode: caps.africastalkingEnvironment,
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
        });
      }
    } else {
      deliveries.push({
        provider: "africas_talking_sms",
        mode: "simulated",
        ok: true,
        endpoint,
        to: recipient,
        charCount: message.length,
        payloadPreview: Object.fromEntries(form.entries()),
        note: "Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY to dispatch over live Africa's Talking REST API.",
      });
    }
  }

  if (channel === "whatsapp" || channel === "both") {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "DEMO_PHONE_ID";
    const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "";
    const endpoint = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    const waPayload = buildWhatsAppCloudPayload(recipient, message);

    if (caps.whatsappConfigured && !forceDryRun) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(waPayload),
        });
        const data = await res.json().catch(() => ({ rawStatus: res.status }));
        deliveries.push({
          provider: "whatsapp_business_cloud",
          mode: "live",
          ok: res.ok,
          endpoint,
          to: recipient,
          response: data,
        });
      } catch (err) {
        deliveries.push({
          provider: "whatsapp_business_cloud",
          mode: "live",
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
        });
      }
    } else {
      deliveries.push({
        provider: "whatsapp_business_cloud",
        mode: "simulated",
        ok: true,
        endpoint,
        to: recipient,
        payloadPreview: waPayload,
        note: "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to send live WhatsApp Business messages.",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    recipient,
    message,
    deliveries,
  });
}

function CLIMATE_STRATEGIES_DEFAULT() {
  return CLIMATE_STRESS_SCENARIOS[0];
}
