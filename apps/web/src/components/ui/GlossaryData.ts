import type { GlossaryTerm } from "./types";

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "NDVI",
    shortDefinition: "Normalized Difference Vegetation Index — a satellite-derived measure of vegetation greenness and density.",
    whyItMatters: "NDVI helps track crop growth, vegetation health, and seasonal changes. Higher values (0.3–0.8) indicate denser, healthier vegetation. Values below 0.25 often indicate bare soil or sparse cover.",
    practicalExample: "An NDVI drop from 0.6 to 0.3 during the growing season could signal crop stress, early harvest, or pest damage — but could also be cloud cover.",
    relatedTerms: ["Vegetation index", "Satellite imagery", "Crop health", "Bare-field period"],
  },
  {
    term: "ET",
    shortDefinition: "Evapotranspiration — the combined process of water evaporation from soil and transpiration from plants.",
    whyItMatters: "ET represents crop water demand. Reference ET (ET₀) is calculated from weather data; actual ET depends on crop type and soil moisture. High ET with low rainfall increases irrigation need.",
    practicalExample: "A maize crop during peak growth may have actual ET of 6–8 mm/day. If rainfall is only 2 mm/day, the deficit must come from soil moisture or irrigation.",
    relatedTerms: ["ET₀", "Crop water requirement", "Water balance", "Irrigation scheduling"],
  },
  {
    term: "Dry spell",
    shortDefinition: "A consecutive period of days with rainfall below a defined threshold (typically <1 mm/day).",
    whyItMatters: "Dry spells during critical growth stages (flowering, grain fill) can cause irreversible yield loss. The longest dry spell length is a key risk indicator for rainfed agriculture.",
    practicalExample: "A 15-day dry spell during maize silking can reduce yields by 20–40%, even if seasonal rainfall totals are normal.",
    relatedTerms: ["Rainfall reliability", "Water stress", "Crop growth stage", "Drought"],
  },
  {
    term: "Bare-field period",
    shortDefinition: "A period when agricultural land lacks sufficient vegetation cover (NDVI < 0.25), leaving soil exposed to erosion.",
    whyItMatters: "Bare fields are vulnerable to wind and rain erosion, nutrient loss, and moisture depletion. Long bare periods between crops degrade soil health over time.",
    practicalExample: "After maize harvest in July, fields may remain bare until the next planting in March — an 8-month exposure window.",
    relatedTerms: ["NDVI", "Soil erosion", "Cover crops", "Crop calendar"],
  },
  {
    term: "Soil moisture anomaly",
    shortDefinition: "The difference between observed soil moisture and the historical average (climatology) for the same period.",
    whyItMatters: "Positive anomalies indicate wetter-than-normal conditions (flood risk, delayed planting); negative anomalies indicate drought stress. SMAP measures only the top ~5 cm.",
    practicalExample: "A -0.15 m³/m³ anomaly in April means the topsoil is significantly drier than usual for planting season, potentially delaying germination.",
    relatedTerms: ["SMAP", "Climatology", "Root zone moisture", "Drought monitoring"],
  },
  {
    term: "Rainfall reliability",
    shortDefinition: "The fraction of historical years in which rainfall met or exceeded a threshold (e.g., 20 mm/dekad) for a given period.",
    whyItMatters: "High reliability (>70%) means farmers can plan with confidence; low reliability (<30%) signals high risk. It captures variability that seasonal totals miss.",
    practicalExample: "If early-season dekads have 80% reliability, planting can proceed on schedule. If reliability drops to 40%, delayed or staggered planting reduces risk.",
    relatedTerms: ["Dekad", "Climatology", "Planting window", "Risk management"],
  },
  {
    term: "Dekad",
    shortDefinition: "A 10-day period used in agricultural meteorology. Each month has 3 dekads (1–10, 11–20, 21–end of month).",
    whyItMatters: "Dekads align better with crop growth cycles than monthly data. They capture within-month variability critical for planting decisions and stress detection.",
    practicalExample: "Dekad 7 (March 1–10) often marks the onset of major rains in West Africa. A delay to Dekad 10 shifts the entire growing calendar.",
    relatedTerms: ["Pentad", "Agricultural calendar", "Rainfall onset", "Growing season"],
  },
  {
    term: "Nitrogen fixation",
    shortDefinition: "The biological process by which legumes convert atmospheric nitrogen (N₂) into plant-available forms through root-nodule bacteria.",
    whyItMatters: "Legumes in rotation reduce synthetic fertilizer needs, improve soil fertility, and break pest cycles. The amount fixed depends on species, soil conditions, and inoculation.",
    practicalExample: "Soybean can fix 50–150 kg N/ha per season, reducing the next maize crop's fertilizer requirement by 30–50%.",
    relatedTerms: ["Crop rotation", "Legumes", "Soil fertility", "Green manure"],
  },
  {
    term: "Crop rotation",
    shortDefinition: "The practice of growing different crops in sequence on the same land to improve soil health, break pest cycles, and manage nutrients.",
    whyItMatters: "Diverse rotations increase resilience to climate variability, reduce input costs, and maintain long-term productivity compared to continuous monoculture.",
    practicalExample: "Maize → Soybean → Maize → Cover crop rotation builds soil nitrogen, disrupts maize pests, and provides ground cover.",
    relatedTerms: ["Monoculture", "Intercropping", "Soil health", "Pest management"],
  },
  {
    term: "Environmental anomaly",
    shortDefinition: "A condition that deviates significantly from the historical norm (climatology) for a given variable, period, and location.",
    whyItMatters: "Anomalies highlight unusual conditions that may stress crops or indicate changing climate patterns. They are flagged using statistical thresholds (e.g., >2 standard deviations).",
    practicalExample: "A rainfall deficit of 60% below climatology in Dekad 15 would be flagged as a severe rainfall-deficit anomaly.",
    relatedTerms: ["Climatology", "Threshold", "Standard deviation", "Anomaly detection"],
  },
  {
    term: "Spatial resolution",
    shortDefinition: "The ground area represented by a single pixel in a satellite image (e.g., 250 m for MODIS NDVI, 9 km for SMAP soil moisture).",
    whyItMatters: "Resolution determines whether data can resolve individual fields. A 9 km pixel mixes the farm with surrounding land; a 30 m pixel (Landsat) can distinguish field boundaries.",
    practicalExample: "For a 10 ha farm, MODIS NDVI (6.25 ha/pixel) provides 1–2 pixels; Landsat (0.09 ha/pixel) provides ~100 pixels — enabling within-field analysis.",
    relatedTerms: ["Pixel footprint", "Scale honesty", "Mixed pixel", "Remote sensing"],
  },
  {
    term: "Monte Carlo simulation",
    shortDefinition: "A computational technique that runs thousands of simulations with randomly varied inputs to estimate probability distributions of outcomes.",
    whyItMatters: "In crop strategy ranking, Monte Carlo reveals how often each strategy ranks best under uncertainty in scores and weights — not just the single 'best' score.",
    practicalExample: "Strategy A scores 0.68 vs Strategy B's 0.65, but Monte Carlo shows B ranks first in 55% of simulations due to lower uncertainty — B is more robust.",
    relatedTerms: ["Uncertainty quantification", "Probability distribution", "Rank probability", "Decision support"],
  },
];

export function getGlossaryTerm(term: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.term.toLowerCase() === term.toLowerCase());
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(lowerQuery) ||
      t.shortDefinition.toLowerCase().includes(lowerQuery) ||
      t.whyItMatters.toLowerCase().includes(lowerQuery) ||
      t.relatedTerms?.some((rt) => rt.toLowerCase().includes(lowerQuery))
  );
}