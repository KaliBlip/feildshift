# Field Shift: Build Phases & Work Assignment

**Team & Environments:**
- **`kaliblip` (macOS):** Mobile app (`apps/mobile/`), offline ML & Earth observation pipeline (`pipeline/`), crop knowledge base (`knowledge/`), FastAPI decision service (`apps/api/`), and Supabase pipeline migrations/uploads (`supabase/`).
- **`OdinID-CS` (Linux):** Web application (`apps/web/`), interactive map & calendar visualizations, strategy comparison & scenario sliders UI, Evidence Passport & glossary UI, localization, PWA offline support, and Vercel web deployment.

---

## 1. Repository Ownership Matrix

| Area | Directory / Files | Primary Owner | Collaborator / Reviewer | Notes |
| --- | --- | --- | --- | --- |
| Offline ML & EO Pipeline | `pipeline/` (`ingest`, `qc`, `features`, `models`, `decision`, `evidence`) | `kaliblip` | `OdinID-CS` | Computes features, calendars, clusters, anomalies, and Evidence Passports; writes outputs to Supabase. |
| Crop Knowledge Base | `knowledge/` | `kaliblip` | `OdinID-CS` | Sourced CSV crop & rotation tables; every entry carries a citation and expert-review status. |
| Mobile App (Expo SDK 58) | `apps/mobile/` | `kaliblip` | `OdinID-CS` | Farmer & extension-officer React Native experience with shared TS scoring logic. |
| Optional FastAPI Service | `apps/api/` | `kaliblip` | `OdinID-CS` | Python scoring & optional M5 surrogate API; Vercel Python 3.12 runtime. |
| Web App (Next.js) | `apps/web/` | `OdinID-CS` | `kaliblip` | Primary web PWA for judges, farmers, and extension officers (Vercel project `apps/web`). |
| Database & PostGIS Schema | `supabase/migrations/` | `kaliblip` (schema/ingest) | `OdinID-CS` (web queries & RLS) | Schema agreed jointly before Phase 1 queries; RLS separates farmer vs. officer roles. |
| Shared Parity Fixtures | `shared/test-vectors/` | Joint (`kaliblip` + `OdinID-CS`) | Both | Python (`apps/api`) and TypeScript (`apps/web`, `apps/mobile`) scoring must match to `1e-9`. |

---

## 2. Build Phases (Parallel Workstreams)

### Phase 0 — Repository Foundations, App Scaffolds & Scoring Parity ✅ Completed

- **Shared (`kaliblip` + `OdinID-CS`):**
  - Flattened monorepo layout (`apps/web`, `apps/mobile`, `apps/api`, `pipeline`, `knowledge`, `supabase`, `shared`).
  - Verified deterministic `1e-9` scoring parity across Python (`apps/api/scoring.py`), Web (`apps/web/src/lib/scoring.ts`), and Mobile (`apps/mobile/src/lib/scoring.ts`) against `shared/test-vectors/scoring_basic.json`.
  - Documented web feature specification (`apps/web/README.md`) and macOS/Linux Python 3.12 `.venv` onboarding (`PROJECT_LAYOUT.md`).

---

### Phase 1 — Data Contracts, Supabase Schema & Pilot Ingestion (`Must Have`)

**Integration gate:** Agree on Supabase table schemas (`pilot_cells`, `dekad_timeseries`, `season_features`, `strategy_scores`, `evidence_passports`, `decision_logs`, `outcome_reports`) in `supabase/migrations/`.

| Owner | Tasks | Deliverables |
| --- | --- | --- |
| **`kaliblip`** | • Confirm pilot area coordinates & bounding box in `pipeline/config/pilot.yaml` (50 × 50 km around Ashanti partner farm).<br>• Build `pipeline/src/fieldshift/ingest/` (`earthaccess` for IMERG/SMAP/HLS/Landsat/MODIS/SRTM, POWER REST API, SoilGrids, CDS ERA5) with provenance manifest.<br>• Build `pipeline/src/fieldshift/qc/` (cloud masking, NDVI smoothing, dekad harmonisation cube).<br>• Design `supabase/migrations/` PostGIS tables & RLS policies.<br>• Set up `apps/mobile` tab navigation shell (Home, Calendar, Compare, Passport). | Raw archive + provenance manifest; clean dekad analysis cube; initial SQL migrations; mobile nav shell. |
| **`OdinID-CS`** | • Configure Supabase client & TypeScript database types in `apps/web`.<br>• Build **Farm Context & Priority Input** UI in `apps/web` (pilot cell selector, existing rotation baseline input, interactive priority sliders).<br>• Wire `apps/web/src/lib/scoring.ts` to live priority slider state. | Interactive priority-input state + Supabase read setup in `apps/web`. |

---

### Phase 2 — Environmental Intelligence, Knowledge Table & Core Visuals (`Must Have`)

