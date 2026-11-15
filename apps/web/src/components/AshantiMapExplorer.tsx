"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as maplibregl from "maplibre-gl";
import { Clock, Compass, Map as MapIcon } from "lucide-react";
import {
  ASHANTI_PILOT_CELLS,
  SEASONAL_VULNERABILITY_CALENDAR,
  SEASON_FEATURES_BY_CELL,
} from "@/constants/ashanti-pilot";
import type { PilotCell } from "@/types/database";

export type MapLayerId = "bare" | "moisture" | "slope" | "rain";

interface AshantiMapExplorerProps {
  selectedCellId: string;
  onSelectCell: (cellId: string) => void;
  cells?: PilotCell[];
}

function getLayerColor(cell: PilotCell, layer: MapLayerId, dekadIdx: number): string {
  const feat = SEASON_FEATURES_BY_CELL[cell.cell_id] ?? SEASON_FEATURES_BY_CELL.ASH_R05_C05;
  const monthIdx = Math.min(11, Math.floor((dekadIdx - 1) / 3));
  const cal = SEASONAL_VULNERABILITY_CALENDAR[monthIdx];

  if (layer === "bare") {
    const bareScore = feat.bare_period_fraction * (cal.bareFieldRisk ? 1.35 : 0.65);
    if (bareScore >= 0.35) return "#c2593f";
    if (bareScore >= 0.22) return "#d98a36";
    return "#2b7a4b";
  }
  if (layer === "moisture") {
    const z = cal.smapAnomalyZ + feat.mean_sm_anomaly_z * 0.4;
    if (z <= -0.5) return "#c46b29";
    if (z >= 0.4) return "#206bc4";
    return "#3d8b6e";
  }
  if (layer === "slope") {
    if (cell.slope_pct >= 6.5) return "#b84336";
    if (cell.slope_pct >= 5.0) return "#c8872c";
    return "#2b7a4b";
  }
  // seasonal rain
  if (feat.total_rain_mm >= 1360) return "#1e56a0";
  if (feat.total_rain_mm >= 1250) return "#2f7c66";
  return "#9b7a2c";
}

function formatLayerMetric(cell: PilotCell, layer: MapLayerId, dekadIdx: number): string {
  const feat = SEASON_FEATURES_BY_CELL[cell.cell_id] ?? SEASON_FEATURES_BY_CELL.ASH_R05_C05;
  const monthIdx = Math.min(11, Math.floor((dekadIdx - 1) / 3));
  const cal = SEASONAL_VULNERABILITY_CALENDAR[monthIdx];

  switch (layer) {
    case "bare":
      return `${Math.round(feat.bare_period_fraction * 100)}% bare`;
    case "moisture":
      return `z ${(cal.smapAnomalyZ + feat.mean_sm_anomaly_z * 0.4).toFixed(2)}`;
    case "slope":
      return `${cell.slope_pct.toFixed(1)}% slope`;
    case "rain":
      return `${feat.total_rain_mm} mm/yr`;
  }
}

