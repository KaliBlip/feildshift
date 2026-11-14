"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Radio, Send, Signal, Smartphone } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import {
  ASHANTI_PILOT_CELLS,
  ROTATION_STRATEGIES,
} from "@/constants/ashanti-pilot";
import { USSD_SHORTCODE, buildSmsSummaryCard } from "@/lib/sms-export";
import { baseScores, rankProbabilities } from "@/lib/scoring";
import {
  CLIMATE_STRESS_SCENARIOS,
  applyClimateStressToStrategies,
  type ClimateStressId,
} from "@/lib/stress";

interface GatewayStatus {
  africastalkingConfigured: boolean;
  africastalkingEnvironment: "sandbox" | "live";
  whatsappConfigured: boolean;
}

export default function SmsUssdMockPage() {
  const t = useTranslations("sms");
  const [cellId, setCellId] = useState("ASH_R05_C05");
  const [strategyCode, setStrategyCode] = useState("strategy_a");
  const [scenarioId, setScenarioId] =
    useState<Exclude<ClimateStressId, "custom">>("baseline");
  const [phoneInput, setPhoneInput] = useState("+233240000000");
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "both">("both");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dispatchLog, setDispatchLog] = useState<string | null>(null);
  const [sentSmsList, setSentSmsList] = useState<string[]>([]);

  // Live Gateway Capabilities
  const [gateway, setGateway] = useState<GatewayStatus>({
    africastalkingConfigured: false,
    africastalkingEnvironment: "sandbox",
    whatsappConfigured: false,
  });

  // Live AT USSD Session State driven by POST /api/ussd
  const [ussdSessionId, setUssdSessionId] = useState("at-web-session-01");
  const [ussdTextChain, setUssdTextChain] = useState<string>("");
  const [ussdScreenText, setUssdScreenText] = useState<string>("");
  const [ussdStarted, setUssdStarted] = useState(false);
  const [waInboundCmd, setWaInboundCmd] = useState("SOIL ASH_R04_C04");
  const [waReplyPreview, setWaReplyPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramCell = params.get("cell");
      const paramStrat = params.get("strategy");
      void Promise.resolve().then(() => {
        if (paramCell && ASHANTI_PILOT_CELLS.some((c) => c.cell_id === paramCell)) {
          setCellId(paramCell);
        }
        if (paramStrat && ROTATION_STRATEGIES.some((s) => s.code === paramStrat)) {
          setStrategyCode(paramStrat);
        }
      });
    }

    fetch("/api/messaging/dispatch")
      .then((res) => res.json())
      .then((data: Partial<GatewayStatus>) => {
        setGateway({
          africastalkingConfigured: Boolean(data.africastalkingConfigured),
          africastalkingEnvironment:
            data.africastalkingEnvironment === "live" ? "live" : "sandbox",
          whatsappConfigured: Boolean(data.whatsappConfigured),
        });
      })
      .catch(() => undefined);
  }, []);

  const selectedStrategy = useMemo(
    () =>
      ROTATION_STRATEGIES.find((s) => s.code === strategyCode) ??
      ROTATION_STRATEGIES[1],
    [strategyCode],
  );

  const selectedScenario = useMemo(
    () =>
      CLIMATE_STRESS_SCENARIOS.find((s) => s.id === scenarioId) ??
      CLIMATE_STRATEGIES_FALLBACK(),
    [scenarioId],
  );

  const smsMetrics = useMemo(() => {
    const weights: [number, number, number, number] = [0.4, 0.3, 0.2, 0.1];
    const baseMat = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
    const stressedMat = applyClimateStressToStrategies(
      ROTATION_STRATEGIES,
      scenarioId,
    );
    const baseTotals = baseScores(baseMat, weights);
    const stressedTotals = baseScores(stressedMat, weights);
    const mc = rankProbabilities(stressedMat, weights, { runs: 2000, seed: 42 });

    const idx = Math.max(
      0,
      ROTATION_STRATEGIES.findIndex((s) => s.code === selectedStrategy.code),
    );
    const baseScorePct = Math.round(stressedTotals[idx] * 100);
    const deltaPct = Math.round((stressedTotals[idx] - baseTotals[idx]) * 100);
    const winProbPct = Math.round(mc.probabilityFirst[idx] * 100);

    const smsText = buildSmsSummaryCard({
      cellId,
      strategy: selectedStrategy,
      baseScorePct,
      winProbPct,
      scenarioLabel: selectedScenario.shortLabel,
      stressDeltaPct: deltaPct,
    });

    return { baseScorePct, winProbPct, smsText };
  }, [cellId, selectedScenario.shortLabel, selectedStrategy, scenarioId]);

  const callUssdWebhook = async (nextChain: string) => {
    try {
      const res = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: ussdSessionId,
          serviceCode: USSD_SHORTCODE,
          phoneNumber: phoneInput,
          text: nextChain,
        }),
      });
      const replyText = await res.text();
      setUssdScreenText(replyText);
      setUssdTextChain(nextChain);
    } catch {
      setUssdScreenText("END Network error calling /api/ussd");
    }
  };

  const handleUssdKey = (key: string) => {
    if (key === "*") {
      setUssdStarted(false);
      setUssdTextChain("");
      setUssdScreenText("");
      return;
    }
    if (!ussdStarted) {
      if (key === "DIAL") {
        setUssdStarted(true);
        setUssdSessionId(`at-web-${Date.now()}`);
        void callUssdWebhook("");
      }
      return;
    }

    if (ussdScreenText.startsWith("END ")) {
      if (key === "0") {
        const nextChain = ussdTextChain ? `${ussdTextChain}*0` : "";
        void callUssdWebhook(nextChain);
      }
      return;
    }

    const nextChain = ussdTextChain ? `${ussdTextChain}*${key}` : key;
    void callUssdWebhook(nextChain);
  };

  const copySms = async () => {
    try {
      await navigator.clipboard.writeText(smsMetrics.smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked cleanly ignored
    }
  };

  const handleGatewayDispatch = async () => {
    setIsSending(true);
    setDispatchLog(null);
    try {
      const res = await fetch("/api/messaging/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          to: phoneInput,
          cellId,
          strategyCode,
          scenarioId,
          customMessage: smsMetrics.smsText,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        deliveries?: Array<{ provider: string; mode: string; ok: boolean }>;
      };
      if (!res.ok || !data.ok) {
        setDispatchLog(data.error ?? "Dispatch failed");
      } else {
        const summary = (data.deliveries ?? [])
          .map((d) => `${d.provider} (${d.mode}: ${d.ok ? "OK" : "ERR"})`)
          .join(" · ");
        setDispatchLog(summary);
        setSentSmsList((prev) => [smsMetrics.smsText, ...prev].slice(0, 4));
      }
    } catch {
      setDispatchLog("Error reaching /api/messaging/dispatch");
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateWhatsAppInbound = async () => {
    try {
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: phoneInput,
          text: waInboundCmd,
        }),
      });
      const data = (await res.json()) as { replyText?: string };
      if (data.replyText) {
        setWaReplyPreview(data.replyText);
      }
    } catch {
      setWaReplyPreview("Unable to reach /api/whatsapp/webhook");
    }
  };

  return (
    <>
      <AppNav />
      <main className="sf-page-main">
        <div className="container sf-page-stack">
          <header className="sf-page-header">
            <div>
              <span className="label">{t("label")}</span>
              <h1 className="display-md sf-page-title">{t("title")}</h1>
              <p className="sf-page-subtitle">{t("subtitle")}</p>
            </div>
            <div className="sf-chip-row">
              <span className={`sf-tier-badge ${gateway.africastalkingConfigured ? "tier-established" : "tier-derived"}`}>
                <Radio size={12} aria-hidden="true" />
                <span>
                  Africa&apos;s Talking:{" "}
                  {gateway.africastalkingConfigured
                    ? `Live (${gateway.africastalkingEnvironment})`
                    : "Webhook Ready (Simulated)"}
                </span>
              </span>
              <span className={`sf-tier-badge ${gateway.whatsappConfigured ? "tier-established" : "tier-derived"}`}>
                <Smartphone size={12} aria-hidden="true" />
                <span>
                  WhatsApp Cloud:{" "}
                  {gateway.whatsappConfigured ? "Live Connected" : "Webhook Ready (Simulated)"}
                </span>
              </span>
            </div>
          </header>

          <div className="sf-sms-ussd-grid">
            {/* Interactive Feature Phone USSD Mock wired to POST /api/ussd */}
            <section className="sf-card" aria-label="Feature phone USSD simulator">
              <div className="sf-handset-frame">
                <div className="sf-handset-speaker" aria-hidden="true" />
                <div className="sf-handset-status">
                  <span>MTN-GH 2G</span>
                  <span className="flex items-center gap-1">
                    <Signal size={12} aria-hidden="true" />
                    <span>{USSD_SHORTCODE}</span>
                  </span>
                </div>

                <div className="sf-handset-screen" role="region" aria-live="polite">
                  {!ussdStarted ? (
                    <div className="sf-ussd-screen">
                      <p className="font-bold">AFRICA&apos;S TALKING USSD GATEWAY</p>
                      <p className="mt-2">
                        Dial {USSD_SHORTCODE} to query <code>/api/ussd</code> live with AT{" "}
                        <code>CON</code> / <code>END</code> responses.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUssdKey("DIAL")}
                        className="sf-ussd-dial-btn"
                      >
                        Dial {USSD_SHORTCODE}
                      </button>
                    </div>
                  ) : (
                    <div className="sf-ussd-screen">
                      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-snug">
                        {ussdScreenText || "CON Connecting..."}
                      </pre>
                      <p className="mt-2 text-[10px] opacity-75">
                        Chain: <code>text=&quot;{ussdTextChain}&quot;</code> · * Home
                      </p>
                    </div>
                  )}
                </div>

                <div className="sf-keypad" role="group" aria-label="Feature phone keypad">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUssdKey(key)}
                        className="sf-key-btn"
                      >
                        {key}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </section>

            {/* Live SMS & WhatsApp Dispatch Composer */}
            <section className="sf-card" aria-labelledby="sms-composer-heading">
              <div className="sf-card-header">
                <div>
                  <h2 id="sms-composer-heading" className="sf-card-title">
                    {t("generateTitle")}
                  </h2>
                  <p className="sf-card-subtitle">
                    Dispatches via <code>POST /api/messaging/dispatch</code> to Africa&apos;s Talking SMS &amp; Meta WhatsApp Business Cloud API.
                  </p>
                </div>
                <Smartphone size={20} className="text-[#275d38]" aria-hidden="true" />
              </div>

              <div className="sf-form-stack">
                <div className="sf-form-row">
                  <div className="sf-field">
                    <label htmlFor="dispatch-phone">Farmer Phone (Ghana / E.164)</label>
                    <input
                      id="dispatch-phone"
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+233240000000"
                      className="input-select"
                    />
                  </div>
                  <div className="sf-field">
                    <label htmlFor="dispatch-channel">Delivery Channel</label>
                    <select
                      id="dispatch-channel"
                      value={channel}
                      onChange={(e) =>
                        setChannel(e.target.value as "sms" | "whatsapp" | "both")
                      }
                      className="input-select"
                    >
                      <option value="both">Africa&apos;s Talking SMS + WhatsApp</option>
                      <option value="sms">Africa&apos;s Talking SMS only</option>
                      <option value="whatsapp">WhatsApp Business Cloud only</option>
                    </select>
                  </div>
                </div>

                <div className="sf-form-row">
                  <div className="sf-field">
                    <label htmlFor="sms-cell">Pilot Cell</label>
                    <select
                      id="sms-cell"
                      value={cellId}
                      onChange={(e) => setCellId(e.target.value)}
                      className="input-select"
                    >
                      {ASHANTI_PILOT_CELLS.map((c) => (
                        <option key={c.cell_id} value={c.cell_id}>
                          {c.cell_id} — {c.region_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sf-field">
                    <label htmlFor="sms-strategy">Strategy</label>
                    <select
                      id="sms-strategy"
                      value={strategyCode}
                      onChange={(e) => setStrategyCode(e.target.value)}
                      className="input-select"
                    >
                      {ROTATION_STRATEGIES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sf-field">
                  <label htmlFor="sms-scenario">Climate Stress Condition</label>
                  <select
                    id="sms-scenario"
                    value={scenarioId}
                    onChange={(e) =>
                      setScenarioId(e.target.value as Exclude<ClimateStressId, "custom">)
                    }
                    className="input-select"
                  >
                    {CLIMATE_STRESS_SCENARIOS.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sf-sms-preview-box">
                  <div className="sf-sms-meta">
                    <span>GSM / WhatsApp Payload</span>
                    <span>{smsMetrics.smsText.length} / 319 chars</span>
                  </div>
                  <p className="sf-sms-bubble">{smsMetrics.smsText}</p>
                  <div className="sf-card-actions">
                    <button
                      type="button"
                      onClick={() => void copySms()}
                      className="btn btn-secondary btn-sm"
                    >
                      {copied ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        <Copy size={14} aria-hidden="true" />
                      )}
                      <span>{copied ? t("copied") : t("copySms")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleGatewayDispatch()}
                      className="btn btn-primary btn-sm"
                    >
                      <Send size={14} aria-hidden="true" />
                      <span>
                        {isSending
                          ? "Sending..."
                          : "Send via Gateway API"}
                      </span>
                    </button>
                  </div>
                  {dispatchLog && (
                    <p role="status" aria-live="polite" className="text-xs font-semibold text-[#16512c]">
                      {dispatchLog}
                    </p>
                  )}
                </div>

                {/* WhatsApp Inbound Keyword Bot Tester */}
                <div className="sf-sms-preview-box">
                  <div className="sf-sms-meta">
                    <span>WhatsApp Inbound Bot (<code>POST /api/whatsapp/webhook</code>)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      aria-label="WhatsApp inbound keyword"
                      value={waInboundCmd}
                      onChange={(e) => setWaInboundCmd(e.target.value)}
                      className="input-select flex-1"
                      placeholder="WATER, SOIL ASH_R04_C04, or HELP"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSimulateWhatsAppInbound()}
                      className="btn btn-secondary btn-sm"
                    >
                      Test Bot Reply
                    </button>
                  </div>
                  {waReplyPreview && (
                    <p className="sf-sms-bubble">{waReplyPreview}</p>
                  )}
                </div>

                {sentSmsList.length > 0 && (
                  <div className="sf-inbox-log" aria-live="polite">
                    <h3 className="sf-subpanel-title">Dispatched Messages</h3>
                    {sentSmsList.map((msg, idx) => (
                      <div key={idx} className="sf-inbox-msg">
                        <span className="text-[11px] font-mono text-[#4a5e50]">
                          To: {phoneInput} · Dispatched
                        </span>
                        <p>{msg}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function CLIMATE_STRATEGIES_FALLBACK() {
  return CLIMATE_STRESS_SCENARIOS[0];
}
