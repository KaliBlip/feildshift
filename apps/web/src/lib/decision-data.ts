import { baseScores, rankProbabilities } from "./scoring.ts";

export type DecisionSource = "supabase" | "fixtures";

export interface EvidencePassportData {
  evidenceTier: string;
  observationSummary: string;
  datasets: string[];
  coverage: unknown;
  method: string;
  keyFinding: string;
  uncertainty: string;
  scaleHonestyNote: string;
  gaps: string[];
  requiredLocalReview: string[];
  validatorRoles: string[];
}

export interface StrategyComparison {
  code: string;
  name: string;
  sequence: string;
  isBaseline: boolean;
  criteria: Array<{ key: string; label: string; score: number }>;
  baseScore: number;
  probabilityFirst: number;
  meanRank: number;
  expectedBenefits: string[];
  gaps: string[];
  risks: string[];
  passport: EvidencePassportData | null;
}

export interface DecisionData {
  cellId: string;
  cellLabel: string;
  season: string;
  strategies: StrategyComparison[];
  source: DecisionSource;
}

export const DECISION_CRITERIA = [
  { key: "water_efficiency", label: "Water efficiency" },
  { key: "soil_health", label: "Soil health" },
  { key: "erosion_protection", label: "Erosion protection" },
  { key: "income_market", label: "Income & market fit" },
];

