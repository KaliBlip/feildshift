/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ILLUSTRATIVE DATA ONLY — NOT REAL ENVIRONMENTAL OBSERVATIONS  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  These values are synthetic placeholders generated to develop   ║
 * ║  and test the interface. They do not represent actual NASA      ║
 * ║  measurements, satellite observations, or scientific findings. ║
 * ║                                                                ║
 * ║  When real pipeline data is connected via Supabase, this file  ║
 * ║  should be removed and replaced with actual API calls.         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import type {
  DekadObservation,
  AnomalyBadge,
  BareFieldPeriod,
  MapTimeStep,
} from "./types";
import { dekadToDateRange, dekadId } from "./constants";

/** Flag indicating this is illustrative data. */
export const IS_ILLUSTRATIVE = true;
export const ILLUSTRATIVE_DISCLAIMER =
  "These values are illustrative placeholders for interface development. " +
  "They do not represent actual NASA observations, satellite measurements, " +
  "or scientific findings. Real data will be sourced from the Field Shift " +
  "pipeline via Supabase when available.";

/* ─── Deterministic seeded pseudo-random for reproducibility ─────────── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}
/* ─── Generate illustrative dekad timeseries ─────────────────────────── */

export function generateIllustrativeDekads(year: number): DekadObservation[] {
  const rand = seededRandom(year * 7 + 42);
  const observations: DekadObservation[] = [];

  for (let d = 1; d <= 36; d++) {
    const { start, end } = dekadToDateRange(d, year);

    // Seasonal rainfall pattern (bimodal for Ashanti)
    // Major rains: D7–D21 (Mar–Jul), Minor rains: D25–D33 (Sep–Nov)
    const isMajorRain = d >= 7 && d <= 21;
    const isMinorRain = d >= 25 && d <= 33;
    const isDry = !isMajorRain && !isMinorRain;

    let baseRainfall: number;
    if (isMajorRain) {
      const peak = 14; // peak around mid-season
      baseRainfall = 35 + 45 * Math.exp(-0.05 * (d - peak) ** 2);
    } else if (isMinorRain) {
      const peak = 29;
      baseRainfall = 25 + 30 * Math.exp(-0.08 * (d - peak) ** 2);
    } else {
      baseRainfall = 5 + 10 * rand();
    }

    const rainfallMm = Math.max(0, baseRainfall + (rand() - 0.5) * 20);

    // Climatological rainfall (smoother envelope)
    let rainfallClim: number;
    if (isMajorRain) {
      rainfallClim = 40 + 40 * Math.exp(-0.04 * (d - 14) ** 2);
    } else if (isMinorRain) {
      rainfallClim = 30 + 25 * Math.exp(-0.06 * (d - 29) ** 2);
    } else {
      rainfallClim = 8 + 5 * Math.sin((d / 36) * Math.PI);
    }

    // Soil moisture responds to rainfall with a lag
    const baseSM = 0.15 + 0.25 * (rainfallMm / 80);
    const soilMoisture =
      Math.min(0.50, Math.max(0.08, baseSM + (rand() - 0.5) * 0.06));
    const smClim =
      0.15 + 0.25 * (rainfallClim / 80);

    // NDVI follows rainfall with ~2-dekad lag
    const laggedD = Math.max(1, d - 2);
    const lagIsMajor = laggedD >= 7 && laggedD <= 21;
    const lagIsMinor = laggedD >= 25 && laggedD <= 33;
    let baseNdvi: number;
    if (lagIsMajor) {
      baseNdvi = 0.45 + 0.35 * Math.exp(-0.03 * (laggedD - 16) ** 2);
    } else if (lagIsMinor) {
      baseNdvi = 0.40 + 0.25 * Math.exp(-0.05 * (laggedD - 31) ** 2);
    } else {
      baseNdvi = 0.20 + 0.10 * rand();
    }
    const ndvi = Math.min(0.95, Math.max(0.10, baseNdvi + (rand() - 0.5) * 0.08));
    const ndviClim = lagIsMajor
      ? 0.50 + 0.30 * Math.exp(-0.03 * (laggedD - 16) ** 2)
      : lagIsMinor
        ? 0.45 + 0.20 * Math.exp(-0.05 * (laggedD - 31) ** 2)
        : 0.25 + 0.05 * Math.sin((laggedD / 36) * Math.PI);

    // LST (land surface temperature) — inverse of rainfall/moisture
    const baseLst = isDry ? 38 + 4 * rand() : 30 + 4 * rand();
    const lstC = baseLst + (rand() - 0.5) * 3;
    const lstClim = isDry ? 37 : 31;

    // Simulate some missing data (cloud obscuration during heavy rain)
    const isCloudObscured = isMajorRain && rand() < 0.15;
    const isMissingSM = rand() < 0.05;

    observations.push({
      dekad: dekadId(d, year),
      dekadNumber: d,
      dateStart: start.toISOString().split("T")[0],
      dateEnd: end.toISOString().split("T")[0],
      rainfallMm: Math.round(rainfallMm * 10) / 10,
      rainfallClimatologyMm: Math.round(rainfallClim * 10) / 10,
      rainfallReliability:
        isDry ? null : Math.round((0.5 + 0.4 * rand()) * 100) / 100,
      soilMoisture: isMissingSM ? null : Math.round(soilMoisture * 1000) / 1000,
      soilMoistureClimatology: Math.round(smClim * 1000) / 1000,
      ndvi: isCloudObscured ? null : Math.round(ndvi * 1000) / 1000,
      ndviClimatology: Math.round(ndviClim * 1000) / 1000,
      lstC: isCloudObscured ? null : Math.round(lstC * 10) / 10,
      lstClimatologyC: lstClim,
      et0Mm: Math.round((3.5 + 2 * rand()) * 10) / 10,
      quality: {
        rainfallSource: "observed",
        soilMoistureSource: isMissingSM ? "missing" : "observed",
        ndviSource: isCloudObscured ? "cloud-obscured" : "observed",
        lstSource: isCloudObscured ? "cloud-obscured" : "observed",
      },
    });
  }

  return observations;
}

