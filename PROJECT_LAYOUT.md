# Field Shift: project layout and dependency split

Status: proposal from the team-stack discussion, 14 November 2026. Items marked "verify" were not tested.

## Repository layout (one repo, web, mobile, optional API, one offline pipeline)

```text
field-shift/
├── apps/
│   ├── web/                  Next.js app (Vercel project 1, Root Directory: apps/web)
│   ├── mobile/               React Native (Expo SDK 58) app
│   └── api/                  Optional FastAPI decision service (Vercel project 2, Root Directory: apps/api)
│       ├── index.py          Defines the top-level `app` that Vercel loads
│       ├── scoring.py        numpy-only scoring and rank probabilities
│       ├── requirements.txt  LEAN runtime dependencies only
│       ├── .python-version
│       ├── .vercelignore
│       └── tests/
├── pipeline/                 Offline Python. Never deployed.
│   ├── requirements.txt      Heavy geospatial and ML dependencies
│   ├── config/pilot.yaml     Region settings (one file per region)
│   ├── src/fieldshift/       ingest, qc, features, models, decision, evidence
│   ├── notebooks/
│   └── tests/
├── knowledge/                Crop knowledge table (CSV). Every row cited and expert-reviewed.
├── supabase/migrations/      Database schema, PostGIS, row-level security policies
├── shared/test-vectors/      JSON fixtures that both Python and TypeScript scoring must reproduce
└── docs/
```

## Dependency rules

| File | Used by | Rule |
| --- | --- | --- |
| `apps/api/requirements.txt` | Vercel decision service | fastapi, pydantic, numpy only. Add pandas or lightgbm only after measuring the bundle. |
| `pipeline/requirements.txt` | Your laptop, Colab, scheduled jobs | Everything heavy lives here: rasterio, geopandas, xarray, dask, zarr, scikit-learn, scipy, mlflow. |

Why the split matters: Vercel's current docs give Python functions a 500 MB uncompressed limit, and by default Python functions include every file reachable at build time, with no tree-shaking. A single shared requirements file would pull the geospatial stack into the service.

## Deployment

1. Hackathon: deploy only `apps/web`. Scoring and rank probabilities run in TypeScript from precomputed grids in Supabase. No Python server, no Docker.
2. Optional later: deploy `apps/api` as a second Vercel project from the same repo, with Root Directory set to `apps/api` (verify in Vercel project settings). Vercel's docs also describe a Services feature for running a Python API alongside Next.js in one project (verify setup before choosing it).
3. Vercel finds the entrypoint in files such as `index.py`, `app.py` or `main.py`, which must define a top-level `app`. It reads dependencies from `requirements.txt` or `pyproject.toml`.
4. The free Hobby plan is for personal, non-commercial use.

## Day-one check (do this before building on top)

1. Deploy `apps/api` as it is. Open `/api/health`, then POST to `/api/score`.
2. Set the environment variable `VERCEL_ANALYZE_BUILD_OUTPUT=1`, redeploy, and read the size breakdown in the build logs.
3. Confirm Python 3.12 is accepted (the file `apps/api/.python-version`). If not, use a supported version listed in Vercel's docs.

## Keeping TypeScript and Python scoring in agreement

`shared/test-vectors/scoring_basic.json` holds a deterministic example. Both implementations must reproduce `expected_base_scores` to 1e-9. Monte Carlo output is compared only within a statistical tolerance, because random generators differ between languages. The numbers in the fixture are illustrative, not real agronomic scores.

## Not included yet

- Supabase schema and row-level security policies.
