import type {
  DecisionLogRecord,
  DekadWindowSummary,
  EvidencePassport,
  GlossaryItem,
  OutcomeReportRecord,
  PilotCell,
  RotationStrategySpec,
  ScaleHonestyEntry,
  SeasonFeatureSummary,
} from "@/types/database";

export const DEFAULT_FARM_AREA_HA = 2.0;

export const SCORING_CRITERIA: readonly [string, string, string, string] = [
  "Water efficiency",
  "Soil health",
  "Erosion protection",
  "Income & market",
];

export const PRIORITY_PRESETS: {
  id: string;
  labelKey: string;
  weights: [number, number, number, number];
}[] = [
  { id: "balanced", labelKey: "presetBalanced", weights: [0.25, 0.25, 0.25, 0.25] },
  { id: "water", labelKey: "presetWater", weights: [0.45, 0.25, 0.2, 0.1] },
  { id: "soil", labelKey: "presetSoil", weights: [0.2, 0.35, 0.35, 0.1] },
  { id: "income", labelKey: "presetIncome", weights: [0.2, 0.2, 0.15, 0.45] },
];

function makeCellPolygon(lat: number, lon: number, halfDeg = 0.024): [number, number][] {
  return [
    [lon - halfDeg, lat - halfDeg],
    [lon + halfDeg, lat - halfDeg],
    [lon + halfDeg, lat + halfDeg],
    [lon - halfDeg, lat + halfDeg],
    [lon - halfDeg, lat - halfDeg],
  ];
}

export const ASHANTI_PILOT_CELLS: PilotCell[] = [
  {
    cell_id: "ASH_R05_C05",
    region_name: "Ejura-Kumasi Forest-Transition Corridor",
    row_idx: 5,
    col_idx: 5,
    centre_lat: 6.875,
    centre_lon: -1.425,
    elevation_m: 340.0,
    slope_pct: 3.08,
    soil_texture: "Sandy clay loam",
    soil_organic_carbon_g_kg: 12.5,
    soil_ph: 5.5,
    typical_annual_rain_mm: 1426,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.875, -1.425),
  },
  {
    cell_id: "ASH_R04_C04",
    region_name: "Mampong-Sekyere Upland Transition",
    row_idx: 4,
    col_idx: 4,
    centre_lat: 6.825,
    centre_lon: -1.475,
    elevation_m: 301.0,
    slope_pct: 3.68,
    soil_texture: "Sandy loam",
    soil_organic_carbon_g_kg: 9.0,
    soil_ph: 5.5,
    typical_annual_rain_mm: 1426,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.825, -1.475),
  },
  {
    cell_id: "ASH_R06_C06",
    region_name: "Offinso-Afigya Mixed Cropping Belt",
    row_idx: 6,
    col_idx: 6,
    centre_lat: 6.925,
    centre_lon: -1.375,
    elevation_m: 321.0,
    slope_pct: 4.03,
    soil_texture: "Sandy loam",
    soil_organic_carbon_g_kg: 9.0,
    soil_ph: 5.6,
    typical_annual_rain_mm: 1426,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.925, -1.375),
  },
  {
    cell_id: "ASH_R05_C04",
    region_name: "Sekyere Central Transition Corridor",
    row_idx: 5,
    col_idx: 4,
    centre_lat: 6.875,
    centre_lon: -1.475,
    elevation_m: 296.0,
    slope_pct: 0.72,
    soil_texture: "Sandy clay loam",
    soil_organic_carbon_g_kg: 10.0,
    soil_ph: 5.6,
    typical_annual_rain_mm: 1426,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.875, -1.475),
  },
  {
    cell_id: "ASH_R04_C05",
    region_name: "Ejura South Agro-Ecological Belt",
    row_idx: 4,
    col_idx: 5,
    centre_lat: 6.825,
    centre_lon: -1.425,
    elevation_m: 312.0,
    slope_pct: 1.01,
    soil_texture: "Sandy clay loam",
    soil_organic_carbon_g_kg: 11.2,
    soil_ph: 5.7,
    typical_annual_rain_mm: 1426,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.825, -1.425),
  },
];