/* ─── Derive anomaly badges from observations ────────────────────────── */

export function deriveAnomalies(observations: DekadObservation[]): AnomalyBadge[] {
  const badges: AnomalyBadge[] = [];

  for (const obs of observations) {
    // Rainfall deficit: observed < 60% of climatology during rainy season
    if (
      obs.rainfallMm !== null &&
      obs.rainfallClimatologyMm !== null &&
      obs.rainfallClimatologyMm > 15 &&
      obs.rainfallMm < obs.rainfallClimatologyMm * 0.6
    ) {
      const deficitPct = Math.round(
        (1 - obs.rainfallMm / obs.rainfallClimatologyMm) * 100,
      );
      badges.push({
        id: `rain-def-${obs.dekad}`,
        category: "rainfall-deficit",
        severity: deficitPct > 50 ? "severe" : "moderate",
        dekadRange: { start: obs.dekad, end: obs.dekad },
        label: `Rainfall ${deficitPct}% below climatological mean`,
        variables: ["rainfall_mm"],
        observation: `Observed ${obs.rainfallMm.toFixed(1)} mm vs. ${obs.rainfallClimatologyMm.toFixed(1)} mm climatological mean.`,
        evidence: `Deficit exceeds 40% of the ${obs.rainfallClimatologyMm.toFixed(1)} mm dekad climatology (IMERG v07). Threshold: observed < 60% of climatological mean.`,
      });
    }

    // High temperature: LST > 40°C
    if (obs.lstC !== null && obs.lstC > 40) {
      badges.push({
        id: `heat-${obs.dekad}`,
        category: "high-temperature",
        severity: obs.lstC > 44 ? "severe" : "moderate",
        dekadRange: { start: obs.dekad, end: obs.dekad },
        label: `Land surface temperature ${obs.lstC.toFixed(1)}°C`,
        variables: ["lst_c"],
        observation: `LST ${obs.lstC.toFixed(1)}°C vs. ${obs.lstClimatologyC}°C climatological mean. Note: this is satellite-derived land surface temperature, not air temperature.`,
        evidence: `LST exceeds 40°C threshold. Land surface temperature can be significantly higher than air temperature, especially in bare or dry conditions.`,
      });
    }

    // Soil moisture deficit: anomaly > 0.08 below climatology
    if (
      obs.soilMoisture !== null &&
      obs.soilMoistureClimatology !== null &&
      obs.soilMoistureClimatology - obs.soilMoisture > 0.08
    ) {
      badges.push({
        id: `sm-def-${obs.dekad}`,
        category: "soil-moisture-deficit",
        severity:
          obs.soilMoistureClimatology - obs.soilMoisture > 0.12
            ? "severe"
            : "moderate",
        dekadRange: { start: obs.dekad, end: obs.dekad },
        label: `Soil moisture below historical range`,
        variables: ["soil_moisture"],
        observation: `Observed ${obs.soilMoisture.toFixed(3)} m³/m³ vs. ${obs.soilMoistureClimatology.toFixed(3)} m³/m³ climatology. SMAP measures top ~5 cm only.`,
        evidence: `Anomaly of ${(obs.soilMoistureClimatology - obs.soilMoisture).toFixed(3)} m³/m³ below climatological mean (SMAP L3 v8, 9 km resolution).`,
      });
    }

    // Vegetation decline: NDVI drop > 0.12 below climatology
    if (
      obs.ndvi !== null &&
      obs.ndviClimatology !== null &&
      obs.ndviClimatology - obs.ndvi > 0.12
    ) {
      badges.push({
        id: `veg-dec-${obs.dekad}`,
        category: "vegetation-decline",
        severity:
          obs.ndviClimatology - obs.ndvi > 0.20 ? "severe" : "moderate",
        dekadRange: { start: obs.dekad, end: obs.dekad },
        label: `Vegetation index below historical range`,
        variables: ["ndvi"],
        observation: `NDVI ${obs.ndvi.toFixed(3)} vs. ${obs.ndviClimatology.toFixed(3)} climatology. Low NDVI has multiple possible causes including harvest, cloud shadows, and natural senescence.`,
        evidence: `NDVI anomaly of ${(obs.ndviClimatology - obs.ndvi).toFixed(3)} below mean (MODIS MOD13Q1 v061, 250 m resolution).`,
      });
    }
  }

  return badges;
}

