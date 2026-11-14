"""M7 Evidence Passport generator aligned with Supabase ``evidence_passports`` schema."""
from __future__ import annotations

from typing import Any
import uuid

import pandas as pd

from fieldshift.ingest.manifest import NON_GLOBAL_US_BASELINES

VALID_EVIDENCE_TIERS: tuple[str, ...] = (
    "established_science",
    "data_derived_finding",
    "farmer_reported_observation",
    "unverified_hypothesis",
    "expert_validated_insight",
)


def make_passport_uuid(cell_id: str, strategy_code: str) -> str:
    """Return a deterministic UUIDv5 primary key for (cell_id, strategy_code)."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"fieldshift.pilot:{cell_id}:{strategy_code}"))


def _select_evidence_tier(expert_review_status: str) -> str:
    status = expert_review_status.strip().lower()
    if status == "pending_local_review":
        return "unverified_hypothesis"
    if status == "expert_validated":
        return "expert_validated_insight"
    return "data_derived_finding"


def _split_checks(raw: Any) -> list[str]:
    if raw is None:
        return []
    text = str(raw).strip()
    if not text:
        return []
    return [part.strip() for part in text.split(";") if part.strip()]


def generate_evidence_passports(
    cell_id: str,
    strategy_records: list[dict[str, Any]],
    cell_features_df: pd.DataFrame,
    rotations_df: pd.DataFrame,
    scale_honesty: dict[str, Any],
    cell_meta: dict[str, Any] | None = None,
    provenance_records: list[dict[str, Any]] | None = None,
    farm_area_ha: float = 2.0,
    soil_summary: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Build Evidence Passports for all scored strategies of a pilot cell and link ``passport_id``."""
    rotations_by_code = {
        str(r["strategy_code"]): dict(r)
        for r in rotations_df.to_dict(orient="records")
    }

    years = sorted({int(y) for y in cell_features_df["year"].tolist()}) if not cell_features_df.empty else [2022, 2023, 2024, 2025]
    major_rows = cell_features_df[cell_features_df["season"] == "major"]
    minor_rows = cell_features_df[cell_features_df["season"] == "minor"]

    major_rain = float(major_rows["total_rain_mm"].median()) if not major_rows.empty else 0.0
    minor_rain = float(minor_rows["total_rain_mm"].median()) if not minor_rows.empty else 0.0
    max_dry_spell = int(minor_rows["longest_dry_spell_days"].max()) if not minor_rows.empty else 0
    mean_erosion = float(cell_features_df["erosion_exposure_index"].mean()) if not cell_features_df.empty else 0.0

    soil_clause = ""
    ph_val = soil_summary.get("soil_ph", soil_summary.get("ph_water")) if soil_summary else None
    if soil_summary and ph_val is not None:
        texture_val = soil_summary.get("soil_texture", soil_summary.get("usda_texture", "soil texture"))
        soil_clause = (
            f" ISRIC SoilGrids topsoil baseline indicates pH {float(ph_val):.1f}"
            f" ({texture_val}, ~{float(soil_summary.get('clay_pct', 0)):.0f}% clay at 250 m)."
        )

    obs_summary = (
        f"Across {years[0]}-{years[-1]} in cell {cell_id}, median major-season rainfall is {major_rain:.0f} mm "
        f"and minor-season rainfall is {minor_rain:.0f} mm with peak minor dry spells up to {max_dry_spell} days "
        f"(mean bare-soil erosion exposure {mean_erosion:.2f}).{soil_clause}"
    ).strip()

    datasets_used = provenance_records if provenance_records else [
        {
            "dataset_key": "nasa_power",
            "product": "NASA POWER Daily Agroclimatology",
            "retrieval_mode": "synthetic_pilot",
            "native_resolution_km": 50.0,
        },
        {
            "dataset_key": "imerg_rain",
            "product": "GPM IMERG Final Daily (GPM_3IMERGDF V07)",
            "retrieval_mode": "synthetic_pilot",
            "native_resolution_km": 10.0,
        },
        {
            "dataset_key": "smap_soil_moisture",
            "product": "SMAP L3 & L4 Soil Moisture (SPL3SMP_E / SPL4SMGP)",
            "retrieval_mode": "synthetic_pilot",
            "native_resolution_km": 9.0,
        },
        {
            "dataset_key": "soilgrids",
            "product": "ISRIC SoilGrids v2.0",
            "retrieval_mode": "synthetic_pilot",
            "native_resolution_km": 0.25,
        },
    ]

    meta = cell_meta or {}
    coverage = {
        "cell_id": cell_id,
        "center_lat": meta.get("center_lat", 6.85),
        "center_lon": meta.get("center_lon", -1.45),
        "years": years,
        "seasons": ["major", "minor"],
        "time_step": "dekad",
        "farm_area_ha": round(float(farm_area_ha), 3),
    }

    excluded_notes = "; ".join(
        f"{key} ({spec['coverage']} -> {spec['global_substitute']})"
        for key, spec in NON_GLOBAL_US_BASELINES.items()
    )
    scale_note = (
        f"{scale_honesty.get('summary', '')} "
        f"US-only baselines excluded for Ghana: {excluded_notes}; global NASA POWER, GPM IMERG, and ISRIC SoilGrids v2.0 used instead."
    ).strip()

    passports: list[dict[str, Any]] = []
    for strat in strategy_records:
        code = str(strat["strategy_code"])
        rot = rotations_by_code.get(code, {})
        passport_id = make_passport_uuid(cell_id, code)
        strat["passport_id"] = passport_id

        review_status = str(rot.get("expert_review_status", "literature_cited"))
        tier = _select_evidence_tier(review_status)
        if tier not in VALID_EVIDENCE_TIERS:
            tier = "data_derived_finding"

        local_checks = _split_checks(rot.get("required_local_checks"))
        if not local_checks:
            local_checks = ["Confirm plot soil drainage, labour timing, and certified seed access before planting."]

        citation = str(rot.get("source_citation", "CSIR-CRI & MoFA Ghana")).strip()
        key_finding = (
            f"{strat['strategy_name']} achieves MCDA base score {strat['default_base_score']:.3f} "
            f"(prob_first={strat['default_prob_first'] * 100:.1f}%, mean_rank={strat['default_mean_rank']:.2f}) "
            f"grounded in {citation}."
        )
        unc_vals = strat.get("score_uncertainties", [0.1, 0.1, 0.1, 0.1])
        unc_summary = (
            f"Per-criterion sigma ranges {min(unc_vals):.2f}-{max(unc_vals):.2f}; "
            f"2000-run Monte Carlo rank-1 probability is {strat['default_prob_first'] * 100:.1f}% "
            f"under +/-0.10 weight sensitivity."
        )

        passports.append(
            {
                "passport_id": passport_id,
                "cell_id": cell_id,
                "strategy_code": code,
                "evidence_tier": tier,
                "observation_summary": obs_summary,
                "datasets_used": datasets_used,
                "spatial_temporal_coverage": coverage,
                "method_applied": (
                    "36-dekad QC cube -> M1 IsolationForest anomaly / M2 DTW+KMeans analogs / "
                    "M3 NDVI phenology / M4 Mann-Kendall trend -> M6 MCDA fusion & 2000-run Monte Carlo"
                ),
                "key_finding": key_finding,
                "uncertainty_summary": unc_summary,
                "scale_honesty_note": scale_note,
                "information_gaps": list(strat.get("information_gaps", [])),
                "required_local_review": local_checks,
                "validator_roles": [
                    "Ashanti Farmer / Land Manager",
                    "MoFA District Extension Officer",
                    "CSIR-CRI Regional Agronomist",
                ],
            }
        )

    return passports
