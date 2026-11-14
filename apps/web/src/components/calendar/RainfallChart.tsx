"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DekadObservation, SeasonDefinition } from "@/lib/types";
import { selectDekadFromChartLabel, type ChartPanelProps } from "./types";

interface RainfallChartProps extends ChartPanelProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
}

const COLORS = {
  observed: "#2D5FA6",
  climatology: "#FED976",
  reliability: "#8AAB8E",
  deficit: "#DC6B2F",
  grid: "#D8E5D9",
  text: "#4A5E50",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | null; name: string; color: string; payload: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload || !label) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-date">{String(data.dateStart)} – {String(data.dateEnd)}</div>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-row" style={{ borderLeftColor: entry.color }}>
          <span className="tooltip-label">{entry.name}:</span>
          <span className="tooltip-value">
            {entry.value !== null ? `${entry.value.toFixed(1)} mm` : "No data"}
          </span>
        </div>
      ))}
      {data.rainfallReliability !== null && data.rainfallReliability !== undefined && (
        <div className="tooltip-row" style={{ borderLeftColor: COLORS.reliability }}>
          <span className="tooltip-label">Reliability:</span>
          <span className="tooltip-value">{(Number(data.rainfallReliability) * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

export function RainfallChart({ observations, seasons, selectedDekad, onSelectDekad, ...props }: RainfallChartProps) {
  if (observations.length === 0) {
    return (
      <div className="chart-panel">
        <div className="chart-panel-header">
          <h3 className="chart-panel-title">{props.title}</h3>
          {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
        </div>
        <div className="chart-empty">No rainfall data available for the selected period.</div>
      </div>
    );
  }

  const chartData = observations.map((obs) => ({
    dekad: obs.dekad,
    label: `${obs.dekadNumber}`,
    observed: obs.rainfallMm,
    climatology: obs.rainfallClimatologyMm,
    reliability: obs.rainfallReliability,
    dateStart: obs.dateStart,
    dateEnd: obs.dateEnd,
  }));

  const maxObserved = Math.max(...observations.map((o) => o.rainfallMm ?? 0));
  const maxClimatology = Math.max(...observations.map((o) => o.rainfallClimatologyMm ?? 0));
  const maxY = Math.max(maxObserved, maxClimatology) * 1.2;

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <h3 className="chart-panel-title">{props.title}</h3>
        {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            onClick={(state) => selectDekadFromChartLabel(state.activeLabel, observations, onSelectDekad)}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              type="number"
              domain={[0, maxY]}
              tick={{ fill: COLORS.text, fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{ value: `Rainfall (${props.unit})`, position: "insideRight", offset: -20, fill: COLORS.text, fontSize: 11 }}
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
            <Legend wrapperStyle={{ paddingTop: 8 }} />
            <Bar dataKey="observed" name="Observed" fill={COLORS.observed} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell key={`obs-${i}`} fill={entry.dekad === selectedDekad ? "#1A3D28" : COLORS.observed} />
              ))}
            </Bar>
            <Bar dataKey="climatology" name="Climatology" fill={COLORS.climatology} radius={[0, 4, 4, 0]} opacity={0.7} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell key={`clim-${i}`} fill={entry.dekad === selectedDekad ? "#A88C3A" : COLORS.climatology} />
              ))}
            </Bar>
          </BarChart>
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
          className={`dekad-btn ${obs.dekad === selectedDekad ? "selected" : ""}`}
          onClick={() => onSelectDekad(obs.dekad)}
          onDoubleClick={() => onSelectDekad(null)}
          title={`${obs.dekad} (${obs.dateStart} – ${obs.dateEnd})`}
          aria-pressed={obs.dekad === selectedDekad}
        >
          D{obs.dekadNumber}
        </button>
      ))}
    </div>
  );
}