/* ─── Derive bare-field periods ──────────────────────────────────────── */

export function deriveBareFieldPeriods(
  observations: DekadObservation[],
): BareFieldPeriod[] {
  const NDVI_BARE_THRESHOLD = 0.25;
  const periods: BareFieldPeriod[] = [];
  let currentStart: DekadObservation | null = null;
  let currentDekads: DekadObservation[] = [];

  for (const obs of observations) {
    if (obs.ndvi !== null && obs.ndvi < NDVI_BARE_THRESHOLD) {
      if (!currentStart) currentStart = obs;
      currentDekads.push(obs);
    } else {
      if (currentStart && currentDekads.length > 0) {
        const lastObs = currentDekads[currentDekads.length - 1];
        const ndviValues = currentDekads
          .map((o) => o.ndvi)
          .filter((v): v is number => v !== null);
        const meanNdvi =
          ndviValues.length > 0
            ? ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length
            : null;

        // Check if this could be a known harvest/planting period
        const isMajorHarvest = currentDekads.some(
          (o) => o.dekadNumber >= 19 && o.dekadNumber <= 23,
        );
        const isDrySeason = currentDekads.some(
          (o) => o.dekadNumber >= 34 || o.dekadNumber <= 5,
        );

        let method: BareFieldPeriod["method"] = "ndvi-threshold";
        let confidence: BareFieldPeriod["confidence"] = "medium";
        let caveat: string | undefined;

        if (isMajorHarvest) {
          method = "combined";
          confidence = "medium";
          caveat =
            "This period overlaps with the expected major-season harvest. " +
            "Low NDVI may reflect post-harvest conditions rather than bare-field exposure.";
        } else if (isDrySeason) {
          method = "calendar-inferred";
          confidence = "high";
          caveat = undefined;
        } else {
          confidence = "low";
          caveat =
            "Low NDVI during an expected growing period. " +
            "Possible causes include cloud shadow, poor germination, or actual bare conditions. " +
            "Field verification recommended.";
        }

        periods.push({
          dekadStart: currentStart.dekad,
          dekadEnd: lastObs.dekad,
          durationDekads: currentDekads.length,
          meanNdvi: meanNdvi !== null ? Math.round(meanNdvi * 1000) / 1000 : null,
          method,
          confidence,
          caveat,
        });
      }
      currentStart = null;
      currentDekads = [];
    }
  }

  // Close any trailing period
  if (currentStart && currentDekads.length > 0) {
    const lastObs = currentDekads[currentDekads.length - 1];
    const ndviValues = currentDekads
      .map((o) => o.ndvi)
      .filter((v): v is number => v !== null);
    const meanNdvi =
      ndviValues.length > 0
        ? ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length
        : null;

    periods.push({
      dekadStart: currentStart.dekad,
      dekadEnd: lastObs.dekad,
      durationDekads: currentDekads.length,
      meanNdvi: meanNdvi !== null ? Math.round(meanNdvi * 1000) / 1000 : null,
      method: "ndvi-threshold",
      confidence: "medium",
      caveat:
        "Period extends to the end of the analysis window. " +
        "The actual duration of bare-field conditions may be longer.",
    });
  }

  return periods;
}

/* ─── Generate illustrative map timesteps ────────────────────────────── */

export function generateIllustrativeTimeSteps(year: number): MapTimeStep[] {
  const steps: MapTimeStep[] = [];
  for (let d = 1; d <= 36; d++) {
    const { label } = dekadToDateRange(d, year);
    steps.push({
      date: new Date(year, Math.floor((d - 1) / 3), ((d - 1) % 3) * 10 + 1)
        .toISOString()
        .split("T")[0],
      availableLayers: [
        "ndvi",
        "rainfall",
        "soil-moisture",
        ...(d === 1 ? (["srtm"] as const) : []),
      ],
      label: `${dekadId(d, year)}  (${label})`,
    });
  }
  // SRTM is static, always available
  steps.forEach((s) => {
    if (!s.availableLayers.includes("srtm")) {
      s.availableLayers.push("srtm");
    }
  });
  return steps;
}