export const SCALE_HONESTY_DATASETS: {
  dataset: string;
  nativeResolutionKm: number;
  note: string;
}[] = [
  {
    dataset: "GEDI L2B (canopy structure)",
    nativeResolutionKm: 0.025,
    note: "25 m sparse LiDAR footprints capture perennial shade cover, not weekly field phenology.",
  },
  {
    dataset: "HLS / Landsat & iSDAsoil (30 m)",
    nativeResolutionKm: 0.03,
    note: "30 m pixels resolve multi-hectare plots when cloud-free and anchor topsoil SOC/pH priors.",
  },
  {
    dataset: "MODIS / SoilGrids (250 m)",
    nativeResolutionKm: 0.25,
    note: "250 m pixel blends neighbouring smallholder fields; verify soil on-site.",
  },
  {
    dataset: "SMAP L3 / L4 (surface & root moisture)",
    nativeResolutionKm: 9.0,
    note: "9 km footprint gives sub-regional drought context (~81 km²), not single-plot moisture.",
  },
  {
    dataset: "GPM IMERG V07B (rainfall)",
    nativeResolutionKm: 10.0,
    note: "10 km grid tracks regional storms; check against local rain gauges.",
  },
  {
    dataset: "NASA POWER (agroclimate baseline)",
    nativeResolutionKm: 50.0,
    note: "50 km grid; background thermal & radiation trend context only.",
  },
];

export function evaluateScaleHonesty(farmAreaHa: number): ScaleHonestyEntry[] {
  const safeHa = Math.max(0.25, farmAreaHa);
  const farmAreaKm2 = safeHa / 100;

  return SCALE_HONESTY_DATASETS.map((item) => {
    const pixelAreaKm2 = item.nativeResolutionKm ** 2;
    const ratio = pixelAreaKm2 / farmAreaKm2;
    const resolvesFarm = ratio <= 1.0;
    const advisoryTier: ScaleHonestyEntry["advisoryTier"] = resolvesFarm
      ? "field_scale"
      : ratio <= 25
        ? "sub_regional"
        : "regional_context_only";

    return {
      dataset: item.dataset,
      nativeResolutionKm: item.nativeResolutionKm,
      pixelAreaKm2,
      resolvesFarm,
      advisoryTier,
      note: item.note,
    };
  });
}

