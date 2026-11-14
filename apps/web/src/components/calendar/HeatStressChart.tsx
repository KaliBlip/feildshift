"use client";

import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DekadObservation, SeasonDefinition } from "@/lib/types";
import { selectDekadFromChartLabel, type ChartPanelProps } from "./types";

interface HeatStressChartProps extends ChartPanelProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
}

const COLORS = {
  observed: "#C62828",
  climatology: "#FED976",
  heatStress: "#EF5350",
  extremeHeat: "#B71C1C",
  grid: "#D8E5D9",
  text: "#4A5E50",
};

const HEAT_STRESS_THRESHOLD = 35; // °C - land surface temperature threshold for heat stress
const EXTREME_HEAT_THRESHOLD = 40; // °C - extreme heat threshold

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | null; name: string; color: string; payload: DekadTooltipPayload }>; label?: string }) {
  if (!active || !payload || !label) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const anomaly = typeof data.lstC === "number" && typeof data.lstClimatologyC === "number"
    ? data.lstC - data.lstClimatologyC
    : null;

  const isHeatStress = typeof data.lstC === "number" && data.lstC >= HEAT_STRESS_THRESHOLD;
  const isExtremeHeat = typeof data.lstC === "number" && data.lstC >= EXTREME_HEAT_THRESHOLD;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-date">{data.dateStart} – {data.dateEnd}</div>
      <div className="tooltip-note" style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: 4 }}>
        Note: Land surface temperature (LST), not air temperature
      </div>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-row" style={{ borderLeftColor: entry.color }}>
          <span className="tooltip-label">{entry.name}:</span>
          <span className="tooltip-value">
            {entry.value !== null ? `${entry.value.toFixed(1)}°C` : "No data"}
          </span>
        </div>
      ))}
      {anomaly !== null && (
        <div className={`tooltip-row anomaly ${anomaly >= 0 ? "positive" : "negative"}`}>
          <span className="tooltip-label">Anomaly:</span>
          <span className="tooltip-value">
            {anomaly >= 0 ? "+" : ""}{anomaly.toFixed(1)}°C
          </span>
        </div>
      )}
      {(isHeatStress || isExtremeHeat) && (
        <div className={`tooltip-row alert ${isExtremeHeat ? "extreme" : ""}`}>
          <span className="tooltip-label">
            {isExtremeHeat ? "⚠ Extreme heat" : "⚠ Heat stress"}
          </span>
          <span className="tooltip-value">
            LST ≥ {isExtremeHeat ? EXTREME_HEAT_THRESHOLD : HEAT_STRESS_THRESHOLD}°C
          </span>
        </div>
      )}
      {data.quality?.lstSource && (
        <div className="tooltip-quality">
          Source: {data.quality.lstSource}
        </div>
      )}
    </div>
  );
}

