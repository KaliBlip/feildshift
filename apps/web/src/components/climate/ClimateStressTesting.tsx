"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { DekadObservation, SeasonDefinition } from "@/lib/types";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface StressTestScenario {
  rainfallShiftPct: number;   // -50 to +50, % change from observed
  temperatureShiftC: number;  // -3 to +5, °C delta
  label: string;
}
interface ClimateStressTestingProps {
  observations: DekadObservation[];
  seasons: SeasonDefinition[];
  onScenarioChange?: (scenario: StressTestScenario) => void;
}

interface AnalogSeason {
  year: number;
  label: string;
  description: string;
  rainfallShiftPct: number;
  temperatureShiftC: number;
}

/* ─── Analog Seasons ─────────────────────────────────────────────────── */

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ILLUSTRATIVE ANALOG SEASONS — NOT VERIFIED HISTORICAL DATA    ║
 * ║  These represent plausible scenario archetypes for interface    ║
 * ║  development. Real analog seasons require validated climate     ║
 * ║  records and proper statistical identification.                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
const ANALOG_SEASONS: AnalogSeason[] = [
  {
    year: 0,
    label: "Current Observations",
    description: "No adjustments applied. Showing original observation data.",
    rainfallShiftPct: 0,
    temperatureShiftC: 0,
  },
  {
    year: 2015,
    label: "El Niño–like Dry (illustrative)",
    description:
      "Simulates conditions similar to a strong El Niño year with reduced " +
      "rainfall and elevated temperatures. Illustrative scenario only — not " +
      "a reconstruction of actual 2015 conditions.",
    rainfallShiftPct: -30,
    temperatureShiftC: 1.5,
  },
  {
    year: 2020,
    label: "Late Onset (illustrative)",
    description:
      "Simulates a delayed rainy-season onset with modest rainfall reduction " +
      "and near-normal temperatures. Illustrative scenario only.",
    rainfallShiftPct: -15,
    temperatureShiftC: 0.5,
  },
  {
    year: 2022,
    label: "Wet Anomaly (illustrative)",
    description:
      "Simulates an above-average rainfall season with slightly cooler " +
      "land surface temperatures. Illustrative scenario only.",
    rainfallShiftPct: 25,
    temperatureShiftC: -0.8,
  },
];

/* ─── Scenario Application ───────────────────────────────────────────── */

export function applyScenario(
  observations: DekadObservation[],
  scenario: StressTestScenario,
): DekadObservation[] {
  if (scenario.rainfallShiftPct === 0 && scenario.temperatureShiftC === 0) {
    return observations;
  }
  return observations.map((obs) => ({
    ...obs,
    rainfallMm:
      obs.rainfallMm !== null
        ? Math.max(0, obs.rainfallMm * (1 + scenario.rainfallShiftPct / 100))
        : null,
    lstC:
      obs.lstC !== null
        ? obs.lstC + scenario.temperatureShiftC
        : null,
    // Soil moisture responds to rainfall changes (simplified linear response)
    soilMoisture:
      obs.soilMoisture !== null
        ? Math.max(
            0.05,
            Math.min(
              0.50,
              obs.soilMoisture * (1 + (scenario.rainfallShiftPct / 100) * 0.6),
            ),
          )
        : null,
    // NDVI responds with dampened lag (simplified)
    ndvi:
      obs.ndvi !== null
        ? Math.max(
            0.08,
            Math.min(
              0.95,
              obs.ndvi * (1 + (scenario.rainfallShiftPct / 100) * 0.3) -
                scenario.temperatureShiftC * 0.015,
            ),
          )
        : null,
  }));
}

/* ─── Component ──────────────────────────────────────────────────────── */

