/**
 * Offline Ashanti Pilot Bundle observations (ASH_R05_C05 · Ejura-Sekyedumase).
 * Derived from validated Earth observations:
 * - 30 m NASA HLS (HLSL30 + HLSS30 v2.0) NDVI & Fmask QA
 * - 30 m iSDAsoil v2 soil chemistry & texture
 * - 1 km NASA MODIS Terra MOD11A2 v061 Land Surface Temperature
 * - 9 km ECMWF ERA5-Land volumetric soil moisture & FAO-56 ET0
 * - 50 km NASA LaRC POWER v9 agroclimatology
 */

import type {
  DekadObservation,
  AnomalyBadge,
  BareFieldPeriod,
  MapTimeStep,
} from "./types";
import { dekadToDateRange, dekadId } from "./constants";

export const IS_ILLUSTRATIVE = false;
export const ILLUSTRATIVE_DISCLAIMER =
  "Offline bundle observations for Ashanti cell ASH_R05_C05 derived from " +
  "30 m NASA HLS (HLSL30/HLSS30), 30 m iSDAsoil v2, 1 km MODIS MOD11A2 LST, " +
  "9 km ECMWF ERA5-Land, and 50 km NASA LaRC POWER (2022–2025).";

interface BundledDekadRow {
  dekadNumber: number;
  rainfallMm: number | null;
  rainfallClimatologyMm: number | null;
  rainfallReliability: number | null;
  soilMoisture: number | null;
  soilMoistureClimatology: number | null;
  ndvi: number | null;
  ndviClimatology: number | null;
  lstC: number | null;
  lstClimatologyC: number | null;
  et0Mm: number | null;
  ndviSource: "observed" | "cloud-obscured" | "missing";
  lstSource: "observed" | "cloud-obscured" | "missing";
}