export const SEASONAL_VULNERABILITY_CALENDAR: DekadWindowSummary[] = [
  {
    id: "jan",
    dekadIndex: 2,
    monthLabel: "Jan",
    dekadRange: "D01–D03",
    seasonLabel: "Harmattan Dry Season",
    rainReliability: "Low",
    rainMm: 14,
    et0Mm: 142,
    smapAnomalyZ: -1.15,
    ndviSmooth: 0.23,
    bareFieldRisk: true,
    qaTier: "high",
    summaryNote: "Dry soils and exposed topsoil risk wind and early-storm erosion.",
    summaryNoteTw: "Nsuo sua na asase ho da hɔ; mframa ne nsuo a edi kan betumi aprapra asase.",
  },
  {
    id: "feb",
    dekadIndex: 5,
    monthLabel: "Feb",
    dekadRange: "D04–D06",
    seasonLabel: "Pre-Onset Clearing",
    rainReliability: "Low",
    rainMm: 36,
    et0Mm: 148,
    smapAnomalyZ: -0.92,
    ndviSmooth: 0.22,
    bareFieldRisk: true,
    qaTier: "high",
    summaryNote: "Peak land preparation; slash-and-clear without mulch leaves soil bare.",
    summaryNoteTw: "Afumdwuma bere; sɛ wɔnhyɛ asase so nkatae a, asase da hɔ kwa.",
  },
  {
    id: "mar",
    dekadIndex: 8,
    monthLabel: "Mar",
    dekadRange: "D07–D09",
    seasonLabel: "Major Season Onset",
    rainReliability: "Moderate",
    rainMm: 112,
    et0Mm: 136,
    smapAnomalyZ: -0.2,
    ndviSmooth: 0.31,
    bareFieldRisk: false,
    qaTier: "moderate",
    summaryNote: "Variable onset; false starts can stress early maize germination.",
    summaryNoteTw: "Nsuo fi ase brɛoo; ɛtɔ da a etumi twa so na ɛhaw aburo a wɔadua no foforɔ.",
  },
  {
    id: "apr",
    dekadIndex: 11,
    monthLabel: "Apr",
    dekadRange: "D10–D12",
    seasonLabel: "Major Growing Window",
    rainReliability: "High",
    rainMm: 158,
    et0Mm: 124,
    smapAnomalyZ: 0.45,
    ndviSmooth: 0.49,
    bareFieldRisk: false,
    qaTier: "moderate",
    summaryNote: "Moisture builds rapidly; heavy storms risk runoff on slopes.",
    summaryNoteTw: "Nsuo dɔɔso ntɛm; nsuo a emu yɛ duru betumi asɛe bepɔw ase asase.",
  },
  {
    id: "may",
    dekadIndex: 14,
    monthLabel: "May",
    dekadRange: "D13–D15",
    seasonLabel: "Major Peak Canopy",
    rainReliability: "High",
    rainMm: 194,
    et0Mm: 116,
    smapAnomalyZ: 0.88,
    ndviSmooth: 0.67,
    bareFieldRisk: false,
    qaTier: "low_cloud_gap",
    summaryNote: "Dense canopy cover; heavy cloud leaves optical NDVI gaps.",
    summaryNoteTw: "Ahaban kata asase so kama; mununkum ma satellite mfonini ho yɛ na.",
  },
  {
    id: "jun",
    dekadIndex: 17,
    monthLabel: "Jun",
    dekadRange: "D16–D18",
    seasonLabel: "Major Peak Rain",
    rainReliability: "High",
    rainMm: 215,
    et0Mm: 108,
    smapAnomalyZ: 1.12,
    ndviSmooth: 0.72,
    bareFieldRisk: false,
    qaTier: "low_cloud_gap",
    summaryNote: "Wettest dekads; cloud gaps mitigated via Savitzky-Golay QA smoothing.",
    summaryNoteTw: "Nsuo tɔ paa wɔ saa bere yi mu; yɛde akontaabu siesie mununkum mu nsɛm.",
  },
  {
    id: "jul",
    dekadIndex: 20,
    monthLabel: "Jul",
    dekadRange: "D19–D21",
    seasonLabel: "Major Maturation / Harvest",
    rainReliability: "Moderate",
    rainMm: 118,
    et0Mm: 112,
    smapAnomalyZ: 0.35,
    ndviSmooth: 0.56,
    bareFieldRisk: false,
    qaTier: "moderate",
    summaryNote: "Late-July dry transition begins after grain fill.",
    summaryNoteTw: "Aburo nyin wie na awɔw bere tiawa fi ase wɔ Kitawonsa awiei.",
  },
  {
    id: "aug",
    dekadIndex: 23,
    monthLabel: "Aug",
    dekadRange: "D22–D24",
    seasonLabel: "Mid-Year Short Dry Dip",
    rainReliability: "Low",
    rainMm: 62,
    et0Mm: 119,
    smapAnomalyZ: -0.45,
    ndviSmooth: 0.27,
    bareFieldRisk: true,
    qaTier: "moderate",
    summaryNote: "Post-harvest clearing leaves residue exposed before minor rains.",
    summaryNoteTw: "Otwa akyi no, asase da hɔ kwa ansa na nsuo a ɛtɔ so mmienu no afi ase.",
  },
  {
    id: "sep",
    dekadIndex: 26,
    monthLabel: "Sep",
    dekadRange: "D25–D27",
    seasonLabel: "Minor Season Establishment",
    rainReliability: "Moderate",
    rainMm: 152,
    et0Mm: 115,
    smapAnomalyZ: 0.52,
    ndviSmooth: 0.48,
    bareFieldRisk: false,
    qaTier: "low_cloud_gap",
    summaryNote: "Short window favours 65–80 day cowpea or fast-cover legumes.",
    summaryNoteTw: "Nsuo bere tiawa yi fata adua (cowpea) a enyin ntɛm nna 65–80.",
  },
  {
    id: "oct",
    dekadIndex: 29,
    monthLabel: "Oct",
    dekadRange: "D28–D30",
    seasonLabel: "Minor Peak Rain",
    rainReliability: "High",
    rainMm: 164,
    et0Mm: 118,
    smapAnomalyZ: 0.78,
    ndviSmooth: 0.61,
    bareFieldRisk: false,
    qaTier: "moderate",
    summaryNote: "Reliable October showers support pod fill and cover establishment.",
    summaryNoteTw: "Obubuo nsuo boa ma aduaba ne adua nyin yiye.",
  },
  {
    id: "nov",
    dekadIndex: 32,
    monthLabel: "Nov",
    dekadRange: "D31–D33",
    seasonLabel: "Minor Cessation",
    rainReliability: "Low",
    rainMm: 54,
    et0Mm: 126,
    smapAnomalyZ: -0.25,
    ndviSmooth: 0.39,
    bareFieldRisk: false,
    qaTier: "high",
    summaryNote: "Rapid moisture drawdown; deep-rooted cover crops retain cover.",
    summaryNoteTw: "Nsuo we ntɛm; nnua nketewa a ne ntini kɔ fam kura fɔm.",
  },
  {
    id: "dec",
    dekadIndex: 35,
    monthLabel: "Dec",
    dekadRange: "D34–D36",
    seasonLabel: "Harmattan Dry Onset",
    rainReliability: "Low",
    rainMm: 18,
    et0Mm: 138,
    smapAnomalyZ: -0.95,
    ndviSmooth: 0.25,
    bareFieldRisk: true,
    qaTier: "high",
    summaryNote: "Bare-soil exposure rises sharply without surface mulch residue.",
    summaryNoteTw: "Harimatan mframa ma asase ho da hɔ sɛ nkatae nni so a.",
  },
];

