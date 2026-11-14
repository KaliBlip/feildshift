# Field Shift: ML Workflow

Draft for the Field Shift team · NASA Space Apps Challenge 2026 · Pilot region: Ashanti, Ghana · 14 November 2026

## Purpose and scope

This document describes the machine-learning and analytics workflow for Field Shift, end to end, ordered so that each stage feeds the next and the minimum viable version is clear. Tool names are suggestions only; the technology stack will be locked in separately.

**Pilot scope.** Do not build for all of Ashanti. Pick a pilot area of roughly 50 × 50 km around the partner farmer and design the pipeline to be configuration-driven, so another region is a new config file, not new code. History depth is set by the datasets: POWER and ERA5 go back decades, IMERG and MODIS to about 2000, Landsat for decades, and SMAP only from 2015.

## Pipeline stages

| Stage | What happens | Output |
| --- | --- | --- |
| Ingest | Pull data via APIs (earthaccess for Earthdata, POWER REST API, SoilGrids, Copernicus CDS for ERA5). Log product, version, date range and QA flags in a manifest. | Raw archive plus provenance manifest |
| QC and gap-fill | Cloud-mask optical data, composite, then smooth NDVI time series. Consider NASA's Harmonized Landsat Sentinel-2 (HLS) product for denser 30 m coverage in cloudy Ashanti (verify availability for the pilot area). | Clean time series |
| Harmonise | Aggregate to a common grid and a dekad (10-day) time step, keeping native-resolution copies. | Analysis cube |
| Features | Per cell and season: rainfall onset, total and variability, longest dry spell, heavy-rain days, heat-stress days, ET0 and water balance (FAO-56 from POWER meteorology), soil moisture anomaly, NDVI phenology metrics, bare-period fraction, slope, erosion exposure index. | Feature table |
| ML and statistics | Modules M1 to M5 below. | Findings with scores |
| Decision | Multi-criteria scoring with uncertainty (M6). | Ranked strategies |
| Evidence | Generate the Evidence Passport (M7). | JSON plus plain-language card |

## The ML modules

### M1: Anomaly detection (Isolation Forest)

Input is a season-level feature vector per cell and year. Output is an anomaly score plus the features that drove it. Keep a z-score baseline and report where the two disagree. Validate by asking the farmer which seasons were bad and checking whether they are flagged.

### M2: Season-type clustering and analog retrieval

Standardise the features, then cluster (K-means, with a Gaussian mixture as a comparison). Choose k by silhouette score and bootstrap stability, and name clusters by their behaviour, for example "late onset with long dry spell". The same feature space gives nearest-neighbour analog seasons, which power the "replay a dry year" feature.

### M3: Phenology and bare-field detection (unsupervised)

Smooth NDVI, then extract green-up, peak, senescence and low-vegetation periods with threshold or curve-fit methods. This drives the Vulnerability Calendar. Validate against the farmer's actual planting and fallow calendar and against visual checks of image chips.

### M4: Rainfall and temperature trends (statistics, not ML)

Mann-Kendall trend tests with Sen's slope, plus onset and dry-spell definitions. We describe change; we do not sell precise forecasts.

### M5: Crop-water simulation surrogate (stretch goal)

Run an open crop-water model such as AquaCrop (the Python AquaCrop-OSPy port, to be checked) over many weather, soil and crop combinations, using a weather generator for variety. Then train a fast regressor (gradient boosting with quantile outputs) to predict a simulated relative stress or yield index with intervals. That makes the scenario sliders instant. Outputs must be labelled simulated, and crop parameters need expert calibration. Validate the surrogate against the simulator on held-out years.

### M6: Decision layer (multi-criteria scoring with uncertainty)

- Each criterion is normalised to 0–1: water efficiency, heat and drought exposure, soil health, erosion protection, pest-cycle disruption, income and market, labour fit.
- Strategy score = Σ (farmer weight × criterion score).
- Criterion scores come from a sourced crop knowledge table, adjusted by the environmental features (and M5 if built).
- A Monte Carlo over the weights and the criterion uncertainty yields rank probabilities, for example "Strategy A ranks first in 71% of runs". That is the rank-stability feature.

### M7: Evidence Passport

A structured JSON object per strategy (datasets, coverage, method, evidence tier, confidence, gaps, required local review), rendered into plain language by templates, not free-form generation, so nothing unsupported appears.

### M8: Bayesian feedback (roadmap)

Expert effects as priors, updated by graded farmer outcomes. Design the schema now and build it later.

## Serving design

Precompute the pilot area's features and clusters offline. At request time the app looks up the farmer's cell, applies their priorities and rotation, runs M6 (and M5 if present), and returns results in under a few seconds.

- **Request:** location, current rotation, priorities and an optional scenario.
- **Response:** strategies, scores, rank probabilities, calendar data and Evidence Passports.
- **Principle:** heavy computation stays server-side so the farmer's phone only receives a small result.

## Validation plan

This is what judges will probe.

- **Time-aware testing:** leave-one-year-out, never random splits.
- **Rainfall:** compare IMERG against ERA5 (and CHIRPS if used) and any local gauge or farmer rainfall notes.
- **Phenology:** compare against the farmer's calendar.
- **Anomalies:** compare against seasons the farmer remembers as bad.
- **Clustering:** stability across bootstrap samples.
- **Scoring:** sensitivity analysis plus review of the knowledge table by an agronomist.
- **Everything:** compare against a simple baseline and report limits, with a model card per module.

## Build order for the hackathon

1. **Must have:** ingestion with provenance, QC, features, M3 (calendar), M1 and M2, M6 with rank probabilities, M7, and a basic interface.
2. **Should have:** scenario sliders using analog seasons and parameter perturbation, then M5 if time allows.
3. **Roadmap:** M8, the enterprise layer and additional regions.

## Main risks

- Cloud gaps and mixed pixels could weaken NDVI signals, so we rely on smoothing and say so.
- The knowledge table is only as good as its sources. Every entry needs a citation and an expert check.
- M5 is the riskiest for time, which is why it is labelled a stretch goal.

## Open items

- Confirm the pilot location and the partner farmer's current crops and rotation. These fix the area of interest, the baseline strategy, and which crops go into the knowledge table.
- Finalise the technology stack once this workflow is agreed.