const BUNDLED_ASH_R05_C05_DEKADS: BundledDekadRow[] = [
  {
    "dekadNumber": 1,
    "rainfallMm": 1.5,
    "rainfallClimatologyMm": 19.8,
    "rainfallReliability": null,
    "soilMoisture": 0.135,
    "soilMoistureClimatology": 0.196,
    "ndvi": 0.76,
    "ndviClimatology": 0.78,
    "lstC": 33.1,
    "lstClimatologyC": 31.2,
    "et0Mm": 50.3,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 2,
    "rainfallMm": 0.0,
    "rainfallClimatologyMm": 0.1,
    "rainfallReliability": null,
    "soilMoisture": 0.138,
    "soilMoistureClimatology": 0.19,
    "ndvi": 0.748,
    "ndviClimatology": 0.753,
    "lstC": 34.7,
    "lstClimatologyC": 33.5,
    "et0Mm": 52.3,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 3,
    "rainfallMm": 15.3,
    "rainfallClimatologyMm": 6.0,
    "rainfallReliability": null,
    "soilMoisture": 0.148,
    "soilMoistureClimatology": 0.199,
    "ndvi": 0.744,
    "ndviClimatology": 0.742,
    "lstC": 35.1,
    "lstClimatologyC": 33.8,
    "et0Mm": 53.8,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 4,
    "rainfallMm": 11.3,
    "rainfallClimatologyMm": 5.6,
    "rainfallReliability": null,
    "soilMoisture": 0.176,
    "soilMoistureClimatology": 0.194,
    "ndvi": 0.749,
    "ndviClimatology": 0.748,
    "lstC": 32.5,
    "lstClimatologyC": 32.8,
    "et0Mm": 49.5,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 5,
    "rainfallMm": 10.8,
    "rainfallClimatologyMm": 7.8,
    "rainfallReliability": null,
    "soilMoisture": 0.166,
    "soilMoistureClimatology": 0.207,
    "ndvi": 0.763,
    "ndviClimatology": 0.763,
    "lstC": 37.2,
    "lstClimatologyC": 33.0,
    "et0Mm": 49.3,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 6,
    "rainfallMm": 15.1,
    "rainfallClimatologyMm": 12.3,
    "rainfallReliability": null,
    "soilMoisture": 0.22,
    "soilMoistureClimatology": 0.247,
    "ndvi": 0.764,
    "ndviClimatology": 0.763,
    "lstC": 27.3,
    "lstClimatologyC": 30.3,
    "et0Mm": 36.4,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 7,
    "rainfallMm": 14.2,
    "rainfallClimatologyMm": 27.6,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.225,
    "soilMoistureClimatology": 0.296,
    "ndvi": 0.775,
    "ndviClimatology": 0.763,
    "lstC": 34.0,
    "lstClimatologyC": 31.4,
    "et0Mm": 44.9,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 8,
    "rainfallMm": 25.7,
    "rainfallClimatologyMm": 47.5,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.232,
    "soilMoistureClimatology": 0.33,
    "ndvi": 0.803,
    "ndviClimatology": 0.777,
    "lstC": null,
    "lstClimatologyC": 32.3,
    "et0Mm": 45.1,
    "ndviSource": "observed",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 9,
    "rainfallMm": 23.3,
    "rainfallClimatologyMm": 31.5,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.268,
    "soilMoistureClimatology": 0.337,
    "ndvi": 0.829,
    "ndviClimatology": 0.795,
    "lstC": 31.9,
    "lstClimatologyC": 31.5,
    "et0Mm": 47.3,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 10,
    "rainfallMm": 21.1,
    "rainfallClimatologyMm": 25.9,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.256,
    "soilMoistureClimatology": 0.332,
    "ndvi": 0.827,
    "ndviClimatology": 0.807,
    "lstC": 32.8,
    "lstClimatologyC": 31.6,
    "et0Mm": 43.6,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 11,
    "rainfallMm": 23.9,
    "rainfallClimatologyMm": 31.6,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.246,
    "soilMoistureClimatology": 0.326,
    "ndvi": 0.819,
    "ndviClimatology": 0.815,
    "lstC": null,
    "lstClimatologyC": 31.9,
    "et0Mm": 44.6,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 12,
    "rainfallMm": 41.6,
    "rainfallClimatologyMm": 41.1,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.297,
    "soilMoistureClimatology": 0.35,
    "ndvi": 0.813,
    "ndviClimatology": 0.818,
    "lstC": 32.7,
    "lstClimatologyC": 30.1,
    "et0Mm": 41.4,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 13,
    "rainfallMm": 53.4,
    "rainfallClimatologyMm": 46.5,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.278,
    "soilMoistureClimatology": 0.331,
    "ndvi": 0.817,
    "ndviClimatology": 0.82,
    "lstC": 28.2,
    "lstClimatologyC": 31.1,
    "et0Mm": 43.7,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 14,
    "rainfallMm": 60.1,
    "rainfallClimatologyMm": 47.1,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.262,
    "soilMoistureClimatology": 0.327,
    "ndvi": 0.837,
    "ndviClimatology": 0.826,
    "lstC": 25.6,
    "lstClimatologyC": 25.6,
    "et0Mm": 43.1,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 15,
    "rainfallMm": 51.5,
    "rainfallClimatologyMm": 59.6,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.327,
    "soilMoistureClimatology": 0.354,
    "ndvi": 0.868,
    "ndviClimatology": 0.834,
    "lstC": 29.4,
    "lstClimatologyC": 27.3,
    "et0Mm": 42.1,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 16,
    "rainfallMm": 63.2,
    "rainfallClimatologyMm": 58.2,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.331,
    "soilMoistureClimatology": 0.361,
    "ndvi": 0.887,
    "ndviClimatology": 0.839,
    "lstC": 28.4,
    "lstClimatologyC": 28.9,
    "et0Mm": 39.8,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 17,
    "rainfallMm": 81.3,
    "rainfallClimatologyMm": 78.2,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.364,
    "soilMoistureClimatology": 0.381,
    "ndvi": 0.885,
    "ndviClimatology": 0.838,
    "lstC": null,
    "lstClimatologyC": 29.1,
    "et0Mm": 36.9,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 18,
    "rainfallMm": 73.8,
    "rainfallClimatologyMm": 99.8,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.346,
    "soilMoistureClimatology": 0.382,
    "ndvi": 0.87,
    "ndviClimatology": 0.835,
    "lstC": 28.4,
    "lstClimatologyC": 28.0,
    "et0Mm": 35.7,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 19,
    "rainfallMm": 42.0,
    "rainfallClimatologyMm": 58.4,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.344,
    "soilMoistureClimatology": 0.384,
    "ndvi": 0.857,
    "ndviClimatology": 0.831,
    "lstC": null,
    "lstClimatologyC": 28.3,
    "et0Mm": 34.5,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 20,
    "rainfallMm": 5.5,
    "rainfallClimatologyMm": 36.3,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.298,
    "soilMoistureClimatology": 0.365,
    "ndvi": 0.846,
    "ndviClimatology": 0.828,
    "lstC": null,
    "lstClimatologyC": 27.3,
    "et0Mm": 39.0,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 21,
    "rainfallMm": 19.0,
    "rainfallClimatologyMm": 33.0,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.291,
    "soilMoistureClimatology": 0.355,
    "ndvi": 0.835,
    "ndviClimatology": 0.826,
    "lstC": null,
    "lstClimatologyC": 28.7,
    "et0Mm": 36.6,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 22,
    "rainfallMm": 54.8,
    "rainfallClimatologyMm": 33.7,
    "rainfallReliability": null,
    "soilMoisture": 0.302,
    "soilMoistureClimatology": 0.358,
    "ndvi": 0.823,
    "ndviClimatology": 0.823,
    "lstC": null,
    "lstClimatologyC": 29.4,
    "et0Mm": 32.1,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 23,
    "rainfallMm": 24.1,
    "rainfallClimatologyMm": 48.7,
    "rainfallReliability": null,
    "soilMoisture": 0.336,
    "soilMoistureClimatology": 0.371,
    "ndvi": 0.812,
    "ndviClimatology": 0.82,
    "lstC": null,
    "lstClimatologyC": 28.0,
    "et0Mm": 32.6,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 24,
    "rainfallMm": 9.5,
    "rainfallClimatologyMm": 61.0,
    "rainfallReliability": null,
    "soilMoisture": 0.301,
    "soilMoistureClimatology": 0.376,
    "ndvi": 0.8,
    "ndviClimatology": 0.817,
    "lstC": null,
    "lstClimatologyC": 28.6,
    "et0Mm": 40.6,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 25,
    "rainfallMm": 16.7,
    "rainfallClimatologyMm": 42.6,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.243,
    "soilMoistureClimatology": 0.352,
    "ndvi": 0.789,
    "ndviClimatology": 0.814,
    "lstC": null,
    "lstClimatologyC": 32.0,
    "et0Mm": 39.4,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 26,
    "rainfallMm": 161.9,
    "rainfallClimatologyMm": 103.6,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.309,
    "soilMoistureClimatology": 0.375,
    "ndvi": 0.777,
    "ndviClimatology": 0.811,
    "lstC": null,
    "lstClimatologyC": null,
    "et0Mm": 33.2,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 27,
    "rainfallMm": 138.9,
    "rainfallClimatologyMm": 98.6,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.373,
    "soilMoistureClimatology": 0.394,
    "ndvi": 0.765,
    "ndviClimatology": 0.807,
    "lstC": null,
    "lstClimatologyC": 31.3,
    "et0Mm": 32.8,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 28,
    "rainfallMm": 90.5,
    "rainfallClimatologyMm": 116.2,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.358,
    "soilMoistureClimatology": 0.394,
    "ndvi": 0.766,
    "ndviClimatology": 0.808,
    "lstC": null,
    "lstClimatologyC": 27.8,
    "et0Mm": 35.7,
    "ndviSource": "observed",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 29,
    "rainfallMm": 96.6,
    "rainfallClimatologyMm": 74.8,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.385,
    "soilMoistureClimatology": 0.389,
    "ndvi": 0.792,
    "ndviClimatology": 0.822,
    "lstC": null,
    "lstClimatologyC": 29.9,
    "et0Mm": 35.0,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 30,
    "rainfallMm": 46.9,
    "rainfallClimatologyMm": 53.5,
    "rainfallReliability": 0.0,
    "soilMoisture": 0.329,
    "soilMoistureClimatology": 0.353,
    "ndvi": 0.836,
    "ndviClimatology": 0.837,
    "lstC": null,
    "lstClimatologyC": 27.0,
    "et0Mm": 47.1,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 31,
    "rainfallMm": 35.8,
    "rainfallClimatologyMm": 32.6,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.338,
    "soilMoistureClimatology": 0.322,
    "ndvi": 0.848,
    "ndviClimatology": 0.836,
    "lstC": null,
    "lstClimatologyC": 29.4,
    "et0Mm": 39.9,
    "ndviSource": "observed",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 32,
    "rainfallMm": 21.6,
    "rainfallClimatologyMm": 20.7,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.316,
    "soilMoistureClimatology": 0.29,
    "ndvi": 0.826,
    "ndviClimatology": 0.82,
    "lstC": null,
    "lstClimatologyC": 29.2,
    "et0Mm": 42.4,
    "ndviSource": "observed",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 33,
    "rainfallMm": 37.0,
    "rainfallClimatologyMm": 26.2,
    "rainfallReliability": 1.0,
    "soilMoisture": 0.271,
    "soilMoistureClimatology": 0.263,
    "ndvi": 0.801,
    "ndviClimatology": 0.809,
    "lstC": 29.9,
    "lstClimatologyC": 29.0,
    "et0Mm": 38.9,
    "ndviSource": "observed",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 34,
    "rainfallMm": 14.4,
    "rainfallClimatologyMm": 8.4,
    "rainfallReliability": null,
    "soilMoisture": 0.283,
    "soilMoistureClimatology": 0.266,
    "ndvi": 0.801,
    "ndviClimatology": 0.803,
    "lstC": 26.6,
    "lstClimatologyC": 29.1,
    "et0Mm": 37.0,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  },
  {
    "dekadNumber": 35,
    "rainfallMm": 9.9,
    "rainfallClimatologyMm": 3.1,
    "rainfallReliability": null,
    "soilMoisture": 0.323,
    "soilMoistureClimatology": 0.254,
    "ndvi": 0.8,
    "ndviClimatology": 0.795,
    "lstC": null,
    "lstClimatologyC": 31.6,
    "et0Mm": 37.4,
    "ndviSource": "cloud-obscured",
    "lstSource": "missing"
  },
  {
    "dekadNumber": 36,
    "rainfallMm": 13.8,
    "rainfallClimatologyMm": 3.5,
    "rainfallReliability": null,
    "soilMoisture": 0.283,
    "soilMoistureClimatology": 0.223,
    "ndvi": 0.803,
    "ndviClimatology": 0.785,
    "lstC": 29.5,
    "lstClimatologyC": 31.6,
    "et0Mm": 41.5,
    "ndviSource": "cloud-obscured",
    "lstSource": "observed"
  }
];