export const SEASON_FEATURES_BY_CELL: Record<string, SeasonFeatureSummary> = {
  ASH_R05_C05: {
    cell_id: "ASH_R05_C05",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 33,
    total_rain_mm: 1425.9,
    rain_cv: 0.93,
    longest_dry_spell_days: 22,
    heavy_rain_days: 6,
    heat_stress_days: 121,
    mean_sm_anomaly_z: 0.0,
    ndvi_peak: 0.89,
    bare_period_fraction: 0.0,
    erosion_exposure_index: 0.09,
    anomaly_score_m1: 0.57,
    is_anomalous_season: false,
    cluster_label_m2: "Balanced Bimodal Transition",
    trend_sen_slope_mm_yr: -78.5,
  },
  ASH_R04_C04: {
    cell_id: "ASH_R04_C04",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 33,
    total_rain_mm: 1425.9,
    rain_cv: 0.93,
    longest_dry_spell_days: 22,
    heavy_rain_days: 6,
    heat_stress_days: 121,
    mean_sm_anomaly_z: 0.0,
    ndvi_peak: 0.85,
    bare_period_fraction: 0.0,
    erosion_exposure_index: 0.11,
    anomaly_score_m1: 0.57,
    is_anomalous_season: false,
    cluster_label_m2: "Sloped High-Runoff Upland",
    trend_sen_slope_mm_yr: -78.5,
  },
  ASH_R06_C06: {
    cell_id: "ASH_R06_C06",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 33,
    total_rain_mm: 1425.9,
    rain_cv: 0.93,
    longest_dry_spell_days: 22,
    heavy_rain_days: 6,
    heat_stress_days: 121,
    mean_sm_anomaly_z: 0.0,
    ndvi_peak: 0.72,
    bare_period_fraction: 0.0,
    erosion_exposure_index: 0.12,
    anomaly_score_m1: 0.57,
    is_anomalous_season: false,
    cluster_label_m2: "Drought-Sensitive Transition",
    trend_sen_slope_mm_yr: -78.5,
  },
  ASH_R05_C04: {
    cell_id: "ASH_R05_C04",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 33,
    total_rain_mm: 1425.9,
    rain_cv: 0.93,
    longest_dry_spell_days: 22,
    heavy_rain_days: 6,
    heat_stress_days: 121,
    mean_sm_anomaly_z: 0.0,
    ndvi_peak: 0.85,
    bare_period_fraction: 0.0,
    erosion_exposure_index: 0.04,
    anomaly_score_m1: 0.57,
    is_anomalous_season: false,
    cluster_label_m2: "Sekyere Central Corridor",
    trend_sen_slope_mm_yr: -78.5,
  },
  ASH_R04_C05: {
    cell_id: "ASH_R04_C05",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 33,
    total_rain_mm: 1425.9,
    rain_cv: 0.93,
    longest_dry_spell_days: 22,
    heavy_rain_days: 6,
    heat_stress_days: 121,
    mean_sm_anomaly_z: 0.0,
    ndvi_peak: 0.66,
    bare_period_fraction: 0.0,
    erosion_exposure_index: 0.05,
    anomaly_score_m1: 0.57,
    is_anomalous_season: false,
    cluster_label_m2: "Ejura South Transition",
    trend_sen_slope_mm_yr: -78.5,
  },
};

