"""Transparent multi-criteria scoring with Monte Carlo rank probabilities (numpy only)."""
from __future__ import annotations

import numpy as np


def base_scores(scores: np.ndarray, weights: np.ndarray) -> np.ndarray:
    """Weighted sum per strategy. scores: (strategies, criteria) in 0..1; weights are normalised."""
    w = weights / weights.sum()
    return scores @ w


def rank_probabilities(
    scores: np.ndarray,
    weights: np.ndarray,
    score_uncertainty: float = 0.1,
    weight_uncertainty: float = 0.1,
    runs: int = 2000,
    seed: int | None = 42,
) -> dict:
    """Perturb weights and criterion scores, then report how often each strategy ranks first."""
    rng = np.random.default_rng(seed)
    n_strategies, n_criteria = scores.shape

    w = weights * (1.0 + rng.normal(0.0, weight_uncertainty, size=(runs, n_criteria)))
    w = np.clip(w, 0.0, None)
    totals_w = w.sum(axis=1, keepdims=True)
    totals_w[totals_w == 0] = 1.0
    w = w / totals_w

    s = scores[None, :, :] + rng.normal(0.0, score_uncertainty, size=(runs, n_strategies, n_criteria))
    s = np.clip(s, 0.0, 1.0)

    totals = np.einsum("rsc,rc->rs", s, w)
    ranks = (-totals).argsort(axis=1).argsort(axis=1)  # 0 = best
    return {
        "probability_first": (ranks == 0).mean(axis=0).tolist(),
        "mean_rank": (ranks.mean(axis=0) + 1).tolist(),
    }
