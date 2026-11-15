"use client";

import { useRef, useState, useCallback } from "react";
import MapGL, { Layer, Source } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, MapRef, ViewStateChangeEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}
import type {
  LayerControlProps,
  MapExplorerProps,
  MapInfoPanelProps,
  MapLegendProps,
  TimeScrubberProps,
  ViewportControlsProps,
} from "./types";
import type { MapLayerId } from "@/lib/types";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-basemap",
      type: "raster",
      source: "osm-tiles",
      paint: {
        "raster-opacity": 0.9,
      },
    },
  ],
};

const LAYER_FILL_COLORS: Record<MapLayerId, string> = {
  ndvi: "#1FB26B",
  "soil-moisture": "#3670FF",
  rainfall: "#2458DB",
  srtm: "#F9D601",
};

const ASHANTI_CELL_GRID_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { cell_id: "ASH_R05_C05", value: 0.62 },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[[-1.46, 6.84], [-1.39, 6.84], [-1.39, 6.91], [-1.46, 6.91], [-1.46, 6.84]]],
      },
    },
  ],
};

const ATTRIBUTIONS: Record<MapLayerId, string> = {
  ndvi: '© NASA MODIS MOD13Q1 v061',
  "soil-moisture": '© NASA SMAP L3 v8',
  rainfall: '© NASA GPM IMERG v07',
  srtm: '© NASA SRTM v3.0',
};

const MAP_LAYER_IDS = ["ndvi", "soil-moisture", "rainfall", "srtm"] as const satisfies readonly MapLayerId[];

function isMapLayerId(value: string): value is MapLayerId {
  return MAP_LAYER_IDS.some((layerId) => layerId === value);
}

