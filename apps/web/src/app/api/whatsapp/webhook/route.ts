import { NextResponse } from "next/server";
import {
  buildWhatsAppCloudPayload,
  buildWhatsAppReplyForInbound,
  getGatewayCapabilities,
  normalizeGhanaPhone,
} from "@/lib/comms";

/**
 * Meta WhatsApp Business Cloud API webhook verification challenge.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge") ?? "";
  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "fieldshift-wa-verify";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json(
    { ok: false, error: "Invalid WhatsApp webhook verification token" },
    { status: 403 },
  );
}

/**
 * Inbound WhatsApp message webhook: accepts either Meta Cloud API nested entry payload
 * or simplified `{ from, text }` test JSON, and dispatches or previews bilingual EN/Twi reply.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  let fromRaw = String(body.from ?? "");
  let inboundText = String(body.text ?? "");

  // Extract Meta Cloud API structure if provided
  const entries = body.entry as Array<Record<string, unknown>> | undefined;
  const firstMsg = entries?.[0]?.changes as Array<Record<string, unknown>> | undefined;
  const value = firstMsg?.[0]?.value as Record<string, unknown> | undefined;
  const messages = value?.messages as Array<Record<string, unknown>> | undefined;
  if (messages?.[0]) {
    fromRaw = String(messages[0].from ?? fromRaw);
    const textObj = messages[0].text as Record<string, unknown> | undefined;
    inboundText = String(textObj?.body ?? inboundText);
  }

  const replyText = buildWhatsAppReplyForInbound(inboundText || "WATER");
  const toE164 = normalizeGhanaPhone(fromRaw);
  const caps = getGatewayCapabilities();

  let dispatched = false;
  if (toE164 && caps.whatsappConfigured) {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "";
    const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || "";
    const payload = buildWhatsAppCloudPayload(toE164, replyText);
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch(() => null);
    dispatched = Boolean(res?.ok);
  }

  return NextResponse.json({
    ok: true,
    inboundText,
    replyText,
    recipient: toE164,
    mode: caps.whatsappConfigured && dispatched ? "live_replied" : "simulated_reply",
  });
}
