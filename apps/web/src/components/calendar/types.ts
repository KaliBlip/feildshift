import type { AnomalyBadge, BareFieldPeriod, DekadObservation, SeasonDefinition } from "@/lib/types";

export interface CalendarProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
  anomalies: AnomalyBadge[];
  bareFieldPeriods: BareFieldPeriod[];
  loadingState: "loading" | "ready" | "error" | "empty" | "unavailable";
  errorMessage?: string;
  selectedDekad: string | null;
  onSelectDekad: (dekad: string | null) => void;
  farmAreaHa?: number | null;
  farmLabel?: string;
}

export interface ChartPanelProps {
  title: string;
  subtitle?: string;
  unit: string;
  selectedDekad: string | null;
  onSelectDekad: (dekad: string | null) => void;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export interface AnomalyBadgeProps {
  badge: AnomalyBadge;
  onClick?: () => void;
  variant?: "compact" | "full";
}

export interface BareFieldIndicatorProps {
  periods: BareFieldPeriod[];
  observations: DekadObservation[];
  selectedDekad: string | null;
  onSelectDekad: (dekad: string | null) => void;
}

export interface SeasonIndicatorProps {
  seasons: SeasonDefinition[];
  observations: DekadObservation[];
  height?: number;
}

export interface DekadTooltipPayload {
  dekad: string;
  dekadNumber: number;
  dateStart: string;
  dateEnd: string;
  ndvi?: number | null;
  ndviClimatology?: number | null;
  soilMoisture?: number | null;
  soilMoistureClimatology?: number | null;
  lstC?: number | null;
  lstClimatologyC?: number | null;
  quality?: DekadObservation["quality"];
  bareFieldPeriod?: BareFieldPeriod;
  [key: string]: unknown;
}

export function selectDekadFromChartLabel(
  activeLabel: string | number | undefined,
  observations: DekadObservation[],
  onSelectDekad: (dekad: string | null) => void,
): void {
  if (activeLabel === undefined) return;
  const observation = observations.find((item) => String(item.dekadNumber) === String(activeLabel));
  if (observation) onSelectDekad(observation.dekad);
}