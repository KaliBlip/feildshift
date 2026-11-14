"use client";

import { useState, useMemo } from "react";
import { assessScale, DATASET_RESOLUTIONS_KM } from "@/lib/constants";
import type { ScaleHonestyBannerProps, ScaleAssessmentCardProps, ScaleComparisonVisualProps, ScaleFitBadgeProps } from "./types";
import type { DatasetScaleAssessment, ScaleFitCategory, MapLayerId } from "@/lib/types";

const FIT_CONFIG: Record<ScaleFitCategory, { label: string; description: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  suitable: {
    label: "Suitable for field-level analysis",
    description: "Multiple pixels fall within the farm boundary. This dataset can resolve field-specific conditions.",
    color: "#2E7D32",
    bgColor: "#E8F5E9",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8" />
        <path d="M7 10l3 3 5-5" />
      </svg>
    ),
  },
  contextual: {
    label: "Regional context only",
    description: "Each pixel covers an area larger than the farm. Values represent the broader region, not the farm alone.",
    color: "#F57C00",
    bgColor: "#FFF3E0",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 7v6M7 10h6" />
      </svg>
    ),
  },
  insufficient: {
    label: "Insufficient spatial detail",
    description: "Each pixel is much larger than the farm. This dataset cannot resolve farm-specific conditions.",
    color: "#C62828",
    bgColor: "#FDEDEC",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 7v6" />
      </svg>
    ),
  },
  unknown: {
    label: "Scale assessment unavailable",
    description: "Farm area is not specified. Cannot assess whether this dataset's resolution is appropriate.",
    color: "#4A5E50",
    bgColor: "#F0F2F1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 7h.01M10 12h.01" />
      </svg>
    ),
  },
};

const LAYER_LABELS: Record<MapLayerId, string> = {
  ndvi: "NDVI (MODIS)",
  "soil-moisture": "Soil Moisture (SMAP)",
  rainfall: "Rainfall (IMERG)",
  srtm: "Terrain (SRTM)",
};

function ScaleFitBadge({ fit, size = "medium" }: ScaleFitBadgeProps) {
  const config = FIT_CONFIG[fit];
  const sizes = {
    small: { padding: "0.25rem 0.5rem", fontSize: "0.7rem", iconSize: 14 },
    medium: { padding: "0.375rem 0.75rem", fontSize: "0.75rem", iconSize: 16 },
    large: { padding: "0.5rem 1rem", fontSize: "0.875rem", iconSize: 20 },
  };
  const s = sizes[size];

  return (
    <span
      className="scale-fit-badge"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.color,
        padding: s.padding,
        fontSize: s.fontSize,
      }}
    >
      <span className="badge-icon" style={{ width: s.iconSize, height: s.iconSize }}>
        {config.icon}
      </span>
      <span className="badge-label">{config.label}</span>
    </span>
  );
}

function ScaleComparisonVisual({ farmAreaHa, pixelFootprintHa, fit }: ScaleComparisonVisualProps) {
  const ratio = pixelFootprintHa / farmAreaHa;
  const farmSize = Math.max(1, Math.min(100, 100 / Math.max(1, ratio)));
  const pixelSize = 100 - farmSize;

  return (
    <div className="scale-comparison-visual" role="img" aria-label={`Farm area (${farmAreaHa.toFixed(1)} ha) vs pixel footprint (${pixelFootprintHa.toFixed(1)} ha)`}>
      <div className="comparison-bars">
        <div className="bar farm" style={{ width: `${farmSize}%` }}>
          <span className="bar-label">Farm</span>
          <span className="bar-value">{farmAreaHa.toFixed(1)} ha</span>
        </div>
        <div className="bar pixel" style={{ width: `${pixelSize}%` }}>
          <span className="bar-label">Pixel</span>
          <span className="bar-value">{pixelFootprintHa.toFixed(1)} ha</span>
        </div>
      </div>
      <div className="comparison-ratio">
        1 pixel ≈ {ratio.toFixed(1)}× farm area
      </div>
    </div>
  );
}

