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
    elevation_m: 268,
    slope_pct: 5.4,
    soil_texture: "Sandy clay loam",
    soil_organic_carbon_g_kg: 14.2,
    soil_ph: 5.8,
    typical_annual_rain_mm: 1310,
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
    elevation_m: 342,
    slope_pct: 7.2,
    soil_texture: "Loam",
    soil_organic_carbon_g_kg: 16.1,
    soil_ph: 5.6,
    typical_annual_rain_mm: 1380,
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
    elevation_m: 245,
    slope_pct: 4.1,
    soil_texture: "Sandy loam",
    soil_organic_carbon_g_kg: 12.8,
    soil_ph: 6.0,
    typical_annual_rain_mm: 1245,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.925, -1.375),
  },
  {
    cell_id: "ASH_R03_C06",
    region_name: "Atebubu-Ejura Savanna Edge",
    row_idx: 3,
    col_idx: 6,
    centre_lat: 6.925,
    centre_lon: -1.475,
    elevation_m: 224,
    slope_pct: 3.3,
    soil_texture: "Loamy sand",
    soil_organic_carbon_g_kg: 10.9,
    soil_ph: 6.1,
    typical_annual_rain_mm: 1185,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.925, -1.475),
  },
  {
    cell_id: "ASH_R07_C04",
    region_name: "Atwima-Kumasi Peri-Urban Corridor",
    row_idx: 7,
    col_idx: 4,
    centre_lat: 6.825,
    centre_lon: -1.375,
    elevation_m: 290,
    slope_pct: 6.5,
    soil_texture: "Clay loam",
    soil_organic_carbon_g_kg: 17.5,
    soil_ph: 5.5,
    typical_annual_rain_mm: 1415,
    native_resolutions_km: { imerg: 10, smap: 9, modis: 0.25, hls: 0.03, isdasoil: 0.03 },
    polygonCoords: makeCellPolygon(6.825, -1.375),
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
    cessation_dekad: 31,
    total_rain_mm: 1310,
    rain_cv: 0.24,
    longest_dry_spell_days: 18,
    heavy_rain_days: 14,
    heat_stress_days: 29,
    mean_sm_anomaly_z: 0.12,
    ndvi_peak: 0.72,
    bare_period_fraction: 0.26,
    erosion_exposure_index: 0.44,
    anomaly_score_m1: 0.21,
    is_anomalous_season: false,
    cluster_label_m2: "Balanced Bimodal Transition",
    trend_sen_slope_mm_yr: -3.8,
  },
  ASH_R04_C04: {
    cell_id: "ASH_R04_C04",
    year: 2025,
    season: "annual",
    onset_dekad: 8,
    cessation_dekad: 31,
    total_rain_mm: 1380,
    rain_cv: 0.22,
    longest_dry_spell_days: 15,
    heavy_rain_days: 17,
    heat_stress_days: 22,
    mean_sm_anomaly_z: 0.25,
    ndvi_peak: 0.76,
    bare_period_fraction: 0.22,
    erosion_exposure_index: 0.62,
    anomaly_score_m1: 0.34,
    is_anomalous_season: false,
    cluster_label_m2: "Sloped High-Runoff Upland",
    trend_sen_slope_mm_yr: -2.9,
  },
  ASH_R06_C06: {
    cell_id: "ASH_R06_C06",
    year: 2025,
    season: "annual",
    onset_dekad: 9,
    cessation_dekad: 30,
    total_rain_mm: 1245,
    rain_cv: 0.28,
    longest_dry_spell_days: 21,
    heavy_rain_days: 12,
    heat_stress_days: 34,
    mean_sm_anomaly_z: -0.14,
    ndvi_peak: 0.68,
    bare_period_fraction: 0.31,
    erosion_exposure_index: 0.39,
    anomaly_score_m1: 0.48,
    is_anomalous_season: false,
    cluster_label_m2: "Drought-Sensitive Transition",
    trend_sen_slope_mm_yr: -5.2,
  },
  ASH_R03_C06: {
    cell_id: "ASH_R03_C06",
    year: 2025,
    season: "annual",
    onset_dekad: 9,
    cessation_dekad: 29,
    total_rain_mm: 1185,
    rain_cv: 0.31,
    longest_dry_spell_days: 24,
    heavy_rain_days: 11,
    heat_stress_days: 41,
    mean_sm_anomaly_z: -0.32,
    ndvi_peak: 0.64,
    bare_period_fraction: 0.35,
    erosion_exposure_index: 0.41,
    anomaly_score_m1: 0.69,
    is_anomalous_season: true,
    cluster_label_m2: "Savanna Edge Dry-Spell Belt",
    trend_sen_slope_mm_yr: -6.4,
  },
  ASH_R07_C04: {
    cell_id: "ASH_R07_C04",
    year: 2025,
    season: "annual",
    onset_dekad: 7,
    cessation_dekad: 32,
    total_rain_mm: 1415,
    rain_cv: 0.2,
    longest_dry_spell_days: 13,
    heavy_rain_days: 18,
    heat_stress_days: 19,
    mean_sm_anomaly_z: 0.31,
    ndvi_peak: 0.78,
    bare_period_fraction: 0.19,
    erosion_exposure_index: 0.56,
    anomaly_score_m1: 0.18,
    is_anomalous_season: false,
    cluster_label_m2: "Humid Forest-Edge Belt",
    trend_sen_slope_mm_yr: -2.1,
  },
};

