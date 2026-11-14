"use client";

import { useEffect, useRef, useState } from "react";
import { InlineGlossary } from "@/components/ui";
import { dataAccess } from "@/lib/data-access";
import { createDecisionFixtures } from "@/lib/decision-data";
import type { DecisionData, StrategyComparison } from "@/lib/decision-data";

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function PassportDialog({
  strategy,
  onClose,
}: {
  strategy: StrategyComparison;
  onClose: () => void;
}) {
  const passport = strategy.passport;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  if (!passport) return null;

  return (
    <dialog
      ref={dialogRef}
      className="passport-dialog"
      aria-labelledby="passport-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="passport-dialog-header">
        <div>
          <span className="label">Evidence Passport</span>
          <h3 id="passport-title">{strategy.name}</h3>
        </div>
        <button type="button" className="passport-close" onClick={() => dialogRef.current?.close()} aria-label="Close Evidence Passport">
          ×
        </button>
      </div>

      <p className="passport-tier">{passport.evidenceTier.replaceAll("_", " ")}</p>
      <dl className="passport-facts">
        <div>
          <dt>Observation</dt>
          <dd>{passport.observationSummary}</dd>
        </div>
        <div>
          <dt>Key finding</dt>
          <dd>{passport.keyFinding}</dd>
        </div>
        <div>
          <dt>Datasets</dt>
          <dd>{passport.datasets.length ? passport.datasets.join(", ") : "Not listed"}</dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>{typeof passport.coverage === "string" ? passport.coverage : JSON.stringify(passport.coverage)}</dd>
        </div>
        <div>
          <dt>Method</dt>
          <dd>{passport.method}</dd>
        </div>
        <div>
          <dt>Uncertainty</dt>
          <dd>{passport.uncertainty}</dd>
        </div>
        <div>
          <dt>Scale limitation</dt>
          <dd>{passport.scaleHonestyNote}</dd>
        </div>
      </dl>

      <div className="passport-checklists">
        <div>
          <h4>Information gaps</h4>
          {passport.gaps.length ? (
            <ul>{passport.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
          ) : <p>None listed.</p>}
        </div>
        <div>
          <h4>Required local review</h4>
          {passport.requiredLocalReview.length ? (
            <ul>{passport.requiredLocalReview.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : <p>None listed.</p>}
          {passport.validatorRoles.length > 0 && (
            <p className="passport-roles">Review with: {passport.validatorRoles.join(", ")}</p>
          )}
        </div>
      </div>
    </dialog>
  );
}

function StrategyCard({
  strategy,
  onOpenPassport,
}: {
  strategy: StrategyComparison;
  onOpenPassport: (strategy: StrategyComparison) => void;
}) {
  const rankWidth = `${Math.max(0, Math.min(100, strategy.probabilityFirst * 100))}%`;

  return (
    <article className={`strategy-card${strategy.isBaseline ? " is-baseline" : ""}`}>
      <div className="strategy-card-heading">
        <div>
          {strategy.isBaseline && <span className="strategy-badge">Your baseline</span>}
          <h3>{strategy.name}</h3>
          <p className="strategy-sequence">{strategy.sequence}</p>
        </div>
        <div className="strategy-score" aria-label={`Weighted score ${percentage(strategy.baseScore)}`}>
          <strong>{percentage(strategy.baseScore)}</strong>
          <span>weighted fit</span>
        </div>
      </div>

      <div className="strategy-rank">
        <div className="strategy-rank-label">
          <span>Ranks first in simulations</span>
          <strong>{percentage(strategy.probabilityFirst)}</strong>
        </div>
        <div className="strategy-rank-track" aria-hidden="true">
          <span style={{ width: rankWidth }} />
        </div>
        <p>Average rank: {strategy.meanRank.toFixed(1)} of 4</p>
      </div>

      <div className="strategy-criteria">
        <h4>Priority fit</h4>
        {strategy.criteria.map((criterion) => (
          <div className="criterion-row" key={criterion.key}>
            <span>{criterion.label}</span>
            <span className="criterion-track" aria-hidden="true">
              <span style={{ width: percentage(criterion.score) }} />
            </span>
            <strong>{percentage(criterion.score)}</strong>
          </div>
        ))}
      </div>

      <div className="strategy-card-lists">
        <div>
          <h4>Expected benefits</h4>
          <ul>{strategy.expectedBenefits.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h4>Gaps &amp; risks to review</h4>
          <ul>
            {[...strategy.gaps, ...strategy.risks].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <button
        type="button"
        className="passport-open-button"
        onClick={() => onOpenPassport(strategy)}
        disabled={!strategy.passport}
      >
        {strategy.passport ? "View Evidence Passport" : "Evidence Passport unavailable"}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export function StrategyComparisonSection() {
  const [data, setData] = useState<DecisionData>(createDecisionFixtures);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataAccess.fetchDecisionData().then((decisionData) => {
      if (active) setData(decisionData);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="decision-section section" id="strategies" aria-labelledby="strategies-heading">
      <div className="container">
        <div className="section-header">
          <span className="label">Decision Support · {data.cellLabel}</span>
          <div className="section-divider" />
          <h2 id="strategies-heading" className="display-lg">Compare rotation strategies</h2>
          <p className="body-lg">
            Compare weighted priorities and how often each strategy ranks first under uncertainty.
            Simulation rankings are not yield forecasts. Review the evidence, local gaps, and risks
            with a local advisor before acting. Terms such as{" "}
            <InlineGlossary term="NDVI">NDVI</InlineGlossary>,{" "}
            <InlineGlossary term="ET">ET</InlineGlossary>,{" "}
            <InlineGlossary term="Dry spell">dry spell</InlineGlossary>, and{" "}
            <InlineGlossary term="Bare-field period">bare-field period</InlineGlossary> are explained inline.
          </p>
        </div>

        <div className={`decision-source ${data.source === "fixtures" ? "is-fixture" : ""}`} role="status">
          {loading
            ? "Loading strategy data…"
            : data.source === "fixtures"
              ? "Illustrative fixture data — scores, benefits, and probabilities are synthetic examples."
              : "Precomputed Supabase strategy and evidence data."}
        </div>

        {data.strategies.length === 0 ? (
          <div className="decision-empty">
            <h3>No strategies published for this pilot cell yet</h3>
            <p>Strategy comparisons will appear here when precomputed scores are available.</p>
          </div>
        ) : (
          <>
            <div className="strategy-grid">
              {data.strategies.map((strategy) => (
                <StrategyCard key={strategy.code} strategy={strategy} onOpenPassport={setSelectedStrategy} />
              ))}
            </div>
            <p className="decision-method-note">
              Weighted fit combines the listed priority criteria. Rank probabilities are estimated
              with the Monte Carlo simulation using the stored score uncertainty and default weights.
              They describe ranking stability, not the chance of a yield outcome.
            </p>
          </>
        )}
      </div>
      {selectedStrategy && (
        <PassportDialog strategy={selectedStrategy} onClose={() => setSelectedStrategy(null)} />
      )}
    </section>
  );
}
