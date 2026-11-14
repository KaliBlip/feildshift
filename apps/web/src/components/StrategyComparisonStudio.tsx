"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Award,
  CheckCircle2,
  CloudRain,
  FileText,
  Layers,
  MessageSquareText,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sprout,
  Thermometer,
} from "lucide-react";
import { PRIORITY_PRESETS, SCORING_CRITERIA } from "@/constants/ashanti-pilot";
import { useAppShell } from "@/components/I18nProvider";
import { baseScores, rankProbabilities } from "@/lib/scoring";
import { estimateNitrogenOffsetSummary } from "@/lib/sms-export";
import {
  CLIMATE_STRESS_SCENARIOS,
  applyClimateParamsToStrategies,
  computeMinimaxRegretRankings,
  type ClimateStressId,
} from "@/lib/stress";
import { logDecisionRecord } from "@/lib/supabase";
import type { EvidencePassport, RotationStrategySpec } from "@/types/database";

interface StrategyComparisonStudioProps {
  cellId: string;
  farmAreaHa: number;
  strategies: RotationStrategySpec[];
  passports: EvidencePassport[];
  onOpenPassport: (passport: EvidencePassport) => void;
}

const DEFAULT_WEIGHTS: [number, number, number, number] = [0.4, 0.3, 0.2, 0.1];