const bundledStrategies = [
  {
    "code": "baseline",
    "name": "Baseline: Continuous Maize",
    "sequence": "Major Maize -> Minor Maize",
    "isBaseline": true,
    "scores": [
      0.3927,
      0.29,
      0.3538,
      0.504
    ],
    "benefits": [
      "Widely practised status quo leveraging familiar maize inputs and traders across Ashanti.",
      "Avoids ~0 bare-soil days via none with zero biological N fixation."
    ],
    "gaps": [
      "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
      "Local farmgate price volatility and labour hours during planting window require farmer verification."
    ],
    "risks": [
      "Declining soil N/organic matter.",
      "high vulnerability to minor-season cessation and fall armyworm carryover."
    ],
    "passport": {
      "evidenceTier": "data_derived_finding",
      "observationSummary": "Across 2022-2025 in cell ASH_R05_C05, median major-season rainfall is 729 mm and minor-season rainfall is 611 mm with peak minor dry spells up to 15 days (mean bare-soil erosion exposure 0.11). iSDAsoil v2 topsoil baseline indicates pH 5.5 (Sandy clay loam, ~26% clay at 30 m).",
      "datasets": [
        "COPERNICUS_DEM_GLO90",
        "HLSL30",
        "MOD11A2",
        "GPM_3IMERGDF",
        "SPL3SMP_E",
        "SPL4SMGP",
        "MOD13Q1",
        "MOD11A2",
        "POWER_DAILY_AGRO",
        "ISDASOIL_V2_30M",
        "ECMWF_ERA5_LAND"
      ],
      "coverage": {
        "cell_id": "ASH_R05_C05",
        "center_lat": 6.875,
        "center_lon": -1.425,
        "years": [
          2022,
          2023,
          2024,
          2025
        ],
        "seasons": [
          "major",
          "minor"
        ],
        "time_step": "dekad",
        "farm_area_ha": 2.0
      },
      "method": "36-dekad QC cube -> M1 IsolationForest anomaly / M2 DTW+KMeans analogs / M3 NDVI phenology / M4 Mann-Kendall trend -> M6 MCDA fusion & 2000-run Monte Carlo",
      "keyFinding": "Baseline: Continuous Maize achieves MCDA base score 0.385 (prob_first=0.0%, mean_rank=5.00) grounded in MoFA Ghana Agriculture Facts & Figures; CSIR-CRI Transition Zone Surveys.",
      "uncertainty": "Per-criterion sigma ranges 0.10-0.12; 2000-run Monte Carlo rank-1 probability is 0.0% under +/-0.10 weight sensitivity.",
      "scaleHonestyNote": "Farm area 2.00 ha (0.0200 km2): regional-context layers [imerg (10.0 km), smap (9.0 km), smap_root_zone (9.0 km), modis_ndvi (0.25 km), nasa_power (50.0 km), soilgrids (0.25 km), era5_land (9.0 km)] do not resolve plot boundaries individually; finer reference layers [landsat (0.03 km), gedi_canopy (0.025 km), srtm (0.03 km), ecostress (0.07 km)] still require local soil and agronomic checks. US-only baselines excluded for Ghana: usda_web_soil_survey (United States only (SSURGO / STATSGO2) -> soilgrids (ISRIC SoilGrids v2.0, 250 m global)); oregon_state_prism (Conterminous United States only (~800 m - 4 km) -> nasa_power + imerg + era5_land); global NASA POWER, GPM IMERG, and ISRIC SoilGrids v2.0 used instead.",
      "gaps": [
        "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
        "Local farmgate price volatility and labour hours during planting window require farmer verification."
      ],
      "requiredLocalReview": [
        "Verify household fertilizer budget and Striga/armyworm incidence on plot."
      ],
      "validatorRoles": [
        "Ashanti Farmer / Land Manager",
        "MoFA District Extension Officer",
        "CSIR-CRI Regional Agronomist"
      ]
    }
  },
  {
    "code": "strategy_a",
    "name": "Strategy A: Maize-Cowpea Relay",
    "sequence": "Major Maize -> Minor Early Cowpea",
    "isBaseline": false,
    "scores": [
      0.735,
      0.8181,
      0.7062,
      0.7397
    ],
    "benefits": [
      "7-dekad cowpea matches Sep-Nov rainfall tail while fixing ~45 kg N/ha and breaking cereal pest cycles.",
      "Fixes ~45 kg N/ha (~1.96 urea bags/ha offset) and avoids ~45 Harmattan bare-soil days via stover mulch."
    ],
    "gaps": [
      "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
      "Local farmgate price volatility and labour hours during planting window require farmer verification."
    ],
    "risks": [
      "Pod-sucking bugs and aphids in humid October weeks.",
      "price swings at Ejura assembly markets."
    ],
    "passport": {
      "evidenceTier": "data_derived_finding",
      "observationSummary": "Across 2022-2025 in cell ASH_R05_C05, median major-season rainfall is 729 mm and minor-season rainfall is 611 mm with peak minor dry spells up to 15 days (mean bare-soil erosion exposure 0.11). iSDAsoil v2 topsoil baseline indicates pH 5.5 (Sandy clay loam, ~26% clay at 30 m).",
      "datasets": [
        "COPERNICUS_DEM_GLO90",
        "HLSL30",
        "MOD11A2",
        "GPM_3IMERGDF",
        "SPL3SMP_E",
        "SPL4SMGP",
        "MOD13Q1",
        "MOD11A2",
        "POWER_DAILY_AGRO",
        "ISDASOIL_V2_30M",
        "ECMWF_ERA5_LAND"
      ],
      "coverage": {
        "cell_id": "ASH_R05_C05",
        "center_lat": 6.875,
        "center_lon": -1.425,
        "years": [
          2022,
          2023,
          2024,
          2025
        ],
        "seasons": [
          "major",
          "minor"
        ],
        "time_step": "dekad",
        "farm_area_ha": 2.0
      },
      "method": "36-dekad QC cube -> M1 IsolationForest anomaly / M2 DTW+KMeans analogs / M3 NDVI phenology / M4 Mann-Kendall trend -> M6 MCDA fusion & 2000-run Monte Carlo",
      "keyFinding": "Strategy A: Maize-Cowpea Relay achieves MCDA base score 0.750 (prob_first=25.1%, mean_rank=2.42) grounded in CSIR-CRI Maize-Legume Sequence Guide; N2Africa Ashanti Trials.",
      "uncertainty": "Per-criterion sigma ranges 0.10-0.12; 2000-run Monte Carlo rank-1 probability is 25.1% under +/-0.10 weight sensitivity.",
      "scaleHonestyNote": "Farm area 2.00 ha (0.0200 km2): regional-context layers [imerg (10.0 km), smap (9.0 km), smap_root_zone (9.0 km), modis_ndvi (0.25 km), nasa_power (50.0 km), soilgrids (0.25 km), era5_land (9.0 km)] do not resolve plot boundaries individually; finer reference layers [landsat (0.03 km), gedi_canopy (0.025 km), srtm (0.03 km), ecostress (0.07 km)] still require local soil and agronomic checks. US-only baselines excluded for Ghana: usda_web_soil_survey (United States only (SSURGO / STATSGO2) -> soilgrids (ISRIC SoilGrids v2.0, 250 m global)); oregon_state_prism (Conterminous United States only (~800 m - 4 km) -> nasa_power + imerg + era5_land); global NASA POWER, GPM IMERG, and ISRIC SoilGrids v2.0 used instead.",
      "gaps": [
        "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
        "Local farmgate price volatility and labour hours during planting window require farmer verification."
      ],
      "requiredLocalReview": [
        "Confirm certified Asontem/Soronko seed availability and storage bags with MoFA extension officer."
      ],
      "validatorRoles": [
        "Ashanti Farmer / Land Manager",
        "MoFA District Extension Officer",
        "CSIR-CRI Regional Agronomist"
      ]
    }
  },
  {
    "code": "strategy_b",
    "name": "Strategy B: Soil-Cover & Mucuna Mulch",
    "sequence": "Major Maize + Mucuna Relay / Mulch Phase",
    "isBaseline": false,
    "scores": [
      0.6636,
      0.93,
      0.9462,
      0.524
    ],
    "benefits": [
      "Dense Mucuna biomass covers sloping sandy clay loam through Harmattan Dec-Feb bare-soil risk dekads.",
      "Fixes ~110 kg N/ha (~4.78 urea bags/ha offset) and avoids ~75 Harmattan bare-soil days via mucuna residue."
    ],
    "gaps": [
      "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
      "Local farmgate price volatility and labour hours during planting window require farmer verification."
    ],
    "risks": [
      "Gives up minor-season cash harvest on relayed area.",
      "dry mulch can catch Harmattan bushfires.",
      "Agronomic prior status is 'pending_local_review'; confirm with Ashanti extension agronomist."
    ],
    "passport": {
      "evidenceTier": "unverified_hypothesis",
      "observationSummary": "Across 2022-2025 in cell ASH_R05_C05, median major-season rainfall is 729 mm and minor-season rainfall is 611 mm with peak minor dry spells up to 15 days (mean bare-soil erosion exposure 0.11). iSDAsoil v2 topsoil baseline indicates pH 5.5 (Sandy clay loam, ~26% clay at 30 m).",
      "datasets": [
        "COPERNICUS_DEM_GLO90",
        "HLSL30",
        "MOD11A2",
        "GPM_3IMERGDF",
        "SPL3SMP_E",
        "SPL4SMGP",
        "MOD13Q1",
        "MOD11A2",
        "POWER_DAILY_AGRO",
        "ISDASOIL_V2_30M",
        "ECMWF_ERA5_LAND"
      ],
      "coverage": {
        "cell_id": "ASH_R05_C05",
        "center_lat": 6.875,
        "center_lon": -1.425,
        "years": [
          2022,
          2023,
          2024,
          2025
        ],
        "seasons": [
          "major",
          "minor"
        ],
        "time_step": "dekad",
        "farm_area_ha": 2.0
      },
      "method": "36-dekad QC cube -> M1 IsolationForest anomaly / M2 DTW+KMeans analogs / M3 NDVI phenology / M4 Mann-Kendall trend -> M6 MCDA fusion & 2000-run Monte Carlo",
      "keyFinding": "Strategy B: Soil-Cover & Mucuna Mulch achieves MCDA base score 0.766 (prob_first=32.4%, mean_rank=2.35) grounded in IITA Forest-Transition Cover Crop Trials; CSIR-CRI Soil Conservation Bulletin.",
      "uncertainty": "Per-criterion sigma ranges 0.14-0.16; 2000-run Monte Carlo rank-1 probability is 32.4% under +/-0.10 weight sensitivity.",
      "scaleHonestyNote": "Farm area 2.00 ha (0.0200 km2): regional-context layers [imerg (10.0 km), smap (9.0 km), smap_root_zone (9.0 km), modis_ndvi (0.25 km), nasa_power (50.0 km), soilgrids (0.25 km), era5_land (9.0 km)] do not resolve plot boundaries individually; finer reference layers [landsat (0.03 km), gedi_canopy (0.025 km), srtm (0.03 km), ecostress (0.07 km)] still require local soil and agronomic checks. US-only baselines excluded for Ghana: usda_web_soil_survey (United States only (SSURGO / STATSGO2) -> soilgrids (ISRIC SoilGrids v2.0, 250 m global)); oregon_state_prism (Conterminous United States only (~800 m - 4 km) -> nasa_power + imerg + era5_land); global NASA POWER, GPM IMERG, and ISRIC SoilGrids v2.0 used instead.",
      "gaps": [
        "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
        "Local farmgate price volatility and labour hours during planting window require farmer verification."
      ],
      "requiredLocalReview": [
        "Confirm community firebreak rules and free-range grazing bylaws before relay sowing."
      ],
      "validatorRoles": [
        "Ashanti Farmer / Land Manager",
        "MoFA District Extension Officer",
        "CSIR-CRI Regional Agronomist"
      ]
    }
  },
  {
    "code": "strategy_c",
    "name": "Strategy C: Water-Resilient Maize-Groundnut",
    "sequence": "Early Drought-Tolerant Maize -> Minor Groundnut",
    "isBaseline": false,
    "scores": [
      0.84,
      0.7644,
      0.7038,
      0.7031
    ],
    "benefits": [
      "Omankwa/Abontem maize buffers March onset uncertainty while groundnut adds N credit and high local demand.",
      "Fixes ~55 kg N/ha (~2.39 urea bags/ha offset) and avoids ~45 Harmattan bare-soil days via stover mulch."
    ],
    "gaps": [
      "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
      "Local farmgate price volatility and labour hours during planting window require farmer verification."
    ],
    "risks": [
      "Pod fill requires adequate soil calcium/pH.",
      "humid harvest risks aflatoxin contamination."
    ],
    "passport": {
      "evidenceTier": "data_derived_finding",
      "observationSummary": "Across 2022-2025 in cell ASH_R05_C05, median major-season rainfall is 729 mm and minor-season rainfall is 611 mm with peak minor dry spells up to 15 days (mean bare-soil erosion exposure 0.11). iSDAsoil v2 topsoil baseline indicates pH 5.5 (Sandy clay loam, ~26% clay at 30 m).",
      "datasets": [
        "COPERNICUS_DEM_GLO90",
        "HLSL30",
        "MOD11A2",
        "GPM_3IMERGDF",
        "SPL3SMP_E",
        "SPL4SMGP",
        "MOD13Q1",
        "MOD11A2",
        "POWER_DAILY_AGRO",
        "ISDASOIL_V2_30M",
        "ECMWF_ERA5_LAND"
      ],
      "coverage": {
        "cell_id": "ASH_R05_C05",
        "center_lat": 6.875,
        "center_lon": -1.425,
        "years": [
          2022,
          2023,
          2024,
          2025
        ],
        "seasons": [
          "major",
          "minor"
        ],
        "time_step": "dekad",
        "farm_area_ha": 2.0
      },
      "method": "36-dekad QC cube -> M1 IsolationForest anomaly / M2 DTW+KMeans analogs / M3 NDVI phenology / M4 Mann-Kendall trend -> M6 MCDA fusion & 2000-run Monte Carlo",
      "keyFinding": "Strategy C: Water-Resilient Maize-Groundnut achieves MCDA base score 0.753 (prob_first=24.8%, mean_rank=2.41) grounded in CSIR-CRI Drought-Tolerant Maize & SARI Groundnut Production Guides.",
      "uncertainty": "Per-criterion sigma ranges 0.10-0.12; 2000-run Monte Carlo rank-1 probability is 24.8% under +/-0.10 weight sensitivity.",
      "scaleHonestyNote": "Farm area 2.00 ha (0.0200 km2): regional-context layers [imerg (10.0 km), smap (9.0 km), smap_root_zone (9.0 km), modis_ndvi (0.25 km), nasa_power (50.0 km), soilgrids (0.25 km), era5_land (9.0 km)] do not resolve plot boundaries individually; finer reference layers [landsat (0.03 km), gedi_canopy (0.025 km), srtm (0.03 km), ecostress (0.07 km)] still require local soil and agronomic checks. US-only baselines excluded for Ghana: usda_web_soil_survey (United States only (SSURGO / STATSGO2) -> soilgrids (ISRIC SoilGrids v2.0, 250 m global)); oregon_state_prism (Conterminous United States only (~800 m - 4 km) -> nasa_power + imerg + era5_land); global NASA POWER, GPM IMERG, and ISRIC SoilGrids v2.0 used instead.",
      "gaps": [
        "Plot-level lab soil organic carbon and calcium still need verification (remote soil maps average 30-250 m pixels).",
        "Local farmgate price volatility and labour hours during planting window require farmer verification."
      ],
      "requiredLocalReview": [
        "Test plot soil pH/calcium and verify dry curing racks for October-November harvest."
      ],
      "validatorRoles": [
        "Ashanti Farmer / Land Manager",
        "MoFA District Extension Officer",
        "CSIR-CRI Regional Agronomist"
      ]
    }
  }
];

export function createDecisionFixtures(): DecisionData {
  const weights = [0.4, 0.3, 0.2, 0.1];
  const scores = bundledStrategies.map((strategy) => strategy.scores);
  const base = baseScores(scores, weights);
  const ranks = rankProbabilities(scores, weights, { runs: 2000, seed: 42 });

  return {
    cellId: "ASH_R05_C05",
    cellLabel: "Ejura-Sekyedumase · ASH_R05_C05",
    season: "Major & Minor Bimodal Cycle (2022–2025)",
    source: "fixtures",
    strategies: bundledStrategies.map((strategy, index) => ({
      code: strategy.code,
      name: strategy.name,
      sequence: strategy.sequence,
      isBaseline: strategy.isBaseline,
      criteria: DECISION_CRITERIA.map((criterion, criterionIndex) => ({
        ...criterion,
        score: strategy.scores[criterionIndex],
      })),
      baseScore: base[index],
      probabilityFirst: ranks.probabilityFirst[index],
      meanRank: ranks.meanRank[index],
      expectedBenefits: strategy.benefits,
      gaps: strategy.gaps,
      risks: strategy.risks,
      passport: strategy.passport,
    })),
  };
}