| Owner | Tasks | Deliverables |
| --- | --- | --- |
| **`kaliblip`** | • Build `pipeline/src/fieldshift/features/` (rainfall onset, total/variability, longest dry spell, heavy-rain days, heat-stress days, FAO-56 ET0 & water balance, SMAP soil moisture anomaly, NDVI phenology metrics, bare-period fraction, slope, erosion exposure).<br>• Implement **M1** (Isolation Forest + z-score anomaly detection), **M2** (K-means/GMM season clustering & analog retrieval), **M3** (unsupervised NDVI phenology & bare-field detection), and **M4** (Mann-Kendall / Sen's slope trends) in `pipeline/src/fieldshift/models/`.<br>• Populate cited Ashanti crop & rotation parameter CSVs in `knowledge/`. | Feature tables, M1–M4 outputs, and cited `knowledge/*.csv` tables. |
| **`OdinID-CS`** | • Build the **Seasonal Vulnerability & Bare-Field Calendar** component in `apps/web` using Recharts (dekad-by-dekad rainfall reliability, soil moisture anomaly, NDVI cover, heat stress, bare-field exposure, anomaly badges).<br>• Build the **Interactive Map Explorer** using MapLibre GL (`react-map-gl`) with layer toggles (NDVI, soil moisture, rainfall, SRTM terrain) and time scrubbing.<br>• Implement the **Scale-Honesty Banner** comparing each dataset's native resolution against the user's farm area. | Vulnerability Calendar, MapLibre map explorer, and Scale-Honesty UI in `apps/web`. |

---

### Phase 3 — Decision Layer, Evidence Passports & Strategy Comparison (`Must Have`)

| Owner | Tasks | Deliverables |
| --- | --- | --- |
| **`kaliblip`** | • Implement **M6** (`pipeline/src/fieldshift/decision/`) combining `knowledge/*.csv` crop criteria with cell environmental features.<br>• Implement **M7** (`pipeline/src/fieldshift/evidence/`) deterministic template generator for structured JSON Evidence Passports (evidence tier, datasets, coverage, method, uncertainty, gaps, required local review).<br>• Publish precomputed pilot tables, calendars, analog vectors, and Evidence Passports into Supabase.<br>• Implement `apps/mobile` screens: priority sliders, Vulnerability Calendar summary, 3+ Strategy Comparison cards, and Evidence Passport view. | Precomputed Supabase pilot dataset + working `apps/mobile` core flow. |
| **`OdinID-CS`** | • Connect `apps/web` to Supabase precomputed tables (plus fallback fixture mode for offline/local dev).<br>• Build **Rotation Strategy Comparison Cards** (Farmer's Baseline + Strategies A, B, C) displaying weighted scores, **Monte Carlo rank probabilities** (`rankProbabilities`), expected benefits, gaps, and risks.<br>• Build the **Evidence Passport** drawer/modal and **Plain-Language Glossary** tooltips (`NDVI`, `ET`, `dry spell`, `bare-field period`, etc.). | End-to-end core decision UI in `apps/web`. |

---

### Phase 4 — Climate Stress-Testing, Analog Replay & Offline Support (`Should Have`)

| Owner | Tasks | Deliverables |
| --- | --- | --- |
| **`kaliblip`** | • Export historical analog season presets (driest, wettest, hottest) and perturbation curves from M2.<br>• *(Stretch)* Evaluate **M5** (AquaCrop-OSPy + quantile LightGBM surrogate) and expose via `apps/api/index.py` if bundle size permits.<br>• Add local caching/offline fallback for the last farm result on `apps/mobile`. | Analog season data + mobile offline result cache (+ optional M5 endpoint). |
| **`OdinID-CS`** | • Build **Climate Stress-Testing** controls in `apps/web`: rainfall/temperature sliders and one-click historical analog season replay updating rank-stability probabilities live.<br>• Add printable / low-bandwidth one-page summary cards and PWA service-worker caching of the last result card + offline queued outcome reports. | Interactive scenario sliders, analog replay, print view, and PWA caching in `apps/web`. |

---

### Phase 5 — Validation, Localization, Officer Workflow & Demo Polish (`Should Have` / `Demo`)

| Owner | Tasks | Deliverables |
| --- | --- | --- |
| **`kaliblip`** | • Run time-aware validation (leave-one-year-out), IMERG vs. ERA5/CHIRPS rainfall cross-checks, cluster bootstrap stability, and sensitivity checks; generate per-module model cards in `docs/`.<br>• Verify `apps/mobile` demo walkthrough against the Ashanti partner scenario. | Validation metrics, model cards, and mobile demo sign-off. |
| **`OdinID-CS`** | • Add English & Twi translation support (`next-intl`).<br>• Build role-protected Extension Officer routes (decision logging + field outcome grading) and the **SMS / USSD web mock** for the demo.<br>• Deploy `apps/web` to Vercel (`Root Directory: apps/web`) and verify mobile responsiveness. | Deployed `apps/web` demo with Twi toggle, officer workflow, and SMS/USSD mock. |

---

### Phase 6 — Post-Hackathon Roadmap (`Later`)

- **`kaliblip`:** Implement **M8** Bayesian outcome feedback updating (`PyMC`), expand `pipeline/config/` to additional Ghanaian/West African regions, and build native EAS mobile distribution.
- **`OdinID-CS` + `kaliblip`:** Integrate live **Africa's Talking** SMS/USSD and WhatsApp Business APIs alongside verified officer review workflows.

---

## 3. Collaboration & Git Workflow

1. **Conflict-free directory boundaries:** `kaliblip` works primarily in `pipeline/`, `knowledge/`, `apps/mobile/`, `apps/api/`, and `supabase/migrations/`; `OdinID-CS` works primarily in `apps/web/`. Changes to `shared/` or Supabase table schemas should be reviewed by both developers.
2. **Branching & PRs:**
   - `kaliblip` works on branch `kaliblip` → PR into `main`.
   - `OdinID-CS` works on branch `OdinID` (or feature branches from `main`) → PR into `main`.
   - Pull `main` before starting each new phase to stay synced on Supabase schema migrations and shared test vectors.
3. **Cross-platform parity check before merging scoring changes:**
   - Python: `.venv/bin/pytest -v apps/api/tests/test_scoring.py`
   - Web: `npm --prefix apps/web test`
   - Mobile: `npm --prefix apps/mobile test`