function ScaleAssessmentCard({ assessment, isSelected, onSelect, compact }: ScaleAssessmentCardProps) {
  const config = FIT_CONFIG[assessment.fit];
  const layerLabel = LAYER_LABELS[assessment.datasetName as keyof typeof LAYER_LABELS] || assessment.datasetName;

  return (
    <article
      className={`scale-assessment-card ${isSelected ? "selected" : ""} ${assessment.fit}`}
      onClick={onSelect}
      style={{ borderColor: isSelected ? config.color : config.bgColor }}
    >
      <div className="card-header">
        <div className="card-title-group">
          <h4 className="card-title">{layerLabel}</h4>
          <ScaleFitBadge fit={assessment.fit} size={compact ? "small" : "medium"} />
        </div>
        {compact ? null : (
          <div className="card-resolution">
            {assessment.nativeResolutionKm} km resolution
          </div>
        )}
      </div>

      {!compact && (
        <ScaleComparisonVisual
          farmAreaHa={assessment.farmAreaHa || 0}
          pixelFootprintHa={assessment.pixelFootprintHa}
          fit={assessment.fit}
        />
      )}

      <div className="card-details">
        <div className="detail-row">
          <span className="detail-label">Pixel footprint:</span>
          <span className="detail-value">{assessment.pixelFootprintHa.toFixed(1)} ha</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Farm area:</span>
          <span className="detail-value">{assessment.farmAreaHa ? assessment.farmAreaHa.toFixed(1) + " ha" : "Not specified"}</span>
        </div>
        {assessment.pixelToFarmRatio && (
          <div className="detail-row">
            <span className="detail-label">Pixel-to-farm ratio:</span>
            <span className="detail-value">{assessment.pixelToFarmRatio.toFixed(1)}×</span>
          </div>
        )}
      </div>

      {!compact && (
        <details className="card-limitation">
          <summary>Limitations & Interpretation</summary>
          <p>{assessment.limitation}</p>
        </details>
      )}
    </article>
  );
}

export function ScaleHonestyBanner({
  assessments,
  farmAreaHa,
  farmLabel,
  selectedLayerId,
  onLayerSelect,
  compact = false,
}: ScaleHonestyBannerProps) {
  const [expanded, setExpanded] = useState(!compact);

  const sortedAssessments = useMemo(() => {
    const fitOrder: ScaleFitCategory[] = ["suitable", "contextual", "insufficient", "unknown"];
    return [...assessments].sort((a, b) => fitOrder.indexOf(a.fit) - fitOrder.indexOf(b.fit));
  }, [assessments]);

  if (assessments.length === 0) {
    return (
      <div className="scale-honesty-banner empty">
        <div className="banner-content">
          <div className="banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="banner-text">
            <h3>Scale-Honesty Assessment</h3>
            <p>No environmental datasets available for scale assessment.</p>
          </div>
        </div>
        {farmAreaHa === null && (
          <div className="banner-action">
            <p className="farm-area-notice">
              Farm area not specified. Provide a farm area to enable scale-honesty assessments.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className={`scale-honesty-banner ${expanded ? "expanded" : "collapsed"} ${compact ? "compact" : ""}`} aria-labelledby="scale-honesty-heading">
      <div className="banner-header" onClick={() => !compact && setExpanded(!expanded)}>
        <div className="banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12h6M12 9v6" />
          </svg>
        </div>
        <div className="banner-title-group">
          <h3 id="scale-honesty-heading" className="banner-title">Scale-Honesty Banner</h3>
          <p className="banner-subtitle">
            {farmAreaHa ? `Farm: ${farmAreaHa.toFixed(1)} ha${farmLabel ? ` (${farmLabel})` : ""}` : "Farm area not specified"}
          </p>
        </div>
        {!compact && (
          <button
            className="banner-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="scale-assessments"
          >
            {expanded ? "Hide details" : "Show details"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={expanded ? "M10 10L6 6M10 6L6 10" : "M6 6L10 10M6 10L10 6"} />
            </svg>
          </button>
        )}
      </div>

      <div id="scale-assessments" className="banner-assessments" hidden={!expanded && !compact}>
        {sortedAssessments.map((assessment) => (
          <ScaleAssessmentCard
            key={assessment.datasetName}
            assessment={assessment}
            isSelected={selectedLayerId === assessment.datasetName}
            onSelect={() => onLayerSelect?.(assessment.datasetName)}
            compact={compact}
          />
        ))}

        <div className="banner-footer">
          <p className="banner-disclaimer">
            <strong>Important:</strong> These assessments compare the native spatial resolution of each satellite product
            against your farm area. Visual zooming or interpolation does not improve the underlying data resolution.
            Coarse-resolution products provide regional context only and cannot resolve field-specific conditions.
          </p>
          {farmAreaHa === null && (
            <p className="banner-notice">
              Farm area not provided. Scale assessments require a known farm boundary or area.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ScaleHonestyInline({ farmAreaHa, layerId, layerConfig, compact = true }: {
  farmAreaHa: number | null;
  layerId: string;
  layerConfig: { resolutionKm: number; source: string; version?: string; label: string } | null;
  compact?: boolean;
}) {
  if (!farmAreaHa || !layerConfig) {
    return (
      <div className="scale-honesty-inline unavailable">
        <span className="inline-badge unknown">Scale unknown</span>
        <span className="inline-text">Farm area or layer info missing</span>
      </div>
    );
  }

  const assessment = assessScale(layerId, layerConfig.resolutionKm, farmAreaHa);
  const config = FIT_CONFIG[assessment.fit];

  return (
    <div className="scale-honesty-inline" style={{ borderColor: config.color }}>
      <ScaleFitBadge fit={assessment.fit} size="small" />
      <span className="inline-text">
        {layerConfig.label}: {config.label} ({layerConfig.resolutionKm} km, ~{assessment.pixelFootprintHa.toFixed(0)} ha/pixel)
      </span>
    </div>
  );
}