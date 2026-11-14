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

interface SoilMoistureChartProps extends ChartPanelProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
}

const COLORS = {
  observed: "#2D5FA6",
  climatology: "#FED976",
  deficit: "#DC6B2F",
  excess: "#1565C0",
  grid: "#D8E5D9",
  text: "#4A5E50",
  positiveAnomaly: "#2E7D32",
  negativeAnomaly: "#C62828",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | null; name: string; color: string; payload: DekadTooltipPayload }>; label?: string }) {
  if (!active || !payload || !label) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const anomaly = typeof data.soilMoisture === "number" && typeof data.soilMoistureClimatology === "number"
    ? data.soilMoisture - data.soilMoistureClimatology
    : null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-date">{data.dateStart} – {data.dateEnd}</div>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-row" style={{ borderLeftColor: entry.color }}>
          <span className="tooltip-label">{entry.name}:</span>
          <span className="tooltip-value">
            {entry.value !== null ? `${entry.value.toFixed(3)} m³/m³` : "No data"}
          </span>
        </div>
      ))}
      {anomaly !== null && (
        <div className={`tooltip-row anomaly ${anomaly >= 0 ? "positive" : "negative"}`}>
          <span className="tooltip-label">Anomaly:</span>
          <span className="tooltip-value">
            {anomaly >= 0 ? "+" : ""}{anomaly.toFixed(3)} m³/m³
          </span>
        </div>
      )}
      {data.quality?.soilMoistureSource && (
        <div className="tooltip-quality">
          Source: {data.quality.soilMoistureSource}
        </div>
      )}
    </div>
  );
}

export function SoilMoistureChart({ observations, seasons, selectedDekad, onSelectDekad, ...props }: SoilMoistureChartProps) {
  if (observations.length === 0) {
    return (
      <div className="chart-panel">
        <div className="chart-panel-header">
          <h3 className="chart-panel-title">{props.title}</h3>
          {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
        </div>
        <div className="chart-empty">No soil moisture data available for the selected period.</div>
      </div>
    );
  }

  const chartData = observations.map((obs) => ({
    dekad: obs.dekad,
    label: `${obs.dekadNumber}`,
    observed: obs.soilMoisture,
    climatology: obs.soilMoistureClimatology,
    dateStart: obs.dateStart,
    dateEnd: obs.dateEnd,
    quality: obs.quality,
  }));

  const validObserved = observations.filter((o) => o.soilMoisture !== null);
  const validClimatology = observations.filter((o) => o.soilMoistureClimatology !== null);
  const maxY = Math.max(
    ...validObserved.map((o) => o.soilMoisture ?? 0),
    ...validClimatology.map((o) => o.soilMoistureClimatology ?? 0),
    0.5
  );
  const minY = Math.max(0, Math.min(
    ...validObserved.map((o) => o.soilMoisture ?? 0.5),
    ...validClimatology.map((o) => o.soilMoistureClimatology ?? 0.5),
    0.5
  ) - 0.1);

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
              <linearGradient id="observedGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.observed} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.observed} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="climatologyGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLORS.climatology} stopOpacity={0.2} />
                <stop offset="100%" stopColor={COLORS.climatology} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              type="number"
              domain={[minY, maxY]}
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: `Soil Moisture (${props.unit})`, position: "insideRight", offset: -20, fill: COLORS.text, fontSize: 11 }}
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
              name="Observed"
              stroke={COLORS.observed}
              fillOpacity={1}
              fill="url(#observedGradient)"
              strokeWidth={2}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="climatology"
              name="Climatology"
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
                  label={{ position: "insideStart", offset: -10, fill: COLORS.observed, fontSize: 10, value: `D${i + 1}: ${d.observed.toFixed(3)}` }}
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
          className={`dekad-btn ${obs.dekad === selectedDekad ? "selected" : ""} ${obs.soilMoisture === null ? "missing" : ""}`}
          onClick={() => onSelectDekad(obs.dekad)}
          onDoubleClick={() => onSelectDekad(null)}
          title={`${obs.dekad} (${obs.dateStart} – ${obs.dateEnd})${obs.soilMoisture === null ? " — No data" : ""}`}
          aria-pressed={obs.dekad === selectedDekad}
          disabled={obs.soilMoisture === null}
        >
          D{obs.dekadNumber}
          {obs.soilMoisture === null && <span className="missing-indicator" aria-hidden="true">·</span>}
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
    soilMoistureSource: string;
  };
  [key: string]: unknown;
}