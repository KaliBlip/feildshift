"use client";

import type { AnomalyBadge, AnomalyCategory, AnomalySeverity } from "@/lib/types";

const CATEGORY_LABELS: Record<AnomalyCategory, string> = {
  "rainfall-deficit": "Rainfall Deficit",
  "rainfall-excess": "Rainfall Excess",
  "high-temperature": "High Temperature",
  "soil-moisture-deficit": "Soil Moisture Deficit",
  "soil-moisture-excess": "Soil Moisture Excess",
  "vegetation-decline": "Vegetation Decline",
  "bare-field-exposure": "Bare-Field Exposure",
  "compound-anomaly": "Compound Anomaly",
};

const SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  info: "Informational",
  moderate: "Moderate",
  severe: "Severe",
};

const CATEGORY_ICONS: Record<AnomalyCategory, React.ReactNode> = {
  "rainfall-deficit": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M4 6l4 4 4-4" /></svg>,
  "rainfall-excess": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14V2M4 10l4-4 4 4" /></svg>,
  "high-temperature": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a4 4 0 0 1 4 4v6M8 2a4 4 0 0 0-4 4v6" /><path d="M4 8h8M6 10h4" /></svg>,
  "soil-moisture-deficit": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12h8M4 8h8M6 4h4" /></svg>,
  "soil-moisture-excess": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 4v8M4 8h8M6 12h4" /></svg>,
  "vegetation-decline": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14V2M4 10l4-4 4 4" /></svg>,
  "bare-field-exposure": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="12" height="8" rx="1" /><path d="M4 10h8M6 14V6" /></svg>,
  "compound-anomaly": <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4v8M4 8h8" /></svg>,
};

const SEVERITY_COLORS: Record<AnomalySeverity, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: "#E8F0EB", border: "#8AAB8E", text: "#1A3D28", icon: "#4A7C5E" },
  moderate: { bg: "#FFF3E0", border: "#DC6B2F", text: "#8B4513", icon: "#DC6B2F" },
  severe: { bg: "#FDEDEC", border: "#C62828", text: "#8B0000", icon: "#C62828" },
};

interface AnomalyBadgeProps {
  badge: AnomalyBadge;
  onClick?: () => void;
  variant?: "compact" | "full";
}

export function AnomalyBadgeComponent({ badge, onClick, variant = "full" }: AnomalyBadgeProps) {
  const categoryColors = SEVERITY_COLORS[badge.severity];
  const categoryLabel = CATEGORY_LABELS[badge.category];
  const severityLabel = SEVERITY_LABELS[badge.severity];
  const Icon = CATEGORY_ICONS[badge.category];

  if (variant === "compact") {
    return (
      <button
        className="anomaly-badge compact"
        onClick={onClick}
        style={{
          backgroundColor: categoryColors.bg,
          borderColor: categoryColors.border,
          color: categoryColors.text,
        }}
        title={`${categoryLabel} (${severityLabel}): ${badge.label}`}
        aria-label={`${categoryLabel}, ${severityLabel} severity`}
      >
        <span className="badge-icon" style={{ color: categoryColors.icon }}>
          {Icon}
        </span>
        <span className="badge-label">{badge.label}</span>
        <span className="badge-severity">{severityLabel}</span>
      </button>
    );
  }

  return (
    <article
      className="anomaly-badge full"
      onClick={onClick}
      style={{
        borderColor: categoryColors.border,
      }}
      aria-labelledby={`badge-${badge.id}-title`}
    >
      <div className="badge-header">
        <div className="badge-icon-wrapper" style={{ backgroundColor: categoryColors.icon }}>
          {Icon}
        </div>
        <div className="badge-title-group">
          <h4 id={`badge-${badge.id}-title`} className="badge-category">{categoryLabel}</h4>
          <span className="badge-severity-tag" style={{ backgroundColor: categoryColors.bg, color: categoryColors.text, borderColor: categoryColors.border }}>
            {severityLabel}
          </span>
        </div>
      </div>
      <p className="badge-label">{badge.label}</p>
      <div className="badge-meta">
        <span className="badge-period">Dekad {badge.dekadRange.start} – {badge.dekadRange.end}</span>
        <span className="badge-variables">{badge.variables.join(", ")}</span>
      </div>
      <details className="badge-evidence">
        <summary>Evidence & Methodology</summary>
        <div className="badge-evidence-content">
          <p className="badge-observation">{badge.observation}</p>
          <p className="badge-evidence-text">{badge.evidence}</p>
        </div>
      </details>
    </article>
  );
}

export function AnomalyBadgeList({ badges, onClick }: { badges: AnomalyBadge[]; onClick?: (badge: AnomalyBadge) => void }) {
  if (badges.length === 0) {
    return <p className="anomaly-none">No anomalies detected for the current period.</p>;
  }

  return (
    <div className="anomaly-badge-list" role="list" aria-label="Environmental anomalies">
      {badges.map((badge) => (
        <AnomalyBadgeComponent key={badge.id} badge={badge} onClick={() => onClick?.(badge)} variant="full" />
      ))}
    </div>
  );
}

export function AnomalyBadgeSummary({ badges }: { badges: AnomalyBadge[] }) {
  const counts = badges.reduce(
    (acc, badge) => {
      acc[badge.severity] = (acc[badge.severity] || 0) + 1;
      return acc;
    },
    {} as Record<AnomalySeverity, number>
  );

  return (
    <div className="anomaly-summary" role="status" aria-label="Anomaly summary">
      {(["severe", "moderate", "info"] as AnomalySeverity[]).map((severity) => {
        const count = counts[severity] || 0;
        if (count === 0) return null;
        const colors = SEVERITY_COLORS[severity];
        return (
          <span key={severity} className="summary-item" style={{ borderColor: colors.border }}>
            <span className="summary-count" style={{ color: colors.text }}>{count}</span>
            <span className="summary-label" style={{ color: colors.text }}>{SEVERITY_LABELS[severity]}</span>
          </span>
        );
      })}
    </div>
  );
}