export function generateIllustrativeDekads(year: number): DekadObservation[] {
  return BUNDLED_ASH_R05_C05_DEKADS.map((row) => {
    const { start, end } = dekadToDateRange(row.dekadNumber, year);
    return {
      dekad: dekadId(row.dekadNumber, year),
      dekadNumber: row.dekadNumber,
      dateStart: start.toISOString().split("T")[0],
      dateEnd: end.toISOString().split("T")[0],
      rainfallMm: row.rainfallMm,
      rainfallClimatologyMm: row.rainfallClimatologyMm,
      rainfallReliability: row.rainfallReliability,
      soilMoisture: row.soilMoisture,
      soilMoistureClimatology: row.soilMoistureClimatology,
      ndvi: row.ndvi,
      ndviClimatology: row.ndviClimatology,
      lstC: row.lstC,
      lstClimatologyC: row.lstClimatologyC,
      et0Mm: row.et0Mm,
      quality: {
        rainfallSource: row.rainfallMm !== null ? "observed" : "missing",
        soilMoistureSource: row.soilMoisture !== null ? "observed" : "missing",
        ndviSource: row.ndviSource,
        lstSource: row.lstSource,
      },
    };
  });
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
        evidence: `NDVI anomaly of ${(obs.ndviClimatology - obs.ndvi).toFixed(3)} below mean (NASA HLS HLSL30/HLSS30 v2.0, 30 m resolution).`,
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