export function ClimateStressTesting({
  observations,
  seasons,
  onScenarioChange,
}: ClimateStressTestingProps) {
  const [rainfallShift, setRainfallShift] = useState(0);
  const [tempShift, setTempShift] = useState(0);
  const [selectedAnalog, setSelectedAnalog] = useState(0); // index into ANALOG_SEASONS
  const [isCustom, setIsCustom] = useState(false);

  const scenario = useMemo<StressTestScenario>(() => ({
    rainfallShiftPct: rainfallShift,
    temperatureShiftC: tempShift,
    label: isCustom
      ? `Custom: ${rainfallShift >= 0 ? "+" : ""}${rainfallShift}% rain, ${tempShift >= 0 ? "+" : ""}${tempShift}°C`
      : ANALOG_SEASONS[selectedAnalog].label,
  }), [rainfallShift, tempShift, isCustom, selectedAnalog]);

  // Notify parent of scenario changes
  const prevScenario = useRef(scenario);
  useEffect(() => {
    if (
      prevScenario.current.rainfallShiftPct !== scenario.rainfallShiftPct ||
      prevScenario.current.temperatureShiftC !== scenario.temperatureShiftC
    ) {
      prevScenario.current = scenario;
      onScenarioChange?.(scenario);
    }
  }, [scenario, onScenarioChange]);

  const handleAnalogSelect = useCallback((index: number) => {
    const analog = ANALOG_SEASONS[index];
    setSelectedAnalog(index);
    setRainfallShift(analog.rainfallShiftPct);
    setTempShift(analog.temperatureShiftC);
    setIsCustom(false);
  }, []);

  const handleSliderChange = useCallback((type: "rain" | "temp", value: number) => {
    setIsCustom(true);
    setSelectedAnalog(0);
    if (type === "rain") setRainfallShift(value);
    else setTempShift(value);
  }, []);

  const handleReset = useCallback(() => {
    setRainfallShift(0);
    setTempShift(0);
    setSelectedAnalog(0);
    setIsCustom(false);
  }, []);

  // Impact summary
  const modifiedObs = useMemo(
    () => applyScenario(observations, scenario),
    [observations, scenario],
  );
  const impactSummary = useMemo(() => {
    const origRain = observations.reduce((s, o) => s + (o.rainfallMm ?? 0), 0);
    const modRain = modifiedObs.reduce((s, o) => s + (o.rainfallMm ?? 0), 0);
    const origMeanNdvi =
      observations.filter((o) => o.ndvi !== null).reduce((s, o) => s + (o.ndvi ?? 0), 0) /
      Math.max(1, observations.filter((o) => o.ndvi !== null).length);
    const modMeanNdvi =
      modifiedObs.filter((o) => o.ndvi !== null).reduce((s, o) => s + (o.ndvi ?? 0), 0) /
      Math.max(1, modifiedObs.filter((o) => o.ndvi !== null).length);
    const origBareDekads = observations.filter((o) => o.ndvi !== null && o.ndvi < 0.25).length;
    const modBareDekads = modifiedObs.filter((o) => o.ndvi !== null && o.ndvi < 0.25).length;

    return {
      totalRainfallChange: modRain - origRain,
      meanNdviChange: modMeanNdvi - origMeanNdvi,
      bareDekadChange: modBareDekads - origBareDekads,
    };
  }, [observations, modifiedObs]);

  const isModified = rainfallShift !== 0 || tempShift !== 0;

  return (
    <div className="stress-testing" role="region" aria-labelledby="stress-heading">
      <div className="stress-header">
        <h3 id="stress-heading" className="stress-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 3v1m0 16v1m-9-9H2m20 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          Climate Stress-Testing
        </h3>
        <p className="stress-subtitle">
          Explore how changes in rainfall and temperature might affect seasonal conditions.
          Adjust the sliders or select an analog season scenario.
        </p>
      </div>

      {/* Illustrative disclaimer */}
      <div className="stress-disclaimer" role="note">
        <strong>Scenario explorer only.</strong> These are simplified linear adjustments
        to illustrative data, not calibrated climate projections. Real climate
        stress-testing requires validated crop models and downscaled climate scenarios.
      </div>

      {/* Analog Season Selector */}
      <div className="analog-selector">
        <h4 className="analog-label">Analog Season Replay</h4>
        <div className="analog-grid">
          {ANALOG_SEASONS.map((analog, i) => (
            <button
              key={i}
              className={`analog-card ${selectedAnalog === i && !isCustom ? "active" : ""}`}
              onClick={() => handleAnalogSelect(i)}
              aria-pressed={selectedAnalog === i && !isCustom}
            >
              <span className="analog-name">{analog.label}</span>
              {i > 0 && (
                <span className="analog-params">
                  {analog.rainfallShiftPct >= 0 ? "+" : ""}{analog.rainfallShiftPct}% rain,{" "}
                  {analog.temperatureShiftC >= 0 ? "+" : ""}{analog.temperatureShiftC}°C
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Sliders */}
      <div className="stress-sliders">
        <div className="slider-group">
          <label className="slider-label" htmlFor="rain-slider">
            <span className="slider-icon">🌧</span>
            Rainfall Adjustment
            <span className="slider-value" data-negative={rainfallShift < 0}>
              {rainfallShift >= 0 ? "+" : ""}{rainfallShift}%
            </span>
          </label>
          <input
            id="rain-slider"
            type="range"
            min={-50}
            max={50}
            step={5}
            value={rainfallShift}
            onChange={(e) => handleSliderChange("rain", Number(e.target.value))}
            className="stress-range"
            aria-valuetext={`${rainfallShift >= 0 ? "+" : ""}${rainfallShift}% rainfall`}
          />
          <div className="slider-scale">
            <span>−50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        <div className="slider-group">
          <label className="slider-label" htmlFor="temp-slider">
            <span className="slider-icon">🌡</span>
            Temperature Adjustment
            <span className="slider-value" data-negative={tempShift < 0}>
              {tempShift >= 0 ? "+" : ""}{tempShift.toFixed(1)}°C
            </span>
          </label>
          <input
            id="temp-slider"
            type="range"
            min={-3}
            max={5}
            step={0.5}
            value={tempShift}
            onChange={(e) => handleSliderChange("temp", Number(e.target.value))}
            className="stress-range"
            aria-valuetext={`${tempShift >= 0 ? "+" : ""}${tempShift.toFixed(1)}°C temperature`}
          />
          <div className="slider-scale">
            <span>−3°C</span>
            <span>0°C</span>
            <span>+5°C</span>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      {isModified && (
        <div className="impact-summary" role="status" aria-live="polite">
          <h4 className="impact-heading">Estimated Scenario Impact</h4>
          <div className="impact-grid">
            <div className="impact-card">
              <span className="impact-label">Season Rainfall</span>
              <span className="impact-value" data-negative={impactSummary.totalRainfallChange < 0}>
                {impactSummary.totalRainfallChange >= 0 ? "+" : ""}
                {impactSummary.totalRainfallChange.toFixed(0)} mm
              </span>
            </div>
            <div className="impact-card">
              <span className="impact-label">Mean NDVI</span>
              <span className="impact-value" data-negative={impactSummary.meanNdviChange < 0}>
                {impactSummary.meanNdviChange >= 0 ? "+" : ""}
                {impactSummary.meanNdviChange.toFixed(3)}
              </span>
            </div>
            <div className="impact-card">
              <span className="impact-label">Bare-Field Dekads</span>
              <span className="impact-value" data-negative={impactSummary.bareDekadChange > 0}>
                {impactSummary.bareDekadChange >= 0 ? "+" : ""}
                {impactSummary.bareDekadChange}
              </span>
            </div>
          </div>
          <p className="impact-caveat">
            These are linear approximations applied to illustrative data. They do not
            account for nonlinear crop responses, soil buffering, or microclimate effects.
          </p>
        </div>
      )}

      {/* Reset */}
      {isModified && (
        <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: "1rem" }}>
          Reset to Observed
        </button>
      )}
    </div>
  );
}