export const ROTATION_STRATEGIES: RotationStrategySpec[] = [
  {
    code: "baseline",
    name: "Baseline: Continuous Maize",
    sequence: "Major Maize -> Minor Maize",
    isBaseline: true,
    criterionScores: [0.46, 0.34, 0.42, 0.52],
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
    criterionScores: [0.74, 0.76, 0.66, 0.72],
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
    criterionScores: [0.68, 0.85, 0.88, 0.54],
    expectedBenefits: [
      "Reduces Jan–Mar & Aug bare-field exposure on sloping sandy clay loam (~48 days saved).",
      "Builds soil organic matter and suppresses aggressive speargrass.",
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
    criterionScores: [0.82, 0.7, 0.71, 0.68],
    expectedBenefits: [
      "Shifted planting + drought-tolerant variety lowers March onset stress.",
      "Groundnut adds ~50 kg N/ha and strong household nutrition & market value.",
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

export const INITIAL_DECISION_LOGS: DecisionLogRecord[] = [
  {
    decision_id: "dec-demo-001",
    cell_id: "ASH_R05_C05",
    session_label: "Ejura Co-op Field Day #4",
    logged_by_role: "extension_officer",
    existing_rotation: "Maize -> Maize",
    selected_strategy_code: "strategy_a",
    farm_area_ha: 2.5,
    priority_weights: {
      water_efficiency: 0.4,
      soil_health: 0.3,
      erosion_protection: 0.2,
      income_market: 0.1,
    },
    computed_base_scores: {
      baseline: 0.442,
      strategy_a: 0.728,
      strategy_b: 0.757,
      strategy_c: 0.748,
    },
    rank_probabilities: {
      baseline: 0.01,
      strategy_a: 0.34,
      strategy_b: 0.39,
      strategy_c: 0.26,
    },
    reasoning_notes: "Farmers requested edible minor-season protein crop over non-food mulch.",
    created_at: "2026-11-10T10:20:00Z",
    synced: true,
  },
  {
    decision_id: "dec-demo-002",
    cell_id: "ASH_R04_C04",
    session_label: "Mampong Slope Demo Plot",
    logged_by_role: "agronomist",
    existing_rotation: "Maize -> Cassava",
    selected_strategy_code: "strategy_b",
    farm_area_ha: 3.0,
    priority_weights: {
      water_efficiency: 0.2,
      soil_health: 0.35,
      erosion_protection: 0.35,
      income_market: 0.1,
    },
    computed_base_scores: {
      baseline: 0.41,
      strategy_a: 0.717,
      strategy_b: 0.796,
      strategy_c: 0.726,
    },
    rank_probabilities: {
      baseline: 0.0,
      strategy_a: 0.18,
      strategy_b: 0.67,
      strategy_c: 0.15,
    },
    reasoning_notes: "7.2% slope requires Harmattan residue cover; Mucuna strip intercrop approved.",
    created_at: "2026-11-12T14:05:00Z",
    synced: true,
  },
];

export const INITIAL_OUTCOME_REPORTS: OutcomeReportRecord[] = [
  {
    outcome_id: "out-demo-101",
    decision_id: "dec-demo-001",
    cell_id: "ASH_R05_C05",
    season_year: 2025,
    season_name: "Minor",
    outcome_summary:
      "68-day cowpea matured prior to Harmattan onset; soil kept green cover through Nov D32.",
    soil_cover_observed: "Good (~75% canopy cover through mid-Nov)",
    water_stress_observed: "Mild mid-October dry spell recovered within 4 days",
    pest_or_disease_notes: "Low aphid patch along southern boundary, controlled cleanly.",
    evidence_grade: "farmer_reported",
    graded_by_officer_id: null,
    eligible_for_model_update: false,
    created_at: "2026-11-13T09:15:00Z",
    reviewed_at: null,
    synced: true,
  },
  {
    outcome_id: "out-demo-102",
    decision_id: "dec-demo-002",
    cell_id: "ASH_R04_C04",
    season_year: 2025,
    season_name: "Major",
    outcome_summary:
      "Mucuna mulch suppressed speargrass; noticeably less rill wash after heavy April squalls.",
    soil_cover_observed: "Dense surface residue maintained into Jan",
    water_stress_observed: "None observed on terraced plot",
    pest_or_disease_notes: "Cleared 3 m perimeter firebreak with farmer group.",
    evidence_grade: "officer_reviewed",
    graded_by_officer_id: "00000000-0000-0000-0000-000000000101",
    eligible_for_model_update: true,
    created_at: "2026-11-11T16:40:00Z",
    reviewed_at: "2026-11-12T08:30:00Z",
    synced: true,
  },
];
