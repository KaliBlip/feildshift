import type { DatasetScaleAssessment, ScaleFitCategory } from "@/lib/types";

export interface ScaleHonestyBannerProps {
  assessments: DatasetScaleAssessment[];
  farmAreaHa: number | null;
  farmLabel?: string;
  selectedLayerId?: string;
  onLayerSelect?: (layerId: string) => void;
  compact?: boolean;
}

export interface ScaleAssessmentCardProps {
  assessment: DatasetScaleAssessment;
  isSelected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export interface ScaleComparisonVisualProps {
  farmAreaHa: number;
  pixelFootprintHa: number;
  fit: ScaleFitCategory;
}

export interface ScaleFitBadgeProps {
  fit: ScaleFitCategory;
  size?: "small" | "medium" | "large";
}