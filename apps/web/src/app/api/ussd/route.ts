import { createClient } from "@supabase/supabase-js";
import { evaluateAfricasTalkingUssdText } from "@/lib/comms";

/**
 * Live Africa's Talking USSD Webhook (`POST /api/ussd`).
 * Accepts `application/x-www-form-urlencoded` (standard AT payload) or JSON (simulator).
 * Returns `text/plain` starting with `CON ` or `END ` per Africa's Talking spec.
 */
export async function POST(request: Request) {
  let sessionId = "sim-session";
  let phoneNumber = "";
  let text = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    sessionId = String(body.sessionId ?? sessionId);
    phoneNumber = String(body.phoneNumber ?? "");
    text = String(body.text ?? "");
  } else {
    const rawBody = await request.text();
    const form = new URLSearchParams(rawBody);
    sessionId = form.get("sessionId") ?? sessionId;
    phoneNumber = form.get("phoneNumber") ?? "";
    text = form.get("text") ?? "";
  }

  const evaluation = evaluateAfricasTalkingUssdText(text);

  // Best-effort audit logging of completed USSD sessions to Supabase when configured
  if (evaluation.terminal && evaluation.cellId && evaluation.selectedStrategyCode) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (url && key) {
      try {
        const sb = createClient(url, key);
        await sb.from("decision_logs").insert({
          cell_id: evaluation.cellId,
          session_label: `USSD ${sessionId}`,
          logged_by_role: "farmer",
          existing_rotation: "Maize -> Maize",
          selected_strategy_code: evaluation.selectedStrategyCode,
          farm_area_ha: 2.0,
          priority_weights: { lang: evaluation.lang, channel: "ussd" },
          computed_base_scores: { channel: "africas_talking_ussd" },
          rank_probabilities: { channel: "africas_talking_ussd" },
          reasoning_notes: phoneNumber
            ? `AT USSD session (${phoneNumber.slice(0, 6)}***)`
            : "AT USSD session",
        });
      } catch {
        // Never fail USSD telco timeout due to optional telemetry write
      }
    }
  }

  return new Response(evaluation.reply, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-FieldShift-Ussd-Terminal": String(evaluation.terminal),
      "X-FieldShift-Locale": evaluation.lang,
    },
  });
}
