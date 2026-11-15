"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { useAppShell } from "@/components/I18nProvider";
import {
  ASHANTI_PILOT_CELLS,
  ROTATION_STRATEGIES,
} from "@/constants/ashanti-pilot";
import { loadWebSession } from "@/lib/auth";
import { computeM8CalibrationPreview, type M8CalibrationSummary } from "@/lib/m8-calibration";
import { baseScores, rankProbabilities } from "@/lib/scoring";
import {
  createOptionalSupabaseClient,
  gradeOutcomeReport,
  listDecisionLogs,
  listOutcomeReports,
  logDecisionRecord,
  submitOutcomeReport,
} from "@/lib/supabase";
import type {
  DecisionLogRecord,
  EvidenceGrade,
  OutcomeReportRecord,
  UserRole,
} from "@/types/database";

const GRADE_OPTIONS: { value: EvidenceGrade; label: string }[] = [
  { value: "farmer_reported", label: "Farmer Reported (Unverified)" },
  { value: "officer_reviewed", label: "Officer Reviewed (M8 Eligible)" },
  { value: "expert_validated", label: "Expert Validated (High Confidence M8)" },
  { value: "confounded_excluded", label: "Confounded / Excluded from M8" },
];

export default function OfficerPortalPage() {
  const t = useTranslations("officer");
  const { refreshPendingCount } = useAppShell();
  const officerFormId = useId();

  const [role, setRole] = useState<UserRole>("farmer");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"grade" | "log">("grade");

  const [decisions, setDecisions] = useState<DecisionLogRecord[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeReportRecord[]>([]);
  const [m8Summary, setM8Summary] = useState<M8CalibrationSummary | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Decision Log Form state
  const [decCell, setDecCell] = useState("ASH_R05_C05");
  const [decStrategy, setDecStrategy] = useState("strategy_a");
  const [decRotation, setDecRotation] = useState("Maize -> Maize");
  const [decAreaHa, setDecAreaHa] = useState("2.0");
  const [decSessionLabel, setDecSessionLabel] = useState("Ejura Co-op Walkthrough");
  const [decNotes, setDecNotes] = useState("");
  const [isSubmittingDec, setIsSubmittingDec] = useState(false);

  // Outcome Report Submission Form state
  const [outCell, setOutCell] = useState("ASH_R05_C05");
  const [outSeason, setOutSeason] = useState("Minor");
  const [outSummary, setOutSummary] = useState("");
  const [outCover, setOutCover] = useState("Good (>70% mulch/canopy cover)");
  const [outStress, setOutStress] = useState("Mild October dry spell");
  const [outPests, setOutPests] = useState("");
  const [isSubmittingOut, setIsSubmittingOut] = useState(false);

  // Farmer Notification Phone
  const [farmerPhone, setFarmerPhone] = useState("+233240000000");

  const isPrivileged = role === "extension_officer" || role === "agronomist";

  const reloadData = useCallback(async () => {
    const [d, o] = await Promise.all([listDecisionLogs(), listOutcomeReports()]);
    setDecisions(d);
    setOutcomes(o);
    setM8Summary(computeM8CalibrationPreview(o));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const localSession = loadWebSession();
    if (localSession) {
      setRole(localSession.role);
    }
    void Promise.all([listDecisionLogs(), listOutcomeReports()]).then(([d, o]) => {
      if (!cancelled) {
        setDecisions(d);
        setOutcomes(o);
        setM8Summary(computeM8CalibrationPreview(o));
      }
    });
    const client = createOptionalSupabaseClient();
    if (!client) {
      return () => {
        cancelled = true;
      };
    }
    void client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const jwtRole = data.session?.user?.app_metadata?.role;
      setAccessToken(data.session?.access_token ?? null);
      if (
        jwtRole === "extension_officer" ||
        jwtRole === "agronomist" ||
        jwtRole === "farmer"
      ) {
        setRole(jwtRole);
        setAuthMessage(`Signed in via Supabase Auth (${jwtRole})`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSupabaseLogin = async (e: FormEvent) => {
    e.preventDefault();
    const client = createOptionalSupabaseClient();
    if (!client) {
      setAuthMessage(
        "Supabase env vars not set in this build — using interactive Demo Role Switcher.",
      );
      return;
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (error) {
      setAuthMessage(`Auth error: ${error.message}`);
      return;
    }
    setAccessToken(data.session?.access_token ?? null);
    const jwtRole = data.user?.app_metadata?.role;
    if (jwtRole === "extension_officer" || jwtRole === "agronomist") {
      setRole(jwtRole);
      setAuthMessage(`Authenticated officer session: ${data.user.email} (${jwtRole})`);
    } else {
      setRole("farmer");
      setAuthMessage(`Authenticated as farmer account (non-officer RLS scope).`);
    }
  };

  const handleSubmitDecision = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingDec(true);
    setStatusNotice(null);

    const weightsArr = [0.4, 0.3, 0.2, 0.1];
    const scoresMat = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
    const bases = baseScores(scoresMat, weightsArr);
    const probs = rankProbabilities(scoresMat, weightsArr, { runs: 2000, seed: 42 });

    const baseMap: Record<string, number> = {};
    const probMap: Record<string, number> = {};
    ROTATION_STRATEGIES.forEach((s, idx) => {
      baseMap[s.code] = Number(bases[idx].toFixed(4));
      probMap[s.code] = Number(probs.probabilityFirst[idx].toFixed(4));
    });

    const res = await logDecisionRecord({
      cellId: decCell,
      sessionLabel: decSessionLabel,
      loggedByRole: role,
      existingRotation: decRotation,
      selectedStrategyCode: decStrategy,
      farmAreaHa: Number(decAreaHa) || 2.0,
      priorityWeights: {
        water_efficiency: 0.4,
        soil_health: 0.3,
        erosion_protection: 0.2,
        income_market: 0.1,
      },
      computedBaseScores: baseMap,
      rankProbabilities: probMap,
      reasoningNotes: decNotes,
    });

    refreshPendingCount();
    await reloadData();
    setIsSubmittingDec(false);
    setDecNotes("");
    setStatusNotice(
      res.status === "submitted"
        ? `Logged ${decStrategy} (${role}) to Supabase decision_logs.`
        : `Queued ${decStrategy} decision offline; will auto-sync when connected.`,
    );
  };

  const handleSubmitOutcome = async (e: FormEvent) => {
    e.preventDefault();
    if (!outSummary.trim()) {
      return;
    }
    setIsSubmittingOut(true);
    setStatusNotice(null);

    const res = await submitOutcomeReport({
      cellId: outCell,
      seasonYear: 2026,
      seasonName: outSeason,
      outcomeSummary: outSummary.trim(),
      soilCoverObserved: outCover,
      waterStressObserved: outStress,
      pestOrDiseaseNotes: outPests,
    });

    refreshPendingCount();
    await reloadData();
    setIsSubmittingOut(false);
    setOutSummary("");
    setOutPests("");
    setStatusNotice(
      res.status === "submitted"
        ? "Submitted ungraded farmer_reported outcome for officer verification."
        : "Saved outcome report offline; queued for sync & officer review.",
    );
  };

  const handleGrade = async (
    outcomeId: string,
    grade: EvidenceGrade,
    eligible: boolean,
  ) => {
    if (!isPrivileged) {
      return;
    }

    // First synchronize through client cache + RLS update
    const res = await gradeOutcomeReport(
      outcomeId,
      grade,
      eligible,
      `officer-${role}`,
    );
    setOutcomes(res.reports);

    // Also run server-verified officer review + M8 Bayesian posterior calculation
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const apiRes = await fetch("/api/officer/review", {
        method: "POST",
        headers,
        body: JSON.stringify({
          outcomeId,
          evidenceGrade: grade,
          eligibleForModelUpdate: eligible,
          demoRole: role,
          reportsSnapshot: res.reports,
        }),
      });
      const apiJson = (await apiRes.json()) as {
        ok?: boolean;
        calibration?: M8CalibrationSummary;
      };
      if (apiRes.ok && apiJson.calibration) {
        setM8Summary(apiJson.calibration);
      } else {
        setM8Summary(computeM8CalibrationPreview(res.reports));
      }
    } catch {
      setM8Summary(computeM8CalibrationPreview(res.reports));
    }

    setStatusNotice(
      `Graded ${outcomeId} via /api/officer/review as ${grade} (M8 eligible: ${
        grade === "confounded_excluded" || grade === "farmer_reported"
          ? "No"
          : String(eligible)
      }).`,
    );
  };

  const handleNotifyFarmer = async (item: OutcomeReportRecord) => {
    setStatusNotice(null);
    try {
      const msg = `FieldShift [${item.cell_id}] Officer Review: Your ${item.season_year} ${item.season_name} report is graded "${item.evidence_grade}". Medaase!`;
      const res = await fetch("/api/messaging/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "both",
          to: farmerPhone,
          cellId: item.cell_id,
          customMessage: msg,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        deliveries?: Array<{ provider: string; mode: string }>;
      };
      if (res.ok && data.ok) {
        const modes = (data.deliveries ?? [])
          .map((d) => `${d.provider} (${d.mode})`)
          .join(", ");
        setStatusNotice(`Sent officer verification receipt to ${farmerPhone} via ${modes}.`);
      } else {
        setStatusNotice("Failed to dispatch receipt; check phone format.");
      }
    } catch {
      setStatusNotice("Network error dispatching farmer receipt.");
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
          </header>

          {/* Role Protection & Authentication Card */}
          <section className="sf-card" aria-labelledby="role-gate-heading">
            <div className="sf-card-header">
              <div>
                <h2 id="role-gate-heading" className="sf-card-title">
                  {t("roleStatusTitle")}
                </h2>
                <p className="sf-card-subtitle">
                  Verified server route <code>POST /api/officer/review</code> and Postgres RLS require <code>app_metadata.role</code> in{" "}
                  <code>extension_officer</code> or <code>agronomist</code>.
                </p>
              </div>
              <span
                className={`sf-tier-badge ${
                  isPrivileged ? "tier-established" : "tier-hypothesis"
                }`}
              >
                {isPrivileged ? (
                  <ShieldCheck size={14} aria-hidden="true" />
                ) : (
                  <Lock size={14} aria-hidden="true" />
                )}
                <span>{role.replace("_", " ")}</span>
              </span>
            </div>

            <div className="sf-officer-auth-grid">
              <div>
                <span className="sf-mini-label">
                  Interactive Role Switcher (Demo RBAC Preview)
                </span>
                <div
                  className="sf-role-buttons"
                  role="group"
                  aria-label="Select session role"
                >
                  <button
                    type="button"
                    aria-pressed={role === "farmer"}
                    onClick={() => setRole("farmer")}
                    className={`sf-filter-pill${role === "farmer" ? " is-active" : ""}`}
                  >
                    <Lock size={13} aria-hidden="true" />
                    <span>{t("roleFarmer")}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={role === "extension_officer"}
                    onClick={() => setRole("extension_officer")}
                    className={`sf-filter-pill${
                      role === "extension_officer" ? " is-active" : ""
                    }`}
                  >
                    <UserCheck size={13} aria-hidden="true" />
                    <span>{t("roleOfficer")}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={role === "agronomist"}
                    onClick={() => setRole("agronomist")}
                    className={`sf-filter-pill${role === "agronomist" ? " is-active" : ""}`}
                  >
                    <BadgeCheck size={13} aria-hidden="true" />
                    <span>{t("roleAgronomist")}</span>
                  </button>
                </div>

                <div className="sf-field mt-3 max-w-xs">
                  <label htmlFor="officer-notify-phone">Farmer SMS / WhatsApp Number</label>
                  <input
                    id="officer-notify-phone"
                    type="tel"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    className="input-select"
                  />
                </div>

                {!isPrivileged && (
                  <p className="sf-callout-warn mt-3">
                    <ShieldAlert size={16} aria-hidden="true" className="shrink-0" />
                    <span>{t("authLockedNotice")}</span>
                  </p>
                )}
              </div>

              <form onSubmit={(e) => void handleSupabaseLogin(e)} className="sf-auth-mini-form">
                <fieldset className="sf-fieldset">
                  <legend>Supabase Officer Sign-In</legend>
                  <div className="sf-field">
                    <label htmlFor={`${officerFormId}-email`}>Officer Email</label>
                    <input
                      id={`${officerFormId}-email`}
                      type="email"
                      autoComplete="username"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="officer@mofa.gov.gh"
                      className="input-select"
                    />
                  </div>
                  <div className="sf-field">
                    <label htmlFor={`${officerFormId}-password`}>Password</label>
                    <input
                      id={`${officerFormId}-password`}
                      type="password"
                      autoComplete="current-password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="input-select"
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Verify Officer JWT
                  </button>
                  {authMessage && <p className="text-xs text-[#275d38] mt-1">{authMessage}</p>}
                </fieldset>
              </form>
            </div>
          </section>

          {/* M8 Normal-Conjugate Calibration Impact Banner */}
          {m8Summary && (
            <section className="sf-card" aria-labelledby="m8-calibration-heading">
              <div className="sf-card-header">
                <div>
                  <span className="label">M8 Controlled Outcome Calibration</span>
                  <h2 id="m8-calibration-heading" className="sf-card-title">
                    Bayesian Posterior &amp; Uncertainty Shrinkage Preview
                  </h2>
                  <p className="sf-card-subtitle">
                    Only officer/expert-verified reports ({m8Summary.verifiedReportsApplied} applied,{" "}
                    {m8Summary.ignoredUnverifiedReports} unverified/confounded ignored) update strategy posteriors.
                  </p>
                </div>
                <Sparkles size={20} className="text-[#275d38]" aria-hidden="true" />
              </div>
              <div className="sf-scale-grid">
                {m8Summary.strategies.map((item) => (
                  <div key={item.code} className="sf-scale-item">
                    <div className="sf-scale-item-head">
                      <span className="sf-scale-ds">{item.name}</span>
                      <span className="sf-chip">{item.updatesApplied} obs</span>
                    </div>
                    <div className="sf-scale-meta">
                      <span>
                        Prior: {(item.priorBaseScore * 100).toFixed(1)} → Post:{" "}
                        <strong>{(item.posteriorBaseScore * 100).toFixed(1)}</strong>
                      </span>
                      <span>
                        σ: {item.priorSigmaMean.toFixed(2)} →{" "}
                        <strong>{item.posteriorSigmaMean.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Officer Action Tabs */}
          <div className="sf-view-bar">
            <div role="tablist" aria-label="Officer workflow sections" className="sf-tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "grade"}
                onClick={() => setActiveTab("grade")}
                className="sf-tab-btn"
              >
                <ClipboardCheck size={15} aria-hidden="true" />
                <span>{t("gradeTab")}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "log"}
                onClick={() => setActiveTab("log")}
                className="sf-tab-btn"
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{t("logTab")}</span>
              </button>
            </div>

            {statusNotice && (
              <p role="status" aria-live="polite" className="sf-status-toast">
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{statusNotice}</span>
              </p>
            )}
          </div>

          {activeTab === "grade" ? (
            <div className="sf-officer-split">
              <section className="sf-card" aria-labelledby="submit-outcome-heading">
                <h2 id="submit-outcome-heading" className="sf-card-title">
                  Submit Field Outcome Observation
                </h2>
                <p className="sf-card-subtitle mb-4">
                  Submitted as <code>farmer_reported</code> with <code>eligible_for_model_update = false</code> until graded by an officer.
                </p>

                <form onSubmit={(e) => void handleSubmitOutcome(e)} className="sf-form-stack">
                  <div className="sf-form-row">
                    <div className="sf-field">
                      <label htmlFor="out-cell">Pilot Cell</label>
                      <select
                        id="out-cell"
                        value={outCell}
                        onChange={(e) => setOutCell(e.target.value)}
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
                      <label htmlFor="out-season">Season</label>
                      <select
                        id="out-season"
                        value={outSeason}
                        onChange={(e) => setOutSeason(e.target.value)}
                        className="input-select"
                      >
                        <option value="Major">Major (Mar–Jul)</option>
                        <option value="Minor">Minor (Sep–Nov)</option>
                      </select>
                    </div>
                  </div>

                  <div className="sf-field">
                    <label htmlFor="out-cover">Observed Soil Cover</label>
                    <input
                      id="out-cover"
                      type="text"
                      value={outCover}
                      onChange={(e) => setOutCover(e.target.value)}
                      className="input-select"
                    />
                  </div>

                  <div className="sf-field">
                    <label htmlFor="out-stress">Observed Water Stress</label>
                    <input
                      id="out-stress"
                      type="text"
                      value={outStress}
                      onChange={(e) => setOutStress(e.target.value)}
                      className="input-select"
                    />
                  </div>

                  <div className="sf-field">
                    <label htmlFor="out-summary">
                      Field Outcome Summary <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="out-summary"
                      required
                      minLength={8}
                      rows={3}
                      value={outSummary}
                      onChange={(e) => setOutSummary(e.target.value)}
                      placeholder="Describe stand establishment, Mucuna/cowpea cover, runoff, or harvest outcome..."
                      className="input-textarea"
                    />
                  </div>

                  <div className="sf-field">
                    <label htmlFor="out-pests">Pest / Disease / Grazing Notes</label>
                    <input
                      id="out-pests"
                      type="text"
                      value={outPests}
                      onChange={(e) => setOutPests(e.target.value)}
                      className="input-select"
                    />
                  </div>

                  <button type="submit" disabled={isSubmittingOut} className="btn btn-primary btn-sm">
                    {isSubmittingOut ? "Saving..." : "Submit Outcome Report"}
                  </button>
                </form>
              </section>

              <section className="sf-card" aria-labelledby="grading-queue-heading">
                <h2 id="grading-queue-heading" className="sf-card-title">
                  Outcome Grading Queue ({outcomes.length})
                </h2>
                <div className="sf-queue-list">
                  {outcomes.map((item) => (
                    <OutcomeGradeCard
                      key={item.outcome_id}
                      item={item}
                      canGrade={isPrivileged}
                      saveLabel={t("saveGradeBtn")}
                      onGrade={handleGrade}
                      onNotify={handleNotifyFarmer}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="sf-officer-split">
              <section className="sf-card" aria-labelledby="log-decision-heading">
                <h2 id="log-decision-heading" className="sf-card-title">
                  Log Rotation Decision ({role})
                </h2>
                <form onSubmit={(e) => void handleSubmitDecision(e)} className="sf-form-stack mt-4">
                  <div className="sf-form-row">
                    <div className="sf-field">
                      <label htmlFor="dec-cell">Pilot Cell</label>
                      <select
                        id="dec-cell"
                        value={decCell}
                        onChange={(e) => setDecCell(e.target.value)}
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
                      <label htmlFor="dec-strategy">Selected Strategy</label>
                      <select
                        id="dec-strategy"
                        value={decStrategy}
                        onChange={(e) => setDecStrategy(e.target.value)}
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

                  <div className="sf-form-row">
                    <div className="sf-field">
                      <label htmlFor="dec-rotation">Existing Rotation</label>
                      <input
                        id="dec-rotation"
                        type="text"
                        required
                        value={decRotation}
                        onChange={(e) => setDecRotation(e.target.value)}
                        className="input-select"
                      />
                    </div>
                    <div className="sf-field">
                      <label htmlFor="dec-area">Farm Area (ha)</label>
                      <input
                        id="dec-area"
                        type="number"
                        step="0.5"
                        min="0.25"
                        value={decAreaHa}
                        onChange={(e) => setDecAreaHa(e.target.value)}
                        className="input-select"
                      />
                    </div>
                  </div>

                  <div className="sf-field">
                    <label htmlFor="dec-session">Co-op / Plot Session Label</label>
                    <input
                      id="dec-session"
                      type="text"
                      value={decSessionLabel}
                      onChange={(e) => setDecSessionLabel(e.target.value)}
                      className="input-select"
                    />
                  </div>

                  <div className="sf-field">
                    <label htmlFor="dec-notes">Extension Officer Reasoning Notes</label>
                    <textarea
                      id="dec-notes"
                      rows={3}
                      value={decNotes}
                      onChange={(e) => setDecNotes(e.target.value)}
                      placeholder="Local seed check, market spread, slope inspection..."
                      className="input-textarea"
                    />
                  </div>

                  <button type="submit" disabled={isSubmittingDec} className="btn btn-primary btn-sm">
                    {isSubmittingDec ? "Logging..." : t("submitDecisionBtn")}
                  </button>
                </form>
              </section>

              <section className="sf-card" aria-labelledby="recent-decisions-heading">
                <h2 id="recent-decisions-heading" className="sf-card-title">
                  Recent Decision Logs ({decisions.length})
                </h2>
                <div className="sf-queue-list">
                  {decisions.map((dec) => (
                    <article key={dec.decision_id} className="sf-queue-item">
                      <div className="sf-queue-head">
                        <span className="font-semibold text-[#0e1a12]">
                          {dec.cell_id} · {dec.selected_strategy_code}
                        </span>
                        <span className="sf-chip">{dec.logged_by_role.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm text-[#4a5e50] mt-1">
                        {dec.session_label || "Plot session"} · {dec.existing_rotation} ({dec.farm_area_ha ?? 2} ha)
                      </p>
                      {dec.reasoning_notes && (
                        <p className="text-xs text-[#4a5e50] mt-1">{dec.reasoning_notes}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function OutcomeGradeCard({
  item,
  canGrade,
  saveLabel,
  onGrade,
  onNotify,
}: {
  item: OutcomeReportRecord;
  canGrade: boolean;
  saveLabel: string;
  onGrade: (id: string, grade: EvidenceGrade, eligible: boolean) => Promise<void>;
  onNotify: (item: OutcomeReportRecord) => Promise<void>;
}) {
  const [grade, setGrade] = useState<EvidenceGrade>(item.evidence_grade);
  const [eligible, setEligible] = useState<boolean>(item.eligible_for_model_update);

  return (
    <article className="sf-queue-item">
      <div className="sf-queue-head">
        <span className="font-semibold text-[#0e1a12]">
          {item.cell_id} · {item.season_year} {item.season_name}
        </span>
        <span
          className={`sf-tier-badge ${
            item.eligible_for_model_update ? "tier-established" : "tier-hypothesis"
          }`}
        >
          {item.evidence_grade.replace("_", " ")}
        </span>
      </div>
      <p className="text-sm text-[#0e1a12] mt-1">{item.outcome_summary}</p>
      <p className="text-xs text-[#4a5e50] mt-1">
        Cover: {item.soil_cover_observed || "—"} · Stress: {item.water_stress_observed || "—"}
      </p>

      <div className="sf-grade-controls">
        <label className="sr-only" htmlFor={`grade-${item.outcome_id}`}>
          Evidence Grade
        </label>
        <select
          id={`grade-${item.outcome_id}`}
          disabled={!canGrade}
          value={grade}
          onChange={(e) => setGrade(e.target.value as EvidenceGrade)}
          className="input-select"
        >
          {GRADE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="sf-checkbox-inline">
          <input
            type="checkbox"
            disabled={!canGrade || grade === "confounded_excluded" || grade === "farmer_reported"}
            checked={
              grade === "confounded_excluded" || grade === "farmer_reported"
                ? false
                : eligible
            }
            onChange={(e) => setEligible(e.target.checked)}
          />
          <span>Eligible for M8 calibration</span>
        </label>

        <button
          type="button"
          disabled={!canGrade}
          onClick={() => void onGrade(item.outcome_id, grade, eligible)}
          className="btn btn-primary btn-sm"
        >
          {saveLabel}
        </button>

        <button
          type="button"
          onClick={() => void onNotify(item)}
          className="btn btn-secondary btn-sm"
        >
          <Send size={13} aria-hidden="true" />
          <span>Notify Farmer</span>
        </button>
      </div>
    </article>
  );
}