export function MapExplorer({
  center,
  zoom,
  layers,
  timeSteps,
  loadingState,
  errorMessage,
  farmBoundary,
  farmAreaHa,
  onLayerToggle,
  onTimeChange,
  onViewportChange,
  enabledLayers,
  selectedTimeStep,
}: MapExplorerProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState({ longitude: center[0], latitude: center[1], zoom });
  const [hoveredValue, setHoveredValue] = useState<{ layer: MapLayerId; value: number | null; coordinates: [number, number] } | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const handleViewportChange = useCallback(
    (event: ViewStateChangeEvent) => {
      const { longitude, latitude, zoom: nextZoom } = event.viewState;
      setViewport({ longitude, latitude, zoom: nextZoom });
      onViewportChange({ center: [longitude, latitude], zoom: nextZoom });
    },
    [onViewportChange]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const features = map.queryRenderedFeatures(event.point);
      if (features.length > 0) {
        const feature = features[0];
        const layerName = feature.layer.id;
        if (!isMapLayerId(layerName)) return;
        const rawValue = feature.properties?.value;
        const parsedValue = typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string" && rawValue.trim() !== ""
            ? Number(rawValue)
            : null;
        const value = parsedValue !== null && Number.isFinite(parsedValue) ? parsedValue : null;
        const coordinates: [number, number] = [event.lngLat.lng, event.lngLat.lat];

        if (enabledLayers.includes(layerName)) {
          setHoveredValue({ layer: layerName, value, coordinates });
          setShowInfoPanel(true);
        }
      }
    },
    [enabledLayers]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredValue(null);
    setShowInfoPanel(false);
  }, []);

  if (loadingState === "loading") {
    return (
      <div className="map-explorer loading" style={{ height: "600px", position: "relative" }}>
        <div className="map-loading-overlay" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="map-explorer error" style={{ height: "600px", position: "relative" }}>
        <div className="map-error-overlay" role="alert">
          <h3>Unable to load map</h3>
          <p>{errorMessage || "An unknown error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-explorer" style={{ height: "600px", position: "relative" }}>
      <MapGL
        ref={mapRef}
        {...viewport}
        onMove={handleViewportChange}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        {farmBoundary && (
          <Source id="farm-boundary" type="geojson" data={farmBoundary}>
            <Layer
              id="farm-boundary-line"
              type="line"
              paint={{ "line-color": "#1A3D28", "line-width": 3, "line-dasharray": [8, 4] }}
            />
            <Layer
              id="farm-boundary-fill"
              type="fill"
              paint={{ "fill-color": "#1A3D28", "fill-opacity": 0.1 }}
            />
          </Source>
        )}
        {enabledLayers.map((layerId) => {
          const layerConfig = layers.find((l) => l.id === layerId);
          if (!layerConfig) return null;

          return (
            <Source key={layerId} id={`src-${layerId}`} type="geojson" data={ASHANTI_CELL_GRID_GEOJSON}>
              <Layer
                id={layerId}
                type="fill"
                paint={{
                  "fill-color": LAYER_FILL_COLORS[layerId] ?? "#3670FF",
                  "fill-opacity": 0.28,
                  "fill-outline-color": "#171717",
                }}
              />
            </Source>
          );
        })}

        <div className="map-controls" style={{ pointerEvents: "none" }}>
          <div className="control-group top-left" style={{ pointerEvents: "auto" }}>
            <LayerControl
              layers={layers}
              enabledLayers={enabledLayers}
              onToggle={onLayerToggle}
              loadingState={loadingState}
            />
          </div>

          <div className="control-group bottom-center" style={{ pointerEvents: "auto" }}>
            <TimeScrubber
              timeSteps={timeSteps}
              selectedTimeStep={selectedTimeStep}
              onTimeChange={onTimeChange}
              playing={false}
              onPlayToggle={() => {}}
              onStep={() => {}}
              loadingState={loadingState}
            />
          </div>

          <div className="control-group top-right" style={{ pointerEvents: "auto" }}>
            <ViewportControls
              zoom={Math.round(viewport.zoom)}
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
              onResetView={() => {
                mapRef.current?.flyTo({ center, zoom: 10, essential: true });
              }}
            />
          </div>

          {showInfoPanel && hoveredValue && (
            <div className="control-group info-panel" style={{ pointerEvents: "auto" }}>
              <MapInfoPanel
                layer={layers.find((l) => l.id === hoveredValue.layer) || null}
                timeStep={selectedTimeStep}
                coordinates={hoveredValue.coordinates}
                value={hoveredValue.value}
                farmAreaHa={farmAreaHa}
              />
            </div>
          )}

          <div className="control-group bottom-left" style={{ pointerEvents: "auto" }}>
            <MapLegend
              layer={layers.find((l) => l.id === enabledLayers[0]) || null}
              timeStep={selectedTimeStep}
              visible={enabledLayers.length > 0}
            />
          </div>
        </div>
      </MapGL>
    </div>
  );
}

function LayerControl({ layers, enabledLayers, onToggle, loadingState }: LayerControlProps) {
  return (
    <div className="map-control-panel layer-control">
      <h4>Map Layers</h4>
      <ul role="list" aria-label="Environmental map layers">
        {layers.map((layer) => (
          <li key={layer.id}>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={enabledLayers.includes(layer.id)}
                onChange={(e) => onToggle(layer.id, e.target.checked)}
                disabled={loadingState === "loading"}
              />
              <span className="toggle-slider" />
              <span className="layer-label">
                <span className="layer-color" style={{ background: layer.colorRamp[3]?.[1] || "#8AAB8E" }} />
                {layer.label}
              </span>
            </label>
            {enabledLayers.includes(layer.id) && (
              <span className="layer-meta">
                {layer.resolutionKm} km resolution · {layer.source} {layer.version ? `v${layer.version}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimeScrubber({ timeSteps, selectedTimeStep, onTimeChange, playing, onPlayToggle, onStep, loadingState }: TimeScrubberProps) {
  const currentIndex = timeSteps.findIndex((t) => t.date === selectedTimeStep.date);

  return (
    <div className="map-control-panel time-scrubber">
      <div className="time-display">
        <span className="time-label">{selectedTimeStep.label}</span>
        <span className="time-index">{currentIndex + 1} / {timeSteps.length}</span>
      </div>
      <div className="time-controls">
        <button
          className="time-btn"
          onClick={() => onStep("prev")}
          disabled={currentIndex === 0 || loadingState === "loading"}
          aria-label="Previous time step"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4" /></svg>
        </button>
        <button
          className={`time-btn play-btn ${playing ? "playing" : ""}`}
          onClick={onPlayToggle}
          disabled={loadingState === "loading"}
          aria-label={playing ? "Pause animation" : "Play animation"}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" /><rect x="9" y="3" width="3" height="10" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3v10l8-5-8-5z" /></svg>
          )}
        </button>
        <button
          className="time-btn"
          onClick={() => onStep("next")}
          disabled={currentIndex === timeSteps.length - 1 || loadingState === "loading"}
          aria-label="Next time step"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4" /></svg>
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={timeSteps.length - 1}
        value={currentIndex}
        onChange={(e) => onTimeChange(timeSteps[parseInt(e.target.value)])}
        disabled={loadingState === "loading"}
        aria-label="Time scrubber"
        className="time-slider"
      />
    </div>
  );
}

function MapLegend({ layer, timeStep, visible }: MapLegendProps) {
  if (!visible || !layer) return null;

  const stops = layer.colorRamp.slice(0, 6);

  return (
    <div className="map-control-panel legend">
      <div className="legend-header">
        <h4>{layer.label}</h4>
        <span className="legend-time">{timeStep.label}</span>
      </div>
      <div className="legend-ramp" role="img" aria-label={`${layer.label} color scale`}>
        {stops.map((stop, i) => (
          <div key={i} className="legend-stop">
            <span className="legend-color" style={{ background: stop[1] }} />
            <span className="legend-value">{stop[0]}{layer.unit.includes("mm") ? " mm" : layer.unit.includes("°C") ? "°C" : layer.unit.includes("m³") ? " m³/m³" : ""}</span>
          </div>
        ))}
      </div>
      <p className="legend-source">{ATTRIBUTIONS[layer.id as keyof typeof ATTRIBUTIONS] || layer.source}</p>
    </div>
  );
}

function MapInfoPanel({ layer, timeStep, coordinates, value, farmAreaHa }: MapInfoPanelProps) {
  if (!layer || value == null || !coordinates) return null;

  return (
    <div className="map-control-panel info-panel">
      <div className="info-header">
        <h4>{layer.label}</h4>
        <button className="close-btn" onClick={() => {}} aria-label="Close info panel">
          ×
        </button>
      </div>
      <div className="info-grid">
        <div className="info-row">
          <span className="info-label">Value:</span>
          <span className="info-value">{value.toFixed(layer.unit.includes("m³") ? 3 : 1)} {layer.unit}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Location:</span>
          <span className="info-value">{coordinates[1].toFixed(4)}°, {coordinates[0].toFixed(4)}°</span>
        </div>
        <div className="info-row">
          <span className="info-label">Date:</span>
          <span className="info-value">{timeStep.label}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Resolution:</span>
          <span className="info-value">{layer.resolutionKm} km</span>
        </div>
        <div className="info-row">
          <span className="info-label">Source:</span>
          <span className="info-value">{layer.source} {layer.version ? `v${layer.version}` : ""}</span>
        </div>
        {farmAreaHa && (
          <div className="info-row scale-hint">
            <span className="info-label">Scale note:</span>
            <span className="info-value">
              Pixel footprint: ~{Math.round(layer.resolutionKm * layer.resolutionKm * 100)} ha
              {farmAreaHa < layer.resolutionKm * layer.resolutionKm * 100 && " — larger than farm"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewportControls({ zoom, onZoomIn, onZoomOut, onResetView }: ViewportControlsProps) {
  return (
    <div className="map-control-panel viewport-controls">
      <button className="viewport-btn" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="M8 4v8M4 8h8" /></svg>
      </button>
      <button className="viewport-btn" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="M4 8h8" /></svg>
      </button>
      <button className="viewport-btn" onClick={onResetView} aria-label="Reset view" title="Reset view">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v12M2 8h12" /></svg>
      </button>
      <span className="zoom-level">{zoom}</span>
    </div>
  );
}