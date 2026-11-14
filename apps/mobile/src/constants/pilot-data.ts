/**
 * Phase 1 Ashanti pilot fixture data shared across the mobile 4-tab navigation shell.
 * Mirrors the Supabase schema contracts (pilot_cells, dekad_timeseries, strategy_scores,
 * evidence_passports) while keeping offline/mobile rendering self-contained.
 */

export interface PilotCellSummary {
  cellId: string;
  zoneName: string;
  centreLat: number;
  centreLon: number;
  slopePct: number;
  soilTexture: string;
  soilPh: number;
  typicalAnnualRainMm: number;
}

export interface ScaleHonestyEntry {
  dataset: string;
  nativeResolutionKm: number;
  pixelAreaKm2: number;
  resolvesFarm: boolean;
  advisoryTier: 'field_scale' | 'sub_regional' | 'regional_context_only';
  note: string;
}

export interface DekadWindowSummary {
  id: string;
  monthLabel: string;
  dekadRange: string;
  seasonLabel: string;
  rainReliability: 'High' | 'Moderate' | 'Low';
  rainMm: number;
  smapAnomalyZ: number;
  ndviSmooth: number;
  bareFieldRisk: boolean;
  qaTier: 'high' | 'moderate' | 'low_cloud_gap';
  summaryNote: string;
}

export interface RotationStrategySpec {
  code: string;
  name: string;
  sequence: string;
  isBaseline: boolean;
  criterionScores: [number, number, number, number];
  expectedBenefits: string[];
  informationGaps: string[];
  risksNeedingReview: string[];
}

export interface EvidencePassportEntry {
  id: string;
  strategyCode: string;
  title: string;
  evidenceTier:
    | 'established_science'
    | 'data_derived_finding'
    | 'farmer_reported_observation'
    | 'unverified_hypothesis'
    | 'expert_validated_insight';
  observationSummary: string;
  datasetsUsed: string[];
  spatialTemporalCoverage: string;
  methodApplied: string;
  uncertaintySummary: string;
  scaleHonestyNote: string;
  informationGaps: string[];
  requiredLocalReview: string[];
}

export interface GlossaryItem {
  term: string;
  plainMeaning: string;
  whyItMatters: string;
}

export const SCORING_CRITERIA: readonly [string, string, string, string] = [
  'Water efficiency',
  'Soil health',
  'Erosion protection',
  'Income and market',
];

export const PRIORITY_PRESETS: {
  id: string;
  label: string;
  weights: [number, number, number, number];
}[] = [
  { id: 'balanced', label: 'Balanced', weights: [0.25, 0.25, 0.25, 0.25] },
  { id: 'water', label: 'Water-First', weights: [0.45, 0.25, 0.2, 0.1] },
  { id: 'soil', label: 'Soil & Erosion', weights: [0.2, 0.35, 0.35, 0.1] },
  { id: 'income', label: 'Income Focus', weights: [0.2, 0.2, 0.15, 0.45] },
];

export const ASHANTI_PILOT_CELLS: PilotCellSummary[] = [
  {
    cellId: 'ASH_R05_C05',
    zoneName: 'Ejura-Kumasi Forest-Transition Corridor',
    centreLat: 6.875,
    centreLon: -1.425,
    slopePct: 5.4,
    soilTexture: 'Sandy clay loam',
    soilPh: 5.8,
    typicalAnnualRainMm: 1310,
  },
  {
    cellId: 'ASH_R04_C04',
    zoneName: 'Mampong-Sekyere Upland Transition',
    centreLat: 6.825,
    centreLon: -1.475,
    slopePct: 7.2,
    soilTexture: 'Loam',
    soilPh: 5.6,
    typicalAnnualRainMm: 1380,
  },
  {
    cellId: 'ASH_R06_C06',
    zoneName: 'Offinso-Afigya Mixed Cropping Belt',
    centreLat: 6.925,
    centreLon: -1.375,
    slopePct: 4.1,
    soilTexture: 'Sandy loam',
    soilPh: 6.0,
    typicalAnnualRainMm: 1245,
  },
];