export function HeatStressChart({ observations, seasons, selectedDekad, onSelectDekad, ...props }: HeatStressChartProps) {
  if (observations.length === 0) {
    return (
      <div className="chart-panel">
        <div className="chart-panel-header">
          <h3 className="chart-panel-title">{props.title}</h3>
          {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
        </div>
        <div className="chart-empty">No temperature data available for the selected period.</div>
      </div>
    );
  }

  const chartData = observations.map((obs) => ({
    dekad: obs.dekad,
    label: `${obs.dekadNumber}`,
    observed: obs.lstC,
    climatology: obs.lstClimatologyC,
    dateStart: obs.dateStart,
    dateEnd: obs.dateEnd,
    quality: obs.quality,
  }));

  const validObserved = observations.filter((o) => o.lstC !== null);
  const validClimatology = observations.filter((o) => o.lstClimatologyC !== null);
  const maxY = Math.max(
    HEAT_STRESS_THRESHOLD + 5,
    ...validObserved.map((o) => o.lstC ?? 0),
    ...validClimatology.map((o) => o.lstClimatologyC ?? 0)
  ) * 1.05;
  const minY = Math.max(0, Math.min(
    ...validObserved.map((o) => o.lstC ?? 50),
    ...validClimatology.map((o) => o.lstClimatologyC ?? 50),
    50
  ) - 5);

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <h3 className="chart-panel-title">{props.title}</h3>
        {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            onClick={(state) => selectDekadFromChartLabel(state.activeLabel, observations, onSelectDekad)}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient id="heatObservedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.observed} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.observed} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="heatClimatologyGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.climatology} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.climatology} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <ReferenceLine
              y={HEAT_STRESS_THRESHOLD}
              stroke={COLORS.heatStress}
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{ position: "insideStart", offset: -10, fill: COLORS.heatStress, fontSize: 10, value: `Heat stress threshold (${HEAT_STRESS_THRESHOLD}°C LST)` }}
            />
            <ReferenceLine
              y={EXTREME_HEAT_THRESHOLD}
              stroke={COLORS.extremeHeat}
              strokeWidth={1}
              strokeDasharray="3 3"
              label={{ position: "insideStart", offset: -10, fill: COLORS.extremeHeat, fontSize: 10, value: `Extreme heat threshold (${EXTREME_HEAT_THRESHOLD}°C LST)` }}
            />
            <XAxis
              type="number"
              domain={[minY, maxY]}
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{ value: `Land Surface Temp (${props.unit})`, position: "insideRight", offset: -20, fill: COLORS.text, fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={40}
              tick={{ fill: COLORS.text, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="observed"
              name="Observed LST"
              stroke={COLORS.observed}
              fillOpacity={1}
              fill="url(#heatObservedGradient)"
              strokeWidth={2}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="climatology"
              name="Climatology LST"
              stroke={COLORS.climatology}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {chartData.map((d, i) =>
              d.dekad === selectedDekad && d.observed !== null ? (
                <ReferenceLine
                  key={`ref-${i}`}
                  y={d.observed}
                  stroke={COLORS.observed}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{ position: "insideStart", offset: -10, fill: COLORS.observed, fontSize: 10, value: `D${i + 1}: ${d.observed.toFixed(1)}°C` }}
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SeasonIndicator seasons={seasons} />
      <DekadSelector
        observations={observations}
        selectedDekad={selectedDekad}
        onSelectDekad={onSelectDekad}
      />
    </div>
  );
}

function SeasonIndicator({ seasons }: { seasons: SeasonDefinition[] }) {
  if (seasons.length === 0) return null;

  return (
    <div className="season-indicator" role="img" aria-label="Seasonal periods">
      {seasons.map((season) => (
        <div
          key={season.key}
          className="season-bar"
          style={{
            "--season-start": `${((season.startDekad - 1) / 36) * 100}%`,
            "--season-end": `${(season.endDekad / 36) * 100}%`,
          } as React.CSSProperties}
          title={`${season.label} (Dekad ${season.startDekad}–${season.endDekad})`}
        >
          <span className="season-label">{season.key === "major" ? "Major" : "Minor"} Rains</span>
        </div>
      ))}
    </div>
  );
}

function DekadSelector({
  observations,
  selectedDekad,
  onSelectDekad,
}: {
  observations: DekadObservation[];
  selectedDekad: string | null;
  onSelectDekad: (dekad: string | null) => void;
}) {
  return (
    <div className="dekad-selector" role="group" aria-label="Select dekad">
      {observations.map((obs) => (
        <button
          key={obs.dekad}
          className={`dekad-btn ${obs.dekad === selectedDekad ? "selected" : ""} ${obs.lstC === null ? "missing" : ""} ${obs.lstC !== null && obs.lstC >= EXTREME_HEAT_THRESHOLD ? "extreme" : obs.lstC !== null && obs.lstC >= HEAT_STRESS_THRESHOLD ? "heat-stress" : ""}`}
          onClick={() => onSelectDekad(obs.dekad)}
          onDoubleClick={() => onSelectDekad(null)}
          title={`${obs.dekad} (${obs.dateStart} – ${obs.dateEnd})${obs.lstC === null ? " — No data" : ""}${obs.lstC !== null && obs.lstC >= EXTREME_HEAT_THRESHOLD ? " — Extreme heat" : obs.lstC !== null && obs.lstC >= HEAT_STRESS_THRESHOLD ? " — Heat stress" : ""}`}
          aria-pressed={obs.dekad === selectedDekad}
          disabled={obs.lstC === null}
        >
          D{obs.dekadNumber}
          {obs.lstC !== null && obs.lstC >= EXTREME_HEAT_THRESHOLD && <span className="heat-indicator extreme" aria-hidden="true">▲</span>}
          {obs.lstC !== null && obs.lstC >= HEAT_STRESS_THRESHOLD && obs.lstC < EXTREME_HEAT_THRESHOLD && <span className="heat-indicator" aria-hidden="true">▲</span>}
          {obs.lstC === null && <span className="missing-indicator" aria-hidden="true">·</span>}
        </button>
      ))}
    </div>
  );
}

interface DekadTooltipPayload {
  dekad: string;
  dekadNumber: number;
  dateStart: string;
  dateEnd: string;
  quality?: {
    lstSource: string;
  };
  [key: string]: unknown;
}