export const ROTATION_STRATEGIES: RotationStrategySpec[] = [
  {
    code: "baseline",
    name: "Baseline: Continuous Maize",
    sequence: "Major Maize -> Minor Maize",
    isBaseline: true,
    criterionScores: [0.3927, 0.29, 0.3538, 0.504],
    expectedBenefits: [
      "Familiar seed system and established trader demand across Ashanti.",
    ],
    informationGaps: [
      "Local N-depletion rate and Striga/fall-armyworm pressure unmeasured by satellites.",
    ],
    risksNeedingReview: [
      "High sensitivity to minor-season dry spells and bare-soil wash during Feb–Mar.",
    ],
  },
  {
    code: "strategy_a",
    name: "Strategy A: Maize-Cowpea Relay",
    sequence: "Major Maize -> Minor Short-Duration Cowpea",
    isBaseline: false,
    criterionScores: [0.735, 0.8181, 0.7062, 0.7397],
    expectedBenefits: [
      "Biological nitrogen fixation (~45 kg N/ha) lowers urea fertilizer dependence.",
      "65–75 day cowpea fits the shorter Sep–Nov minor rainfall window.",
    ],
    informationGaps: [
      "Local price spread between minor-season maize and cowpea in Ejura market.",
    ],
    risksNeedingReview: [
      "Pod borer/aphid scouting needed in October humid weeks; verify seed supply.",
    ],
  },
  {
    code: "strategy_b",
    name: "Strategy B: Soil-Cover & Mucuna Mulch",
    sequence: "Major Maize + Mucuna pruriens Relay / Mulch Phase",
    isBaseline: false,
    criterionScores: [0.6636, 0.93, 0.9462, 0.524],
    expectedBenefits: [
      "Reduces Jan–Mar & Aug bare-field exposure on sloping sandy clay loam (~75 days saved).",
      "Builds soil organic matter and suppresses aggressive speargrass (~110 kg N/ha fixed).",
    ],
    informationGaps: [
      "Short-term cash return gap if Mucuna replaces a minor marketable food crop.",
    ],
    risksNeedingReview: [
      "Confirm dry-season firebreaks and household labour for mulch management.",
    ],
  },
  {
    code: "strategy_c",
    name: "Strategy C: Water-Resilient Maize-Groundnut",
    sequence: "Early Drought-Tolerant Maize -> Minor Groundnut",
    isBaseline: false,
    criterionScores: [0.84, 0.7644, 0.7038, 0.7031],
    expectedBenefits: [
      "Shifted planting + drought-tolerant variety lowers March onset stress.",
      "Groundnut adds ~55 kg N/ha and strong household nutrition & market value.",
    ],
    informationGaps: [
      "Soil calcium/pH balance for pod fill requires on-farm soil check.",
    ],
    risksNeedingReview: [
      "Monitor Rosette virus and post-harvest aflatoxin drying conditions.",
    ],
  },
];