export const DEFAULT_FARM_AREA_HA = 2.0;

export const SCALE_HONESTY_DATASETS: {
  dataset: string;
  nativeResolutionKm: number;
  note: string;
}[] = [
  {
    dataset: 'Landsat / HLS (NDVI, bare soil)',
    nativeResolutionKm: 0.03,
    note: '30 m pixel resolves multi-hectare plots when cloud-free.',
  },
  {
    dataset: 'MODIS / SoilGrids (phenology & soil)',
    nativeResolutionKm: 0.25,
    note: '250 m pixel blends neighbouring smallholder fields; verify soil on-site.',
  },
  {
    dataset: 'SMAP L3 (surface soil moisture)',
    nativeResolutionKm: 9.0,
    note: '9 km footprint gives regional moisture context, not field irrigation state.',
  },
  {
    dataset: 'GPM IMERG (rainfall & dry spells)',
    nativeResolutionKm: 10.0,
    note: '10 km grid tracks regional storms; check against local rain gauges.',
  },
  {
    dataset: 'NASA POWER (agroclimate baseline)',
    nativeResolutionKm: 50.0,
    note: '50 km grid; background climate trend only.',
  },
];

export function evaluateMobileScaleHonesty(
  farmAreaHa: number,
): ScaleHonestyEntry[] {
  const safeHa = Math.max(0.25, farmAreaHa);
  const farmAreaKm2 = safeHa / 100;

  return SCALE_HONESTY_DATASETS.map((item) => {
    const pixelAreaKm2 = item.nativeResolutionKm ** 2;
    const ratio = pixelAreaKm2 / farmAreaKm2;
    const resolvesFarm = ratio <= 1.0;
    const advisoryTier: ScaleHonestyEntry['advisoryTier'] = resolvesFarm
      ? 'field_scale'
      : ratio <= 25
        ? 'sub_regional'
        : 'regional_context_only';

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
    id: 'jan',
    monthLabel: 'Jan',
    dekadRange: 'D01-D03',
    seasonLabel: 'Harmattan Dry Season',
    rainReliability: 'Low',
    rainMm: 14,
    smapAnomalyZ: -1.15,
    ndviSmooth: 0.23,
    bareFieldRisk: true,
    qaTier: 'high',
    summaryNote: 'Dry soils and exposed topsoil risk wind/early-storm erosion.',
  },
  {
    id: 'feb',
    monthLabel: 'Feb',
    dekadRange: 'D04-D06',
    seasonLabel: 'Pre-Onset Clearing',
    rainReliability: 'Low',
    rainMm: 36,
    smapAnomalyZ: -0.92,
    ndviSmooth: 0.22,
    bareFieldRisk: true,
    qaTier: 'high',
    summaryNote: 'Peak land preparation; slash-and-clear leaves soil bare.',
  },
  {
    id: 'mar',
    monthLabel: 'Mar',
    dekadRange: 'D07-D09',
    seasonLabel: 'Major Season Onset',
    rainReliability: 'Moderate',
    rainMm: 112,
    smapAnomalyZ: -0.2,
    ndviSmooth: 0.31,
    bareFieldRisk: false,
    qaTier: 'moderate',
    summaryNote: 'Variable rain onset; false starts can stress early maize sowing.',
  },
  {
    id: 'apr',
    monthLabel: 'Apr',
    dekadRange: 'D10-D12',
    seasonLabel: 'Major Growing Window',
    rainReliability: 'High',
    rainMm: 158,
    smapAnomalyZ: 0.45,
    ndviSmooth: 0.49,
    bareFieldRisk: false,
    qaTier: 'moderate',
    summaryNote: 'Moisture builds rapidly; heavy rainstorms risk runoff on slopes.',
  },
  {
    id: 'may',
    monthLabel: 'May',
    dekadRange: 'D13-D15',
    seasonLabel: 'Major Peak Canopy',
    rainReliability: 'High',
    rainMm: 194,
    smapAnomalyZ: 0.88,
    ndviSmooth: 0.67,
    bareFieldRisk: false,
    qaTier: 'low_cloud_gap',
    summaryNote: 'Dense canopy cover; heavy cloud leaves optical NDVI gaps.',
  },
  {
    id: 'jun',
    monthLabel: 'Jun',
    dekadRange: 'D16-D18',
    seasonLabel: 'Major Peak Rain',
    rainReliability: 'High',
    rainMm: 215,
    smapAnomalyZ: 1.12,
    ndviSmooth: 0.72,
    bareFieldRisk: false,
    qaTier: 'low_cloud_gap',
    summaryNote: 'Wettest dekads; high cloud cover mitigated via QA interpolation.',
  },
  {
    id: 'jul',
    monthLabel: 'Jul',
    dekadRange: 'D19-D21',
    seasonLabel: 'Major Maturation / Harvest',
    rainReliability: 'Moderate',
    rainMm: 118,
    smapAnomalyZ: 0.35,
    ndviSmooth: 0.56,
    bareFieldRisk: false,
    qaTier: 'moderate',
    summaryNote: 'Late-July dry spell transition begins after grain fill.',
  },
  {
    id: 'aug',
    monthLabel: 'Aug',
    dekadRange: 'D22-D24',
    seasonLabel: 'Mid-Year Short Dry Dip',
    rainReliability: 'Low',
    rainMm: 62,
    smapAnomalyZ: -0.45,
    ndviSmooth: 0.27,
    bareFieldRisk: true,
    qaTier: 'moderate',
    summaryNote: 'Post-harvest clearing leaves residue exposed before minor rains.',
  },
  {
    id: 'sep',
    monthLabel: 'Sep',
    dekadRange: 'D25-D27',
    seasonLabel: 'Minor Season Establishment',
    rainReliability: 'Moderate',
    rainMm: 152,
    smapAnomalyZ: 0.52,
    ndviSmooth: 0.48,
    bareFieldRisk: false,
    qaTier: 'low_cloud_gap',
    summaryNote: 'Short window favours 65-80 day cowpea or fast-cover legumes.',
  },
  {
    id: 'oct',
    monthLabel: 'Oct',
    dekadRange: 'D28-D30',
    seasonLabel: 'Minor Peak Rain',
    rainReliability: 'High',
    rainMm: 164,
    smapAnomalyZ: 0.78,
    ndviSmooth: 0.61,
    bareFieldRisk: false,
    qaTier: 'moderate',
    summaryNote: 'Reliable October showers support pod fill and cover establishment.',
  },
  {
    id: 'nov',
    monthLabel: 'Nov',
    dekadRange: 'D31-D33',
    seasonLabel: 'Minor Cessation',
    rainReliability: 'Low',
    rainMm: 54,
    smapAnomalyZ: -0.25,
    ndviSmooth: 0.39,
    bareFieldRisk: false,
    qaTier: 'high',
    summaryNote: 'Rapid moisture drawdown; deep-rooted cover crops retain cover.',
  },
  {
    id: 'dec',
    monthLabel: 'Dec',
    dekadRange: 'D34-D36',
    seasonLabel: 'Harmattan Dry Onset',
    rainReliability: 'Low',
    rainMm: 18,
    smapAnomalyZ: -0.95,
    ndviSmooth: 0.25,
    bareFieldRisk: true,
    qaTier: 'high',
    summaryNote: 'Bare-soil exposure rises sharply without surface mulch residue.',
  },
];

export const ROTATION_STRATEGIES: RotationStrategySpec[] = [
  {
    code: 'baseline',
    name: 'Baseline: Continuous Maize',
    sequence: 'Major Maize -> Minor Maize',
    isBaseline: true,
    criterionScores: [0.46, 0.34, 0.42, 0.52],
    expectedBenefits: [
      'Familiar seed system and established trader demand across Ashanti.',
    ],
    informationGaps: [
      'Local field N-depletion rate and Striga/fall-armyworm pressure unmeasured by satellites.',
    ],
    risksNeedingReview: [
      'High sensitivity to minor-season dry spells and bare-soil wash during Feb-Mar.',
    ],
  },
  {
    code: 'strategy_a',
    name: 'Strategy A: Maize-Cowpea Relay',
    sequence: 'Major Maize -> Minor Short-Duration Cowpea',
    isBaseline: false,
    criterionScores: [0.74, 0.76, 0.66, 0.72],
    expectedBenefits: [
      'Biological nitrogen fixation (~30-60 kg N/ha) lowers urea dependence.',
      '65-75 day cowpea fits the shorter Sep-Nov minor rainfall window.',
    ],
    informationGaps: [
      'Local price spread between minor-season maize and cowpea in Ejura market.',
    ],
    risksNeedingReview: [
      'Pod borer/aphid scouting needed in October humid weeks; verify seed supply.',
    ],
  },
  {
    code: 'strategy_b',
    name: 'Strategy B: Soil-Cover & Mucuna Mulch',
    sequence: 'Major Maize + Mucuna pruriens Relay / Mulch Phase',
    isBaseline: false,
    criterionScores: [0.68, 0.85, 0.88, 0.54],
    expectedBenefits: [
      'Reduces Jan-Mar & Aug bare-field exposure on sloping sandy clay loam.',
      'Builds soil organic matter and suppresses aggressive speargrass.',
    ],
    informationGaps: [
      'Short-term cash return gap if Mucuna replaces a minor marketable food crop.',
    ],
    risksNeedingReview: [
      'Confirm dry-season firebreaks and household labour for mulch management.',
    ],
  },
  {
    code: 'strategy_c',
    name: 'Strategy C: Water-Resilient Maize-Groundnut',
    sequence: 'Early Drought-Tolerant Maize -> Minor Groundnut',
    isBaseline: false,
    criterionScores: [0.82, 0.7, 0.71, 0.68],
    expectedBenefits: [
      'Shifted planting + drought-tolerant variety lowers March onset stress.',
      'Groundnut adds nitrogen fixation and strong household nutrition/market value.',
    ],
    informationGaps: [
      'Soil calcium/pH balance for pod fill requires on-farm soil check.',
    ],
    risksNeedingReview: [
      'Monitor Rosette virus and post-harvest aflatoxin drying conditions.',
    ],
  },
];

export const EVIDENCE_PASSPORTS: EvidencePassportEntry[] = [
  {
    id: 'ep-strategy-a',
    strategyCode: 'strategy_a',
    title: 'Maize-Cowpea Relay Rotation',
    evidenceTier: 'data_derived_finding',
    observationSummary:
      'Dekad water balance drops sharply after dekad 31 in ASH_R05_C05, favouring an 11-dekad minor-season legume over full-duration minor maize.',
    datasetsUsed: ['GPM IMERG V07B', 'SMAP SPL3SMP_E', 'MOD13Q1 / HLS NDVI'],
    spatialTemporalCoverage:
      'Ashanti pilot cell ASH_R05_C05 (0.05 deg), 2015-2025 dekad baseline.',
    methodApplied:
      'QA cloud masking + Savitzky-Golay NDVI smoothing + weighted MCDA with 2,000 Monte Carlo perturbations.',
    uncertaintySummary:
      'Optical NDVI gaps occur in May-Jun and Sep peak rain; criterion scores carry +-0.10 perturbation testing.',
    scaleHonestyNote:
      'IMERG (10 km) and SMAP (9 km) describe sub-regional moisture patterns, not single smallholder boundaries.',
    informationGaps: [
      'No plot-level cowpea yield or Rhizobium nodulation field trials in current table.',
    ],
    requiredLocalReview: [
      'Confirm certified early-maturing cowpea seed availability with Ashanti MOFA extension officer.',
    ],
  },
  {
    id: 'ep-strategy-b',
    strategyCode: 'strategy_b',
    title: 'Soil-Cover & Mucuna Mulch Phase',
    evidenceTier: 'established_science',
    observationSummary:
      'NDVI drops below 0.28 (bare soil) in ~7 dekads/year (Dec-Feb and Aug) across undulating 4-7% slopes.',
    datasetsUsed: ['SRTM 30 m slope', 'HLS/Landsat 30 m NDVI', 'ISRIC SoilGrids'],
    spatialTemporalCoverage:
      'Static 30 m terrain + 2015-2025 seasonal cover fraction across 50x50 km grid.',
    methodApplied:
      'Slope-exposure crossing with dekad bare-field flags against agronomic cover-crop literature.',
    uncertaintySummary:
      'Cover biomass decomposition rate varies with local livestock grazing pressure and bushfire incidence.',
    scaleHonestyNote:
      'SRTM and Landsat resolve field-scale slopes when cloud-free; SoilGrids (250 m) remains model-estimated.',
    informationGaps: [
      'Household willingness to trade minor-season cash crop area for green-manure cover.',
    ],
    requiredLocalReview: [
      'Assess dry-season grazing agreements and firebreak needs with farmer group before sowing Mucuna.',
    ],
  },
  {
    id: 'ep-strategy-c',
    strategyCode: 'strategy_c',
    title: 'Water-Resilient Early Maize-Groundnut',
    evidenceTier: 'unverified_hypothesis',
    observationSummary:
      'March onset dekads (D07-D09) show moderate rainfall reliability, raising seedling replanting risk for standard long-duration cultivars.',
    datasetsUsed: ['GPM IMERG V07B', 'ERA5-Land reanalysis', 'NASA POWER T2M'],
    spatialTemporalCoverage:
      '2015-2025 dekad onset variability in Ashanti Ejura-Kumasi corridor.',
    methodApplied:
      'Onset dekad variability check cross-referenced with Savanna/Transition drought-tolerant variety calendars.',
    uncertaintySummary:
      'Reanalysis and gridded climate underestimate convective shower patchiness at 2 ha farm scale.',
    scaleHonestyNote:
      'NASA POWER (50 km) provides broad thermal context only; local rain-gauge tracking improves planting timing.',
    informationGaps: [
      'Unverified calcium/pH response on acidic patches (pH 5.6-5.8) for groundnut pod filling.',
    ],
    requiredLocalReview: [
      'Validate local variety maturity days and aflatoxin-safe drying racks with agronomist.',
    ],
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'NDVI (Vegetation Greenness)',
    plainMeaning:
      'A satellite score from 0 to 1 showing how dense and leafy crops or cover plants are.',
    whyItMatters:
      'Values below 0.28 in Field Shift flag bare soil that is exposed to sun, heat, and rain wash.',
  },
  {
    term: 'Bare-field period',
    plainMeaning:
      'Weeks when harvested soil has no living crop or mulch covering it.',
    whyItMatters:
      'Early storm rains falling on bare sloped soil carry away fertile topsoil.',
  },
  {
    term: 'Soil moisture anomaly (SMAP)',
    plainMeaning:
      'How much wetter (+) or drier (-) the top 5 cm of regional soil is compared with the normal average for that time of year.',
    whyItMatters:
      'Negative anomalies alert farmers to dry spells, though coarse 9 km pixels do not measure one single plot.',
  },
  {
    term: 'Dekad (10-day period)',
    plainMeaning:
      'Each month is split into three steps (~days 1-10, 11-20, and 21-end), giving 36 steps per year.',
    whyItMatters:
      'Short enough to catch dry spells during flowering, long enough to bridge cloudy days.',
  },
  {
    term: 'Scale honesty',
    plainMeaning:
      'Checking whether a satellite pixel is smaller or far larger than the farmer’s actual plot.',
    whyItMatters:
      'A 10 km rain pixel covers 5,000 two-hectare farms at once, so regional trends must be verified locally.',
  },
];
