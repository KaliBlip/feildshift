"""M3: Unsupervised NDVI phenology and bare-field window extraction."""
from __future__ import annotations

import numpy as np
import pandas as pd

from fieldshift.config import PilotConfig, load_pilot_config


def _longest_true_run(flags: np.ndarray) -> int:
    best = 0
    current = 0
    for val in flags:
        if bool(val):
            current += 1
            if current > best:
                best = current
        else:
            current = 0
    return int(best)


def _window_greenup_and_peak(
    dekads: np.ndarray,
    ndvi: np.ndarray,
    baseline_ndvi: float,
) -> tuple[int | None, int | None, float]:
    if dekads.size == 0 or not np.any(np.isfinite(ndvi)):
        return None, None, 0.0

    peak_local = int(np.nanargmax(ndvi))
    peak_ndvi = round(float(ndvi[peak_local]), 4)
    peak_dekad = int(dekads[peak_local])

    greenup_target = baseline_ndvi + 0.40 * max(0.0, peak_ndvi - baseline_ndvi)
    pre_peak_mask = (np.arange(dekads.size) <= peak_local) & (ndvi >= greenup_target)
    hits = dekads[pre_peak_mask]
    greenup_dekad = int(hits[0]) if hits.size > 0 else peak_dekad
    return greenup_dekad, peak_dekad, peak_ndvi


def extract_ndvi_phenology(
    cube_df: pd.DataFrame,
    bare_threshold: float = 0.28,
    cfg: PilotConfig | None = None,
) -> pd.DataFrame:
    """Extract bimodal canopy green-up/peak dekads and bare-soil exposure metrics."""
    if cube_df.empty:
        return pd.DataFrame()

    if cfg is None:
        cfg = load_pilot_config()

    maj_start = cfg.seasons["major"].start_dekad if "major" in cfg.seasons else 7
    maj_end = cfg.seasons["major"].end_dekad if "major" in cfg.seasons else 21
    min_start = cfg.seasons["minor"].start_dekad if "minor" in cfg.seasons else 25
    min_end = cfg.seasons["minor"].end_dekad if "minor" in cfg.seasons else 33

    rows: list[dict] = []
    for (cell_id, year), grp in cube_df.groupby(["cell_id", "year"], sort=True):
        s = grp.sort_values("dekad")
        dekads = s["dekad"].to_numpy(dtype=int)
        ndvi = s["ndvi_smooth"].to_numpy(dtype=float)

        baseline_ndvi = float(np.nanpercentile(ndvi, 15))
        maj_mask = (dekads >= maj_start) & (dekads <= maj_end)
        min_mask = (dekads >= min_start) & (dekads <= min_end)

        maj_greenup, maj_peak, maj_peak_val = _window_greenup_and_peak(
            dekads[maj_mask], ndvi[maj_mask], baseline_ndvi
        )
        min_greenup, min_peak, min_peak_val = _window_greenup_and_peak(
            dekads[min_mask], ndvi[min_mask], baseline_ndvi
        )

        bare_flags = np.isfinite(ndvi) & (ndvi < bare_threshold)
        bare_dekads = [int(d) for d in dekads[bare_flags]]

        rows.append(
            {
                "cell_id": str(cell_id),
                "year": int(year),
                "baseline_ndvi": round(baseline_ndvi, 4),
                "major_greenup_dekad": maj_greenup,
                "major_peak_dekad": maj_peak,
                "major_peak_ndvi": maj_peak_val,
                "minor_greenup_dekad": min_greenup,
                "minor_peak_dekad": min_peak,
                "minor_peak_ndvi": min_peak_val,
                "bare_dekad_count": len(bare_dekads),
                "bare_fraction": round(float(np.mean(bare_flags)), 4),
                "longest_bare_spell_dekads": _longest_true_run(bare_flags),
                "bare_dekad_indices": bare_dekads,
            }
        )

    return pd.DataFrame(rows).sort_values(["cell_id", "year"]).reset_index(drop=True)