export function StrategyComparisonStudio({
  cellId,
  farmAreaHa,
  strategies,
  passports,
  onOpenPassport,
}: StrategyComparisonStudioProps) {
  const t = useTranslations("compare");
  const { refreshPendingCount } = useAppShell();

  const [weights, setWeights] = useState<[number, number, number, number]>(DEFAULT_WEIGHTS);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [stressPreset, setStressPreset] = useState<ClimateStressId>("baseline");
  const [rainDeltaPct, setRainDeltaPct] = useState<number>(0);
  const [tempDeltaC, setTempDeltaC] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [existingRotation, setExistingRotation] = useState<string>("Maize -> Maize");
  const [logStatus, setLogStatus] = useState<string | null>(null);
  const [isLoggingCode, setIsLoggingCode] = useState<string | null>(null);

  const rainFactor = 1 + rainDeltaPct / 100;

  const selectScenarioPreset = (scenarioId: Exclude<ClimateStressId, "custom">) => {
    const found =
      CLIMATE_STRESS_SCENARIOS.find((s) => s.id === scenarioId) ?? CLIMATE_STRESS_SCENARIOS[0];
    setStressPreset(found.id);
    setRainDeltaPct(Math.round((found.rainFactor - 1) * 100));
    setTempDeltaC(found.tempDeltaC);
  };

  const baselineScores = useMemo(
    () =>
      baseScores(
        strategies.map((s) => [...s.criterionScores]),
        weights,
      ),
    [strategies, weights],
  );

  const stressedMatrix = useMemo(
    () => applyClimateParamsToStrategies(strategies, rainFactor, tempDeltaC),
    [strategies, rainFactor, tempDeltaC],
  );

  const stressedScores = useMemo(
    () => baseScores(stressedMatrix, weights),
    [stressedMatrix, weights],
  );

  const monteCarlo = useMemo(
    () => rankProbabilities(stressedMatrix, weights, { runs: 2000, seed: 42 }),
    [stressedMatrix, weights],
  );

  const minimax = useMemo(
    () => computeMinimaxRegretRankings(strategies, weights, baseScores),
    [strategies, weights],
  );

  const rankedRows = useMemo(() => {
    return strategies
      .map((strategy, idx) => {
        const score = stressedScores[idx] ?? 0;
        const baselineScore = baselineScores[idx] ?? score;
        const deltaPct = Math.round((score - baselineScore) * 100);
        const winProb = monteCarlo.probabilityFirst[idx] ?? 0;
        const meanRank = monteCarlo.meanRank[idx] ?? strategies.length;
        const nOffset = estimateNitrogenOffsetSummary(strategy);
        const regretRow = minimax.rowsByCode[strategy.code];
        const passport =
          passports.find((p) => p.strategyCode === strategy.code) ?? passports[0];

        return {
          strategy,
          scorePct: Math.round(score * 100),
          deltaPct,
          winProbPct: Math.round(winProb * 100),
          meanRank,
          worstCasePct: Math.round((regretRow?.worstCaseScore ?? score) * 100),
          maxRegretPct: Math.round((regretRow?.maxRegret ?? 0) * 100),
          isLowestRegret: minimax.lowestRegretCode === strategy.code,
          nOffset,
          passport,
          rawScore: score,
        };
      })
      .sort((a, b) => b.rawScore - a.rawScore);
  }, [strategies, stressedScores, baselineScores, monteCarlo, minimax, passports]);

  const handleLogStrategy = async (strategyCode: string) => {
    setIsLoggingCode(strategyCode);
    setLogStatus(null);
    const baseMap: Record<string, number> = {};
    const probMap: Record<string, number> = {};
    strategies.forEach((s, i) => {
      baseMap[s.code] = Number((stressedScores[i] ?? 0).toFixed(4));
      probMap[s.code] = Number((monteCarlo.probabilityFirst[i] ?? 0).toFixed(4));
    });

    const totalW = weights.reduce((a, b) => a + b, 0) || 1;
    const res = await logDecisionRecord({
      cellId,
      sessionLabel: `Web Studio (${stressPreset})`,
      loggedByRole: "farmer",
      existingRotation,
      selectedStrategyCode: strategyCode,
      farmAreaHa,
      priorityWeights: {
        water_efficiency: Number((weights[0] / totalW).toFixed(3)),
        soil_health: Number((weights[1] / totalW).toFixed(3)),
        erosion_protection: Number((weights[2] / totalW).toFixed(3)),
        income_market: Number((weights[3] / totalW).toFixed(3)),
      },
      computedBaseScores: baseMap,
      rankProbabilities: probMap,
      reasoningNotes: `Rain ${rainDeltaPct >= 0 ? "+" : ""}${rainDeltaPct}%, Temp +${tempDeltaC.toFixed(1)}°C`,
    });

    refreshPendingCount();
    setIsLoggingCode(null);
    setLogStatus(
      res.status === "submitted"
        ? `Saved ${strategyCode} decision log to Supabase.`
        : `Offline/queued: ${strategyCode} saved locally and will auto-sync online.`,
    );
  };

  return (
    <section className="sf-card" aria-labelledby="compare-studio-heading">
      <div className="sf-card-header">
        <div>
          <span className="label">{t("label")}</span>
          <h2 id="compare-studio-heading" className="sf-card-title">
            {t("title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-secondary btn-sm sf-no-print"
        >
          <Printer size={15} aria-hidden="true" />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Controls Grid: Priorities + Climate Stress Testing */}
      <div className="sf-studio-controls">
        <div className="sf-control-panel">
          <h3 className="sf-subpanel-title">{t("prioritiesTitle")}</h3>
          <div className="sf-preset-row">
            {PRIORITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={activePreset === preset.id}
                onClick={() => {
                  setActivePreset(preset.id);
                  setWeights([...preset.weights] as [number, number, number, number]);
                }}
                className={`sf-filter-pill${activePreset === preset.id ? " is-active" : ""}`}
              >
                {t(preset.labelKey)}
              </button>
            ))}
          </div>

          <div className="sf-sliders-stack">
            {SCORING_CRITERIA.map((criterion, idx) => (
              <div key={criterion} className="sf-slider-row">
                <div className="sf-slider-row-head">
                  <label htmlFor={`weight-slider-${idx}`}>{criterion}</label>
                  <span className="sf-tabular-badge">
                    {Math.round(
                      (weights[idx] / Math.max(0.01, weights.reduce((a, b) => a + b, 0))) * 100,
                    )}
                    %
                  </span>
                </div>
                <input
                  id={`weight-slider-${idx}`}
                  type="range"
                  min={0.05}
                  max={0.8}
                  step={0.05}
                  value={weights[idx]}
                  onChange={(e) => {
                    const next = [...weights] as [number, number, number, number];
                    next[idx] = Number(e.target.value);
                    setActivePreset("custom");
                    setWeights(next);
                  }}
                  className="slider-input"
                />
              </div>
            ))}
          </div>

          <div className="sf-inline-field">
            <label htmlFor="existing-rotation-select">Existing Rotation</label>
            <select
              id="existing-rotation-select"
              value={existingRotation}
              onChange={(e) => setExistingRotation(e.target.value)}
              className="input-select"
            >
              <option value="Maize -> Maize">Maize -&gt; Maize (Continuous)</option>
              <option value="Maize -> Cassava">Maize -&gt; Cassava</option>
              <option value="Maize -> Fallow">Maize -&gt; Bush Fallow</option>
            </select>
          </div>
        </div>

        <div className="sf-control-panel">
          <div className="sf-subpanel-head">
            <h3 className="sf-subpanel-title">{t("stressTitle")}</h3>
            <button
              type="button"
              onClick={() => selectScenarioPreset("baseline")}
              className="sf-link-reset"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>{t("resetStress")}</span>
            </button>
          </div>

          <span className="sf-mini-label">{t("analogLabel")}</span>
          <div className="sf-preset-row">
            {CLIMATE_STRESS_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                aria-pressed={stressPreset === sc.id}
                onClick={() => selectScenarioPreset(sc.id)}
                className={`sf-filter-pill${stressPreset === sc.id ? " is-active" : ""}`}
              >
                <span>{sc.shortLabel}</span>
                <small className="opacity-75 ml-1">({sc.analogYearTag})</small>
              </button>
            ))}
          </div>

          <div className="sf-sliders-stack">
            <div className="sf-slider-row">
              <div className="sf-slider-row-head">
                <label htmlFor="rain-stress-slider" className="flex items-center gap-1.5">
                  <CloudRain size={14} aria-hidden="true" />
                  <span>{t("rainSlider")}</span>
                </label>
                <span className="sf-tabular-badge">
                  {rainDeltaPct >= 0 ? `+${rainDeltaPct}%` : `${rainDeltaPct}%`}
                </span>
              </div>
              <input
                id="rain-stress-slider"
                type="range"
                min={-40}
                max={40}
                step={5}
                value={rainDeltaPct}
                onChange={(e) => {
                  setStressPreset("custom");
                  setRainDeltaPct(Number(e.target.value));
                }}
                className="slider-input"
              />
            </div>

            <div className="sf-slider-row">
              <div className="sf-slider-row-head">
                <label htmlFor="temp-stress-slider" className="flex items-center gap-1.5">
                  <Thermometer size={14} aria-hidden="true" />
                  <span>{t("tempSlider")}</span>
                </label>
                <span className="sf-tabular-badge">
                  {tempDeltaC >= 0 ? `+${tempDeltaC.toFixed(1)}°C` : `${tempDeltaC.toFixed(1)}°C`}
                </span>
              </div>
              <input
                id="temp-stress-slider"
                type="range"
                min={-1}
                max={3}
                step={0.5}
                value={tempDeltaC}
                onChange={(e) => {
                  setStressPreset("custom");
                  setTempDeltaC(Number(e.target.value));
                }}
                className="slider-input"
              />
            </div>
          </div>

          <div className="sf-minimax-callout">
            <Award size={16} aria-hidden="true" className="shrink-0 text-[#1a3d28]" />
            <span>
              <strong>{t("minimaxBadge")}:</strong>{" "}
              {strategies.find((s) => s.code === minimax.lowestRegretCode)?.name ?? minimax.lowestRegretCode}
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher: Cards vs Responsive Matrix Table */}
      <div className="sf-view-bar sf-no-print">
        <div role="tablist" aria-label="Comparison display mode" className="sf-tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "cards"}
            onClick={() => setViewMode("cards")}
            className="sf-tab-btn"
          >
            {t("viewCards")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "table"}
            onClick={() => setViewMode("table")}
            className="sf-tab-btn"
          >
            {t("viewTable")}
          </button>
        </div>

        {logStatus && (
          <p role="status" aria-live="polite" className="sf-status-toast">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>{logStatus}</span>
          </p>
        )}
      </div>

      {viewMode === "cards" ? (
        <div className="sf-strategy-cards-grid">
          {rankedRows.map((row, rankIdx) => (
            <article
              key={row.strategy.code}
              className={`sf-strategy-card${rankIdx === 0 ? " is-top" : ""}`}
            >
              <div className="sf-strategy-card-head">
                <div>
                  <div className="sf-badge-strip">
                    <span className="sf-rank-chip">#{rankIdx + 1}</span>
                    {row.strategy.isBaseline && (
                      <span className="baseline-badge">{t("baselineBadge")}</span>
                    )}
                    {row.isLowestRegret && (
                      <span className="sf-regret-badge">
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>{t("minimaxBadge")}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="sf-strategy-title">{row.strategy.name}</h3>
                  <p className="sf-strategy-seq">{row.strategy.sequence}</p>
                </div>

                <div className="sf-score-box">
                  <span className="sf-big-score">{row.scorePct}</span>
                  <span className="sf-score-denom">/100</span>
                  {row.deltaPct !== 0 && (
                    <span className={`sf-delta-tag ${row.deltaPct < 0 ? "is-neg" : "is-pos"}`}>
                      {row.deltaPct > 0 ? `+${row.deltaPct}` : row.deltaPct}
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Row */}
              <div className="sf-metrics-mini-grid">
                <div>
                  <span className="sf-mini-label">{t("winProb")}</span>
                  <strong>{row.winProbPct}%</strong>
                </div>
                <div>
                  <span className="sf-mini-label">{t("meanRank")}</span>
                  <strong>{row.meanRank.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="sf-mini-label">{t("worstCase")}</span>
                  <strong>{row.worstCasePct}/100</strong>
                </div>
                <div>
                  <span className="sf-mini-label">{t("ureaSaved")}</span>
                  <strong>
                    {row.nOffset.ureaBagsSavedPerHa > 0
                      ? `~${row.nOffset.ureaBagsSavedPerHa} bags/ha`
                      : "0"}
                  </strong>
                </div>
              </div>

              <div className="sf-extra-benefits">
                {row.nOffset.bareDaysAvoided > 0 && (
                  <span className="sf-chip">
                    <Layers size={12} aria-hidden="true" />
                    <span>
                      -{row.nOffset.bareDaysAvoided} {t("bareAvoided")}
                    </span>
                  </span>
                )}
                {row.nOffset.nFixKgHa > 0 && (
                  <span className="sf-chip">
                    <Sprout size={12} aria-hidden="true" />
                    <span>+{row.nOffset.nFixKgHa} kg N/ha</span>
                  </span>
                )}
              </div>

              <div className="sf-strategy-lists">
                <div>
                  <h4>Expected Benefits</h4>
                  <ul>
                    {row.strategy.expectedBenefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Information Gaps</h4>
                  <ul>
                    {row.strategy.informationGaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Risks Needing Local Review</h4>
                  <ul>
                    {row.strategy.risksNeedingReview.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="sf-card-actions sf-no-print">
                {row.passport && (
                  <button
                    type="button"
                    onClick={() => onOpenPassport(row.passport)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FileText size={14} aria-hidden="true" />
                    <span>{t("openPassport")}</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isLoggingCode === row.strategy.code}
                  onClick={() => void handleLogStrategy(row.strategy.code)}
                  className="btn btn-primary btn-sm"
                >
                  <span>{t("logDecision")}</span>
                </button>
                <Link
                  href={`/sms-ussd?cell=${encodeURIComponent(cellId)}&strategy=${encodeURIComponent(row.strategy.code)}`}
                  className="btn btn-ghost btn-sm"
                >
                  <MessageSquareText size={14} aria-hidden="true" />
                  <span>{t("sendToSms")}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Accessible responsive table adhering to modern-web-guidance responsive-table */
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="strategy-matrix-caption"
          className="sf-table-wrapper"
        >
          <table className="sf-responsive-table">
            <caption id="strategy-matrix-caption" className="sf-table-caption">
              Weighted strategy ranking for {cellId} (2,000 Monte Carlo runs)
            </caption>
            <thead>
              <tr>
                <th scope="col">Strategy</th>
                <th scope="col">{t("baseScore")}</th>
                <th scope="col">{t("winProb")}</th>
                <th scope="col">{t("meanRank")}</th>
                <th scope="col">{t("worstCase")}</th>
                <th scope="col">{t("ureaSaved")}</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {rankedRows.map((row) => (
                <tr key={row.strategy.code}>
                  <th scope="row">
                    <div>
                      <span className="font-semibold text-[#0e1a12]">{row.strategy.name}</span>
                      {row.isLowestRegret && (
                        <span className="sf-regret-badge ml-2">{t("minimaxBadge")}</span>
                      )}
                    </div>
                  </th>
                  <td>
                    {row.scorePct}/100{" "}
                    {row.deltaPct !== 0 && (
                      <small>({row.deltaPct > 0 ? `+${row.deltaPct}` : row.deltaPct})</small>
                    )}
                  </td>
                  <td>{row.winProbPct}%</td>
                  <td>{row.meanRank.toFixed(2)}</td>
                  <td>{row.worstCasePct}/100</td>
                  <td>
                    {row.nOffset.ureaBagsSavedPerHa > 0
                      ? `~${row.nOffset.ureaBagsSavedPerHa} bags/ha`
                      : "—"}
                  </td>
                  <td>
                    {row.passport && (
                      <button
                        type="button"
                        onClick={() => onOpenPassport(row.passport)}
                        className="btn btn-secondary btn-sm"
                      >
                        {t("openPassport")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
