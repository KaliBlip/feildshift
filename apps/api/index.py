"""Field Shift decision service. Vercel loads the top-level `app` from this file."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np

from scoring import base_scores, rank_probabilities

app = FastAPI(title="Field Shift decision service")

ASHANTI_ANALOG_PRESETS = {
    "baseline": {"rain_factor": 1.0, "temp_delta_c": 0.0, "label": "2022-2025 median regime"},
    "moderate_drought": {"rain_factor": 0.80, "temp_delta_c": 1.0, "label": "Dry minor season (-20% rain)"},
    "severe_heat_drought": {"rain_factor": 0.70, "temp_delta_c": 2.0, "label": "El Nino analog (-30% rain, +2.0 C)"},
    "intense_rainfall": {"rain_factor": 1.20, "temp_delta_c": 0.5, "label": "Intense squall year (+20% rain)"},
}


class ScoreRequest(BaseModel):
    strategies: list[str]
    criteria: list[str]
    scores: list[list[float]] = Field(description="strategies x criteria, each 0..1")
    weights: list[float] = Field(description="one weight per criterion")
    score_uncertainty: float = Field(0.1, ge=0.0, le=0.5)
    weight_uncertainty: float = Field(0.1, ge=0.0, le=1.0)
    runs: int = Field(2000, ge=100, le=20000)
    seed: int | None = 42


class StressTestRequest(ScoreRequest):
    is_baseline: list[bool] | None = None
    rain_factor: float = Field(1.0, gt=0.2, le=2.0)
    temp_delta_c: float = Field(0.0, ge=-2.0, le=6.0)


def _apply_stress_matrix(
    scores: np.ndarray,
    is_baseline: list[bool] | None,
    rain_factor: float,
    temp_delta_c: float,
) -> np.ndarray:
    if abs(rain_factor - 1.0) < 1e-6 and abs(temp_delta_c) < 1e-6:
        return scores

    deficit = max(0.0, 1.0 - rain_factor)
    excess = max(0.0, rain_factor - 1.0)
    heat = max(0.0, temp_delta_c / 2.0)
    out = scores.copy()
    for i in range(out.shape[0]):
        mult = 1.35 if (is_baseline and i < len(is_baseline) and is_baseline[i]) else 0.8
        w, s, e, inc = out[i]
        out[i, 0] = np.clip(w - (0.28 * deficit + 0.04 * heat) * mult, 0.02, 0.98)
        out[i, 1] = np.clip(s - 0.08 * (deficit + excess) * mult, 0.02, 0.98)
        out[i, 2] = np.clip(e - 0.35 * excess * (1.2 - e * 0.5), 0.02, 0.98)
        out[i, 3] = np.clip(inc - (0.22 * deficit + 0.06 * heat + 0.10 * excess) * mult, 0.02, 0.98)
    return out


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/analogs")
def analogs():
    return {"region": "ashanti_pilot", "presets": ASHANTI_ANALOG_PRESETS}


@app.post("/api/score")
def score(req: ScoreRequest):
    n_s, n_c = len(req.strategies), len(req.criteria)
    if len(req.scores) != n_s or any(len(row) != n_c for row in req.scores):
        raise HTTPException(status_code=422, detail="scores must be strategies x criteria")
    if len(req.weights) != n_c or sum(req.weights) <= 0:
        raise HTTPException(status_code=422, detail="weights need one positive entry per criterion")
    S = np.array(req.scores, dtype=float)
    W = np.array(req.weights, dtype=float)
    result = rank_probabilities(S, W, req.score_uncertainty, req.weight_uncertainty, req.runs, req.seed)
    return {
        "strategies": req.strategies,
        "base_scores": base_scores(S, W).tolist(),
        **result,
        "note": "Scores are transparent weighted sums. Rank probabilities show how stable the ranking is.",
    }


@app.post("/api/stress-test")
def stress_test(req: StressTestRequest):
    n_s, n_c = len(req.strategies), len(req.criteria)
    if len(req.scores) != n_s or any(len(row) != n_c for row in req.scores) or n_c != 4:
        raise HTTPException(status_code=422, detail="scores must be strategies x 4 criteria")
    if len(req.weights) != n_c or sum(req.weights) <= 0:
        raise HTTPException(status_code=422, detail="weights need one positive entry per criterion")

    base_mat = np.array(req.scores, dtype=float)
    stressed_mat = _apply_stress_matrix(base_mat, req.is_baseline, req.rain_factor, req.temp_delta_c)
    W = np.array(req.weights, dtype=float)
    base_totals = base_scores(base_mat, W)
    stressed_totals = base_scores(stressed_mat, W)
    result = rank_probabilities(
        stressed_mat,
        W,
        req.score_uncertainty,
        req.weight_uncertainty,
        req.runs,
        req.seed,
    )

    # Compute minimax regret across standard presets relative to scenario maxima
    scenario_scores: list[np.ndarray] = [base_totals]
    for preset in ASHANTI_ANALOG_PRESETS.values():
        mat = _apply_stress_matrix(
            base_mat,
            req.is_baseline,
            float(preset["rain_factor"]),
            float(preset["temp_delta_c"]),
        )
        scenario_scores.append(base_scores(mat, W))
    stacked = np.vstack(scenario_scores)
    best_per_scenario = np.max(stacked, axis=1, keepdims=True)
    max_regret = np.max(best_per_scenario - stacked, axis=0)
    worst_case = np.min(stacked, axis=0)
    lowest_regret_idx = int(np.argmin(max_regret))

    return {
        "strategies": req.strategies,
        "rain_factor": req.rain_factor,
        "temp_delta_c": req.temp_delta_c,
        "baseline_base_scores": base_totals.tolist(),
        "stressed_scores": stressed_mat.round(4).tolist(),
        "base_scores": stressed_totals.tolist(),
        "deltas": np.round(stressed_totals - base_totals, 4).tolist(),
        "worst_case_scores": np.round(worst_case, 4).tolist(),
        "max_regrets": np.round(max_regret, 4).tolist(),
        "lowest_regret_strategy": req.strategies[lowest_regret_idx] if req.strategies else None,
        **result,
    }