export const EVIDENCE_PASSPORTS: EvidencePassport[] = [
  {
    id: "ep-baseline",
    cellId: "ASH_R05_C05",
    strategyCode: "baseline",
    title: "Continuous Maize Reference Baseline",
    evidenceTier: "data_derived_finding",
    observationSummary:
      "Observed double-cereal baseline experiences steep minor-season moisture deficit after dekad 30 and repeated Jan–Feb bare exposure.",
    datasetsUsed: ["GPM IMERG V07B", "SMAP SPL3SMP_E", "HLS 30 m NDVI"],
    spatialTemporalCoverage: "Ashanti pilot grid (0.05° cells), 2015–2025 dekad baseline.",
    methodApplied: "Empirical onset/cessation water-balance scoring across 10 hydrological years.",
    uncertaintySummary:
      "Farm management practices (residue mulching vs burning) modify actual topsoil runoff.",
    scaleHonestyNote:
      "9–10 km precipitation & soil moisture show regional stress, not plot-level management.",
    informationGaps: ["Household fertilizer rate and Striga infestation history."],
    requiredLocalReview: ["Benchmark farmer yield trend over past 3 seasons with MOFA agent."],
  },
  {
    id: "ep-strategy-a",
    cellId: "ASH_R05_C05",
    strategyCode: "strategy_a",
    title: "Maize-Cowpea Relay Rotation",
    evidenceTier: "data_derived_finding",
    observationSummary:
      "Dekad water balance drops sharply after dekad 31 in ASH_R05_C05, favouring an 11-dekad minor-season legume over full-duration minor maize.",
    datasetsUsed: ["GPM IMERG V07B", "SMAP SPL3SMP_E", "MOD13Q1 / HLS NDVI"],
    spatialTemporalCoverage: "Ashanti pilot cell ASH_R05_C05 (0.05 deg), 2015–2025 dekad baseline.",
    methodApplied:
      "QA cloud masking + Savitzky-Golay NDVI smoothing + weighted MCDA with 2,000 Monte Carlo perturbations.",
    uncertaintySummary:
      "Optical NDVI gaps occur in May–Jun and Sep peak rain; criterion scores carry ±0.10 perturbation testing.",
    scaleHonestyNote:
      "IMERG (10 km) and SMAP (9 km) describe sub-regional moisture patterns, not single smallholder boundaries.",
    informationGaps: [
      "No plot-level cowpea yield or Rhizobium nodulation field trials in current table.",
    ],
    requiredLocalReview: [
      "Confirm certified early-maturing cowpea seed availability with Ashanti MOFA extension officer.",
    ],
  },
  {
    id: "ep-strategy-b",
    cellId: "ASH_R05_C05",
    strategyCode: "strategy_b",
    title: "Soil-Cover & Mucuna Mulch Phase",
    evidenceTier: "established_science",
    observationSummary:
      "NDVI drops below 0.28 (bare soil) in ~7 dekads/year (Dec–Feb and Aug) across undulating 4–7% slopes.",
    datasetsUsed: ["SRTM 30 m slope", "HLS/Landsat 30 m NDVI", "iSDAsoil 30 m / SoilGrids"],
    spatialTemporalCoverage:
      "Static 30 m terrain + 2015–2025 seasonal cover fraction across 50×50 km grid.",
    methodApplied:
      "Slope-exposure crossing with dekad bare-field flags against agronomic cover-crop literature.",
    uncertaintySummary:
      "Cover biomass decomposition rate varies with local livestock grazing pressure and bushfire incidence.",
    scaleHonestyNote:
      "SRTM and Landsat resolve field-scale slopes when cloud-free; SoilGrids (250 m) remains model-estimated.",
    informationGaps: [
      "Household willingness to trade minor-season cash crop area for green-manure cover.",
    ],
    requiredLocalReview: [
      "Assess dry-season grazing agreements and firebreak needs with farmer group before sowing Mucuna.",
    ],
  },
  {
    id: "ep-strategy-c",
    cellId: "ASH_R05_C05",
    strategyCode: "strategy_c",
    title: "Water-Resilient Early Maize-Groundnut",
    evidenceTier: "unverified_hypothesis",
    observationSummary:
      "March onset dekads (D07–D09) show moderate rainfall reliability, raising seedling replanting risk for standard long-duration cultivars.",
    datasetsUsed: ["GPM IMERG V07B", "ERA5-Land reanalysis", "NASA POWER T2M"],
    spatialTemporalCoverage: "2015–2025 dekad onset variability in Ashanti Ejura-Kumasi corridor.",
    methodApplied:
      "Onset dekad variability check cross-referenced with Forest-Transition drought-tolerant variety calendars.",
    uncertaintySummary:
      "Gridded climate products underestimate convective storm patchiness at 2 ha farm scale.",
    scaleHonestyNote:
      "NASA POWER (50 km) provides broad thermal context only; local rain-gauge tracking improves timing.",
    informationGaps: [
      "Unverified calcium/pH response on acidic patches (pH 5.6–5.8) for groundnut pod filling.",
    ],
    requiredLocalReview: [
      "Validate local variety maturity days and aflatoxin-safe drying racks with agronomist.",
    ],
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: "ndvi",
    term: "NDVI (Vegetation Greenness)",
    termTw: "NDVI (Ahaban Ahabanmono)",
    plainMeaning:
      "A satellite score from 0 to 1 showing how dense and leafy crops or cover plants are.",
    plainMeaningTw: "Satellite nsɛnkyerɛnne (0 kosi 1) a ɛkyerɛ sɛnea nnɔbae ne ahaban kata asase so.",
    whyItMatters:
      "Values below 0.28 in Field Shift flag bare soil that is exposed to sun, heat, and rain wash.",
  },
  {
    id: "bare-field",
    term: "Bare-field period",
    termTw: "Asase a ɛda hɔ kwa",
    plainMeaning: "Weeks when harvested soil has no living crop or mulch covering it.",
    plainMeaningTw: "Nnawɔtwe a otwa akyi no, nnɔbae anaa nwura biara nkata asase no so.",
    whyItMatters: "Early storm rains falling on bare sloped soil carry away fertile topsoil.",
  },
  {
    id: "smap-anomaly",
    term: "Soil moisture anomaly (SMAP)",
    termTw: "Asase mu nsuo nsakrae (SMAP)",
    plainMeaning:
      "How much wetter (+) or drier (−) the top 5 cm of regional soil is compared with normal for that time of year.",
    plainMeaningTw:
      "Sɛnea asase ani nsuo dɔɔso (+) anaa asoa (−) sen sɛnea ɛtaa yɛ wɔ afe no saa bere no mu.",
    whyItMatters:
      "Negative anomalies alert farmers to dry spells, though coarse 9 km pixels do not measure one single plot.",
  },
  {
    id: "dekad",
    term: "Dekad (10-day period)",
    termTw: "Nnafua 10 Bere (Dekad)",
    plainMeaning:
      "Each month is split into three steps (~days 1–10, 11–20, and 21–end), giving 36 steps per year.",
    plainMeaningTw: "Bosome biara mu kyɛ 3 (nnafua 1–10, 11–20, 21–awiei); afe baako yɛ dekad 36.",
    whyItMatters:
      "Short enough to catch dry spells during flowering, long enough to bridge cloudy days.",
  },
  {
    id: "scale-honesty",
    term: "Scale honesty",
    termTw: "Kɛseɛ Mu Nokwaredie",
    plainMeaning:
      "Checking whether a satellite pixel is smaller or far larger than the farmer’s actual plot.",
    plainMeaningTw: "Hwɛ sɛ satellite mfonini ketewa te sɛ afuw no kɛseɛ anaa ɛso kyɛn so.",
    whyItMatters:
      "A 10 km rain pixel covers 5,000 two-hectare farms at once, so regional trends must be verified locally.",
  },
  {
    id: "minimax-regret",
    term: "Minimax Climate Regret",
    termTw: "Ahobammɔ wɔ Ewiem Nsakrae Nyinaa Mu",
    plainMeaning:
      "Choosing the rotation whose worst-case performance across drought, normal, and squall years falls least behind the best possible pick.",
    plainMeaningTw:
      "Adwuma a ɛbɔ wo ho ban yiye wɔ ɔpɛ, nsuo pii, ne afe pa nyinaa mu.",
    whyItMatters:
      "Prevents betting the entire farm on a fragile high-yield crop that collapses in an El Niño season.",
  },
];

export const INITIAL_DECISION_LOGS: DecisionLogRecord[] = [];

export const INITIAL_OUTCOME_REPORTS: OutcomeReportRecord[] = [];
