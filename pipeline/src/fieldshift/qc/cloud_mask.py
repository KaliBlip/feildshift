"""Optical cloud masking and dekad QA tier classification."""
from __future__ import annotations

import numpy as np
import pandas as pd


def apply_optical_qa_mask(
    ndvi_raw: np.ndarray | pd.Series,
    cloud_prob: np.ndarray | pd.Series,
    max_cloud_prob: float = 0.35,
) -> np.ndarray:
    """Mask cloud-contaminated or physically invalid optical NDVI values as NaN."""
    if not (0.0 <= max_cloud_prob <= 1.0):
        raise ValueError("max_cloud_prob must be between 0.0 and 1.0")

    ndvi_arr = np.asarray(ndvi_raw, dtype=float)
    cloud_arr = np.asarray(cloud_prob, dtype=float)
    if ndvi_arr.shape != cloud_arr.shape:
        raise ValueError("ndvi_raw and cloud_prob must have identical shapes")

    valid_mask = (
        np.isfinite(ndvi_arr)
        & np.isfinite(cloud_arr)
        & (cloud_arr <= max_cloud_prob)
        & (ndvi_arr >= -0.2)
        & (ndvi_arr <= 1.0)
    )
    return np.where(valid_mask, ndvi_arr, np.nan)


def classify_qa_tier(valid_fraction: float) -> str:
    """Classify dekad optical observation coverage into standard QA tiers."""
    if not np.isfinite(valid_fraction) or valid_fraction < 0.0 or valid_fraction > 1.0:
        raise ValueError(f"valid_fraction must be in [0, 1], got {valid_fraction!r}")
    if valid_fraction >= 0.70:
        return "high"
    if valid_fraction >= 0.35:
        return "moderate"
    return "low_cloud_gap"
