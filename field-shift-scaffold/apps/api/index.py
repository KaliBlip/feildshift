"""Field Shift decision service. Vercel loads the top-level `app` from this file."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np

from scoring import base_scores, rank_probabilities

app = FastAPI(title="Field Shift decision service")


class ScoreRequest(BaseModel):
    strategies: list[str]
    criteria: list[str]
    scores: list[list[float]] = Field(description="strategies x criteria, each 0..1")
    weights: list[float] = Field(description="one weight per criterion")
    score_uncertainty: float = Field(0.1, ge=0.0, le=0.5)
    weight_uncertainty: float = Field(0.1, ge=0.0, le=1.0)
    runs: int = Field(2000, ge=100, le=20000)
    seed: int | None = 42


@app.get("/api/health")
def health():
    return {"status": "ok"}


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
