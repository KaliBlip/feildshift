"""NDVI gap interpolation, upper-envelope Savitzky-Golay smoothing, and bare-soil flags."""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter


def smooth_ndvi_dekads(
    ndvi_dekad_raw: np.ndarray | pd.Series,
    window: int = 5,
    polyorder: int = 2,
) -> np.ndarray:
    """Interpolate cloud gaps and apply upper-envelope Savitzky-Golay NDVI smoothing."""
    arr = np.asarray(ndvi_dekad_raw, dtype=float)
    if arr.ndim != 1 or arr.size == 0:
        raise ValueError("ndvi_dekad_raw must be a non-empty 1D sequence")

    valid_mask = np.isfinite(arr)
    if not np.any(valid_mask):
        raise ValueError("Cannot smooth an all-NaN NDVI series")

    indices = np.arange(arr.size, dtype=float)
    interp = np.interp(indices, indices[valid_mask], arr[valid_mask])

    eff_window = min(window, arr.size)
    if eff_window % 2 == 0:
        eff_window -= 1
    if eff_window < 3:
        return np.clip(interp, 0.0, 1.0)

    eff_poly = min(polyorder, eff_window - 1)
    first_pass = savgol_filter(interp, window_length=eff_window, polyorder=eff_poly, mode="interp")
    # Pull negatively biased clear/hazy dips toward the smoothed upper canopy envelope
    upper_envelope = np.maximum(interp, first_pass)
    smoothed = savgol_filter(upper_envelope, window_length=eff_window, polyorder=eff_poly, mode="interp")
    return np.clip(np.round(smoothed, 4), 0.0, 1.0)


def detect_bare_field_dekads(
    ndvi_smooth: np.ndarray | pd.Series,
    bare_threshold: float = 0.28,
) -> np.ndarray:
    """Flag dekads where smoothed vegetation cover falls below bare-soil threshold."""
    if not (0.0 <= bare_threshold <= 1.0):
        raise ValueError("bare_threshold must be between 0.0 and 1.0")
    arr = np.asarray(ndvi_smooth, dtype=float)
    return np.isfinite(arr) & (arr < bare_threshold)
