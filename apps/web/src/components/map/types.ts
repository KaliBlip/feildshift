import type { MapLayerConfig, MapTimeStep, MapLayerId } from "@/lib/types";

export interface MapExplorerProps {
  center: [number, number];
  zoom: number;
  layers: MapLayerConfig[];
  timeSteps: MapTimeStep[];
  loadingState: "loading" | "ready" | "error" | "empty" | "unavailable";
  errorMessage?: string;
  farmBoundary?: GeoJSON.Feature | null;
  farmAreaHa?: number | null;
  onLayerToggle: (layerId: MapLayerId, enabled: boolean) => void;
  onTimeChange: (timeStep: MapTimeStep) => void;
  onViewportChange: (viewport: { center: [number, number]; zoom: number }) => void;
  enabledLayers: MapLayerId[];
  selectedTimeStep: MapTimeStep;
}

export interface LayerControlProps {
  layers: MapLayerConfig[];
  enabledLayers: MapLayerId[];
  onToggle: (layerId: MapLayerId, enabled: boolean) => void;
  loadingState: MapExplorerProps["loadingState"];
}

export interface TimeScrubberProps {
  timeSteps: MapTimeStep[];
  selectedTimeStep: MapTimeStep;
  onTimeChange: (timeStep: MapTimeStep) => void;
  playing: boolean;
  onPlayToggle: () => void;
  onStep: (direction: "prev" | "next") => void;
  loadingState: MapExplorerProps["loadingState"];
}

export interface MapLegendProps {
  layer: MapLayerConfig | null;
  timeStep: MapTimeStep;
  visible: boolean;
}

export interface MapInfoPanelProps {
  layer: MapLayerConfig | null;
  timeStep: MapTimeStep;
  coordinates?: [number, number];
  value?: number | null;
  farmAreaHa?: number | null;
}

export interface ViewportControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}