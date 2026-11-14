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
import type { DekadObservation, BareFieldPeriod, SeasonDefinition } from "@/lib/types";
import { selectDekadFromChartLabel, type ChartPanelProps } from "./types";

interface BareFieldChartProps extends ChartPanelProps {
  observations: DekadObservation[];
  bareFieldPeriods: BareFieldPeriod[];
  seasons: SeasonDefinition[];
}

const COLORS = {
  bare: "#8D6E63",
  vegetated: "#2E7D32",
  threshold: "#8D6E63",
  lowConfidence: "#F57C00",
  mediumConfidence: "#F9A825",
  highConfidence: "#2E7D32",
  grid: "#D8E5D9",
  text: "#4A5E50",
};

const NDVI_BARE_THRESHOLD = 0.25;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | null; name: string; color: string; payload: DekadTooltipPayload }>; label?: string }) {
  if (!active || !payload || !label) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const period = data.bareFieldPeriod;
  const isBare = typeof data.ndvi === "number" && data.ndvi < NDVI_BARE_THRESHOLD;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-date">{data.dateStart} – {data.dateEnd}</div>
      {payload.map((entry, index) => (
        <div key={index} className="tooltip-row" style={{ borderLeftColor: entry.color }}>
          <span className="tooltip-label">{entry.name}:</span>
          <span className="tooltip-value">
            {entry.value !== null ? entry.value.toFixed(3) : "No data"}
          </span>
        </div>
      ))}
      <div className={`tooltip-row ${isBare ? "bare" : "vegetated"}`}>
        <span className="tooltip-label">Bare-field status:</span>
        <span className="tooltip-value">
          {isBare ? "⚠ Below bare-field threshold" : "✓ Above bare-field threshold"}
        </span>
      </div>
      {period && (
        <>
          <div className="tooltip-row period">
            <span className="tooltip-label">Exposure period:</span>
            <span className="tooltip-value">{period.dekadStart} – {period.dekadEnd} ({period.durationDekads} dekads)</span>
          </div>
          <div className="tooltip-row confidence">
            <span className="tooltip-label">Confidence:</span>
            <span className="tooltip-value">{period.confidence}</span>
          </div>
          {period.caveat && (
            <div className="tooltip-caveat">{period.caveat}</div>
          )}
        </>
      )}
      {data.quality?.ndviSource && (
        <div className="tooltip-quality">
          Source: {data.quality.ndviSource}
        </div>
      )}
    </div>
  );
}

export function BareFieldChart({ observations, bareFieldPeriods, seasons, selectedDekad, onSelectDekad, ...props }: BareFieldChartProps) {
  if (observations.length === 0) {
    return (
      <div className="chart-panel">
        <div className="chart-panel-header">
          <h3 className="chart-panel-title">{props.title}</h3>
          {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
        </div>
        <div className="chart-empty">No vegetation data available for bare-field assessment.</div>
      </div>
    );
  }

  const chartData = observations.map((obs) => {
    const period = bareFieldPeriods.find(
      (p) => obs.dekadNumber >= parseInt(p.dekadStart.split("-D")[1]) && obs.dekadNumber <= parseInt(p.dekadEnd.split("-D")[1])
    );
    const isBare = obs.ndvi !== null && obs.ndvi < NDVI_BARE_THRESHOLD;

    return {
      dekad: obs.dekad,
      label: `${obs.dekadNumber}`,
      ndvi: obs.ndvi,
      isBare: isBare ? 1 : 0,
      bareHeight: isBare ? 1 : 0,
      vegetatedHeight: !isBare && obs.ndvi !== null ? 1 : 0,
      dateStart: obs.dateStart,
      dateEnd: obs.dateEnd,
      bareFieldPeriod: period,
      quality: obs.quality,
    };
  });

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <h3 className="chart-panel-title">{props.title}</h3>
        {props.subtitle && <p className="chart-panel-subtitle">{props.subtitle}</p>}
        <div className="chart-legend-inline">
          <span className="legend-item bare"><span className="legend-color" style={{ background: COLORS.bare }} /> Bare-field exposure</span>
          <span className="legend-item vegetated"><span className="legend-color" style={{ background: COLORS.vegetated }} /> Vegetated</span>
          <span className="legend-item threshold">Threshold: NDVI = {NDVI_BARE_THRESHOLD}</span>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            onClick={(state) => selectDekadFromChartLabel(state.activeLabel, observations, onSelectDekad)}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 1.2]}
              tick={false}
              axisLine={false}
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
            <Bar
              dataKey="bareHeight"
              name="Bare-field exposure"
              fill={COLORS.bare}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((d, i) => (
                <Cell
                  key={`bare-${i}`}
                  fill={
                    d.bareFieldPeriod
                      ? d.bareFieldPeriod.confidence === "high"
                        ? COLORS.highConfidence
                        : d.bareFieldPeriod.confidence === "medium"
                        ? COLORS.mediumConfidence
                        : COLORS.lowConfidence
                      : COLORS.bare
                  }
                />
              ))}
            </Bar>
            <Bar
              dataKey="vegetatedHeight"
              name="Vegetated"
              fill={COLORS.vegetated}
              radius={[0, 4, 4, 0]}
              stackId="a"
            >
              {chartData.map((_, i) => (
                <Cell key={`veg-${i}`} fill={COLORS.vegetated} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <BareFieldPeriodsIndicator periods={bareFieldPeriods} />
      <SeasonIndicator seasons={seasons} />
      <DekadSelector
        observations={observations}
        selectedDekad={selectedDekad}
        onSelectDekad={onSelectDekad}
      />
    </div>
  );
}

function BareFieldPeriodsIndicator({ periods }: { periods: BareFieldPeriod[] }) {
  if (periods.length === 0) return null;

  return (
    <div className="bare-field-periods-indicator" role="list" aria-label="Bare-field exposure periods">
      {periods.map((period, i) => (
        <div key={i} className={`bare-period-bar ${period.confidence}`} title={`${period.dekadStart} – ${period.dekadEnd} (${period.durationDekads} dekads, ${period.confidence} confidence)`}>
          <span className="period-label">{period.dekadStart}–{period.dekadEnd}</span>
          <span className="period-duration">{period.durationDekads} dekads</span>
        </div>
      ))}
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
      {observations.map((obs) => {
        const isBare = obs.ndvi !== null && obs.ndvi < NDVI_BARE_THRESHOLD;
        return (
          <button
            key={obs.dekad}
            className={`dekad-btn ${obs.dekad === selectedDekad ? "selected" : ""} ${obs.ndvi === null ? "missing" : ""} ${isBare ? "bare" : ""}`}
            onClick={() => onSelectDekad(obs.dekad)}
            onDoubleClick={() => onSelectDekad(null)}
            title={`${obs.dekad} (${obs.dateStart} – ${obs.dateEnd})${obs.ndvi === null ? " — No data" : isBare ? " — Bare-field" : " — Vegetated"}`}
            aria-pressed={obs.dekad === selectedDekad}
            disabled={obs.ndvi === null}
          >
            D{obs.dekadNumber}
            {isBare && <span className="bare-indicator" aria-hidden="true">■</span>}
            {obs.ndvi === null && <span className="missing-indicator" aria-hidden="true">·</span>}
          </button>
        );
      })}
    </div>
  );
}

interface DekadTooltipPayload {
  dekad: string;
  dekadNumber: number;
  dateStart: string;
  dateEnd: string;
  bareFieldPeriod?: BareFieldPeriod;
  quality?: {
    ndviSource: string;
  };
  [key: string]: unknown;
}