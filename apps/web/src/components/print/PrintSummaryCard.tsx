"use client";

import { useRef, useCallback } from "react";
import type { DekadObservation, AnomalyBadge, BareFieldPeriod, SeasonDefinition } from "@/lib/types";
import type { DatasetScaleAssessment } from "@/lib/types";

interface PrintSummaryProps {
  observations: DekadObservation[];
  anomalies: AnomalyBadge[];
  bareFieldPeriods: BareFieldPeriod[];
  seasons: SeasonDefinition[];
  scaleAssessments: DatasetScaleAssessment[];
  farmAreaHa: number | null;
  farmLabel?: string;
  pilotLabel: string;
  year: number;
}
export function PrintSummaryCard({
  observations,
  anomalies,
  bareFieldPeriods,
  seasons,
  scaleAssessments,
  farmAreaHa,
  farmLabel,
  pilotLabel,
  year,
}: PrintSummaryProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Summary stats
  const totalRainfall = observations.reduce((s, o) => s + (o.rainfallMm ?? 0), 0);
  const meanNdvi =
    observations.filter((o) => o.ndvi !== null).length > 0
      ? observations
          .filter((o) => o.ndvi !== null)
          .reduce((s, o) => s + (o.ndvi ?? 0), 0) /
        observations.filter((o) => o.ndvi !== null).length
      : null;
  const maxLst = Math.max(
    ...observations.filter((o) => o.lstC !== null).map((o) => o.lstC!),
    0,
  );
  const meanSoilMoisture =
    observations.filter((o) => o.soilMoisture !== null).length > 0
      ? observations
          .filter((o) => o.soilMoisture !== null)
          .reduce((s, o) => s + (o.soilMoisture ?? 0), 0) /
        observations.filter((o) => o.soilMoisture !== null).length
      : null;
  const severeCount = anomalies.filter((a) => a.severity === "severe").length;
  const moderateCount = anomalies.filter((a) => a.severity === "moderate").length;
  const totalBareDekads = bareFieldPeriods.reduce((s, p) => s + p.durationDekads, 0);

  return (
    <>
      {/* Print button — hidden during print */}
      <div className="print-controls no-print">
        <button className="btn btn-secondary" onClick={handlePrint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print One-Page Summary
        </button>
        <span className="print-hint">Optimised for A4 / Letter — low bandwidth, no images</span>
      </div>

      {/* Printable summary — shown in full during print */}
      <div className="print-summary" ref={printRef}>
        <header className="print-header">
          <div className="print-logo">
            <strong>ScalarField</strong>
            <span className="print-badge">Environmental Intelligence Summary</span>
          </div>
          <div className="print-meta">
            <span>{pilotLabel}</span>
            <span>Season {year}</span>
            {farmAreaHa && <span>Farm: {farmAreaHa.toFixed(1)} ha{farmLabel ? ` (${farmLabel})` : ""}</span>}
          </div>
        </header>

        <div className="print-grid">
          {/* Key Metrics */}
          <section className="print-section">
            <h3 className="print-section-title">Season Overview</h3>
            <table className="print-table">
              <tbody>
                <tr>
                  <td className="print-metric-label">Total Season Rainfall</td>
                  <td className="print-metric-value">{totalRainfall.toFixed(0)} mm</td>
                  <td className="print-metric-source">IMERG v07</td>
                </tr>
                <tr>
                  <td className="print-metric-label">Mean NDVI</td>
                  <td className="print-metric-value">{meanNdvi !== null ? meanNdvi.toFixed(3) : "—"}</td>
                  <td className="print-metric-source">MODIS MOD13Q1</td>
                </tr>
                <tr>
                  <td className="print-metric-label">Peak LST</td>
                  <td className="print-metric-value">{maxLst > 0 ? `${maxLst.toFixed(1)}°C` : "—"}</td>
                  <td className="print-metric-source">MODIS (not air temp)</td>
                </tr>
                <tr>
                  <td className="print-metric-label">Mean Soil Moisture</td>
                  <td className="print-metric-value">
                    {meanSoilMoisture !== null ? `${meanSoilMoisture.toFixed(3)} m³/m³` : "—"}
                  </td>
                  <td className="print-metric-source">SMAP L3 (top 5cm)</td>
                </tr>
                <tr>
                  <td className="print-metric-label">Bare-Field Exposure</td>
                  <td className="print-metric-value">{totalBareDekads} dekad{totalBareDekads !== 1 ? "s" : ""}</td>
                  <td className="print-metric-source">NDVI &lt; 0.25</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Anomalies */}
          <section className="print-section">
            <h3 className="print-section-title">
              Environmental Anomalies
              <span className="print-count">
                {severeCount > 0 && <span className="print-severe">{severeCount} severe</span>}
                {moderateCount > 0 && <span className="print-moderate">{moderateCount} moderate</span>}
              </span>
            </h3>
            {anomalies.length === 0 ? (
              <p className="print-empty">No significant anomalies detected.</p>
            ) : (
              <ul className="print-anomaly-list">
                {anomalies.slice(0, 8).map((a) => (
                  <li key={a.id} className="print-anomaly-item" data-severity={a.severity}>
                    <span className="print-anomaly-dekad">
                      {a.dekadRange.start === a.dekadRange.end
                        ? a.dekadRange.start
                        : `${a.dekadRange.start}–${a.dekadRange.end}`}
                    </span>
                    <span className="print-anomaly-label">{a.label}</span>
                  </li>
                ))}
                {anomalies.length > 8 && (
                  <li className="print-more">+{anomalies.length - 8} more anomalies</li>
                )}
              </ul>
            )}
          </section>

          {/* Scale Honesty */}
          <section className="print-section">
            <h3 className="print-section-title">Data Resolution vs Farm Scale</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Resolution</th>
                  <th>Pixel</th>
                  <th>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {scaleAssessments.map((a) => (
                  <tr key={a.datasetName}>
                    <td>{a.datasetName}</td>
                    <td>{a.nativeResolutionKm < 1 ? `${(a.nativeResolutionKm * 1000).toFixed(0)} m` : `${a.nativeResolutionKm} km`}</td>
                    <td>{a.pixelFootprintHa.toFixed(a.pixelFootprintHa < 10 ? 2 : 0)} ha</td>
                    <td className={`print-fit-${a.fit}`}>
                      {a.fit === "suitable" ? "✓ Field-level" :
                       a.fit === "contextual" ? "⊘ Area context" :
                       a.fit === "insufficient" ? "✗ Regional only" : "? Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Seasons */}
          <section className="print-section">
            <h3 className="print-section-title">Agricultural Seasons</h3>
            <ul className="print-season-list">
              {seasons.map((s) => (
                <li key={s.key}>
                  <strong>{s.label}</strong> — Dekad {s.startDekad}–{s.endDekad}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="print-footer">
          <p>
            <strong>⚠ Illustrative data.</strong> Current values are synthetic placeholders
            for interface development. They do not represent actual NASA observations or
            scientific findings.
          </p>
          <p>
            <strong>Decision support only</strong> — supports local agricultural expertise
            and never replaces it. Requires agronomist or extension officer review before
            acting on any recommendation.
          </p>
          <p className="print-timestamp">
            Generated {new Date().toISOString().split("T")[0]} · ScalarField · Powered by NASA Earth Observations
          </p>
        </footer>
      </div>
    </>
  );
}