export function AshantiMapExplorer({
  selectedCellId,
  onSelectCell,
  cells = ASHANTI_PILOT_CELLS,
}: AshantiMapExplorerProps) {
  const t = useTranslations("map");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [layer, setLayer] = useState<MapLayerId>("bare");
  const [dekadIdx, setDekadIdx] = useState<number>(5); // D05 Feb bare window default
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const selectedCell = useMemo(
    () => cells.find((c) => c.cell_id === selectedCellId) ?? cells[0],
    [cells, selectedCellId],
  );
  const selectedFeature =
    SEASON_FEATURES_BY_CELL[selectedCell.cell_id] ?? SEASON_FEATURES_BY_CELL.ASH_R05_C05;
  const activeMonth =
    SEASONAL_VULNERABILITY_CALENDAR[Math.min(11, Math.floor((dekadIdx - 1) / 3))];

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: cells.map((cell) => ({
        type: "Feature" as const,
        id: cell.cell_id,
        properties: {
          cell_id: cell.cell_id,
          region_name: cell.region_name,
          fill_color: getLayerColor(cell, layer, dekadIdx),
          is_selected: cell.cell_id === selectedCellId ? 1 : 0,
          metric_label: formatLayerMetric(cell, layer, dekadIdx),
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [cell.polygonCoords],
        },
      })),
    }),
    [cells, layer, dekadIdx, selectedCellId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    let canvasSupported = true;
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        canvasSupported = false;
      }
    } catch {
      canvasSupported = false;
    }

    if (!canvasSupported) {
      void Promise.resolve().then(() => setMapError(true));
      return;
    }

    try {
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container,
        center: [-1.425, 6.875],
        zoom: 11.1,
        attributionControl: false,
        style: {
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
                "raster-saturation": -0.35,
                "raster-brightness-max": 0.92,
              },
            },
          ],
        },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map.getSource("ashanti-cells")) {
          map.addSource("ashanti-cells", {
            type: "geojson",
            data: geojson,
          });
          map.addLayer({
            id: "ashanti-cells-fill",
            type: "fill",
            source: "ashanti-cells",
            paint: {
              "fill-color": ["get", "fill_color"],
              "fill-opacity": ["case", ["==", ["get", "is_selected"], 1], 0.62, 0.34],
            },
          });
          map.addLayer({
            id: "ashanti-cells-outline",
            type: "line",
            source: "ashanti-cells",
            paint: {
              "line-color": ["case", ["==", ["get", "is_selected"], 1], "#0e1a12", "#ffffff"],
              "line-width": ["case", ["==", ["get", "is_selected"], 1], 3, 1.5],
            },
          });
        }

        map.on("click", "ashanti-cells-fill", (e: maplibregl.MapLayerMouseEvent) => {
          const id = e.features?.[0]?.properties?.cell_id;
          if (typeof id === "string") {
            onSelectCell(id);
          }
        });
        map.on("mouseenter", "ashanti-cells-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "ashanti-cells-fill", () => {
          map.getCanvas().style.cursor = "";
        });

        setMapReady(true);
      });

      map.on("error", () => {
        // Keep GeoJSON layers functional even if OSM tiles fail offline
        setMapReady((prev) => prev || true);
      });

      mapRef.current = map;
      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch {
      void Promise.resolve().then(() => setMapError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }
    const source = map.getSource("ashanti-cells") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    }
  }, [geojson, mapReady]);

  const layerButtons: { id: MapLayerId; label: string }[] = [
    { id: "bare", label: t("layers.bare") },
    { id: "moisture", label: t("layers.moisture") },
    { id: "slope", label: t("layers.slope") },
    { id: "rain", label: t("layers.rain") },
  ];

  return (
    <section className="sf-card" aria-labelledby="ashanti-map-heading">
      <div className="sf-card-header">
        <div>
          <span className="label">{t("label")}</span>
          <h2 id="ashanti-map-heading" className="sf-card-title">
            {t("title")}
          </h2>
        </div>
        <MapIcon size={20} className="text-[#275d38]" aria-hidden="true" />
      </div>

      <div className="sf-map-toolbar">
        <div className="sf-chip-row" role="group" aria-label={t("layerLabel")}>
          {layerButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              aria-pressed={layer === btn.id}
              onClick={() => setLayer(btn.id)}
              className={`sf-filter-pill${layer === btn.id ? " is-active" : ""}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="sf-scrubber-box">
          <label htmlFor="dekad-scrubber" className="sf-control-label">
            <Clock size={14} aria-hidden="true" />
            <span>
              {t("dekadScrubber")}: <strong>D{String(dekadIdx).padStart(2, "0")}</strong> ({activeMonth.monthLabel} · {activeMonth.seasonLabel})
            </span>
          </label>
          <input
            id="dekad-scrubber"
            type="range"
            min={1}
            max={36}
            step={1}
            value={dekadIdx}
            onChange={(e) => setDekadIdx(Number(e.target.value))}
            className="slider-input"
          />
        </div>
      </div>

      <div className="sf-map-layout">
        <div className="sf-map-canvas-wrap">
          {!mapError ? (
            <div ref={containerRef} className="sf-maplibre-container" aria-label="Interactive Ashanti pilot map" />
          ) : (
            <div className="sf-vector-fallback">
              <span className="sf-fallback-pill">
                <Compass size={13} aria-hidden="true" />
                {t("fallbackBadge")}
              </span>
              <svg viewBox="0 0 420 260" className="w-full h-full" role="img" aria-label="Ashanti 5-cell coordinate grid">
                <rect width="420" height="260" fill="#132b1c" rx="12" />
                {cells.map((cell) => {
                  const x = 60 + (cell.centre_lon + 1.5) * 1800;
                  const y = 210 - (cell.centre_lat - 6.8) * 1400;
                  const active = cell.cell_id === selectedCellId;
                  return (
                    <g key={cell.cell_id} onClick={() => onSelectCell(cell.cell_id)} style={{ cursor: "pointer" }}>
                      <rect
                        x={x - 38}
                        y={y - 26}
                        width={76}
                        height={52}
                        rx={8}
                        fill={getLayerColor(cell, layer, dekadIdx)}
                        fillOpacity={active ? 0.85 : 0.45}
                        stroke={active ? "#ffffff" : "#8aab8e"}
                        strokeWidth={active ? 2.5 : 1}
                      />
                      <text x={x} y={y - 2} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
                        {cell.cell_id}
                      </text>
                      <text x={x} y={y + 12} textAnchor="middle" fill="#e2efe3" fontSize="9">
                        {formatLayerMetric(cell, layer, dekadIdx)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Quick accessible cell selector strip so keyboard & mobile users can tap any cell directly */}
          <div className="sf-cell-pill-row" role="group" aria-label={t("selectedCell")}>
            {cells.map((cell) => (
              <button
                key={cell.cell_id}
                type="button"
                aria-pressed={cell.cell_id === selectedCellId}
                onClick={() => {
                  onSelectCell(cell.cell_id);
                  mapRef.current?.flyTo({ center: [cell.centre_lon, cell.centre_lat], zoom: 11.4, duration: 500 });
                }}
                className={`sf-cell-btn${cell.cell_id === selectedCellId ? " is-active" : ""}`}
              >
                <span
                  className="sf-cell-swatch"
                  style={{ backgroundColor: getLayerColor(cell, layer, dekadIdx) }}
                  aria-hidden="true"
                />
                <span>{cell.cell_id}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="sf-cell-inspector" aria-label={t("selectedCell")}>
          <span className="label">{t("selectedCell")}</span>
          <h3 className="sf-inspector-title">{selectedCell.region_name}</h3>
          <p className="sf-inspector-coords">
            <code>{selectedCell.cell_id}</code> · {selectedCell.centre_lat.toFixed(3)}°N,{" "}
            {Math.abs(selectedCell.centre_lon).toFixed(3)}°W
          </p>

          <dl className="sf-kv-grid">
            <div>
              <dt>{t("elevation")}</dt>
              <dd>{selectedCell.elevation_m} m</dd>
            </div>
            <div>
              <dt>{t("slope")}</dt>
              <dd>{selectedCell.slope_pct.toFixed(1)}%</dd>
            </div>
            <div>
              <dt>{t("soilTexture")}</dt>
              <dd>{selectedCell.soil_texture}</dd>
            </div>
            <div>
              <dt>{t("soilPh")}</dt>
              <dd>pH {selectedCell.soil_ph.toFixed(1)}</dd>
            </div>
          </dl>

          <div className="sf-inspector-cluster">
            <span className="label">{t("cluster")}</span>
            <p className="font-semibold text-[#0e1a12]">{selectedFeature.cluster_label_m2}</p>
            <p className="text-xs text-[#4a5e50] mt-1">
              M1 Anomaly: {selectedFeature.anomaly_score_m1.toFixed(2)} · Bare Fraction:{" "}
              {Math.round(selectedFeature.bare_period_fraction * 100)}% · Sen Slope:{" "}
              {selectedFeature.trend_sen_slope_mm_yr} mm/yr
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
