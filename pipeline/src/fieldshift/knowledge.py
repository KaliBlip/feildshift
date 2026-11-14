"""Cited Ashanti crop & rotation knowledge-table loaders and integrity validators."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

DEFAULT_KNOWLEDGE_DIR = Path(__file__).resolve().parents[3] / "knowledge"
VALID_REVIEW_STATUSES = frozenset(
    {"pending_local_review", "literature_cited", "expert_validated"}
)


def _validate_citation_and_status(df: pd.DataFrame, table_name: str) -> None:
    required = {"source_citation", "expert_review_status"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{table_name} missing required metadata columns: {sorted(missing)}")
    if df.empty:
        raise ValueError(f"{table_name} cannot be empty")

    for idx, row in df.iterrows():
        citation = str(row["source_citation"]).strip()
        status = str(row["expert_review_status"]).strip()
        if not citation or citation.lower() == "nan":
            raise ValueError(f"{table_name} row {idx} is missing a source_citation")
        if status not in VALID_REVIEW_STATUSES:
            raise ValueError(
                f"{table_name} row {idx} has invalid expert_review_status {status!r}"
            )


def load_crops_table(knowledge_dir: Path | str | None = None) -> pd.DataFrame:
    """Load and validate crops_ashanti.csv."""
    base = Path(knowledge_dir) if knowledge_dir is not None else DEFAULT_KNOWLEDGE_DIR
    df = pd.read_csv(base / "crops_ashanti.csv")
    _validate_citation_and_status(df, "crops_ashanti.csv")
    return df


def load_rotations_table(knowledge_dir: Path | str | None = None) -> pd.DataFrame:
    """Load and validate rotations_ashanti.csv."""
    base = Path(knowledge_dir) if knowledge_dir is not None else DEFAULT_KNOWLEDGE_DIR
    df = pd.read_csv(base / "rotations_ashanti.csv")
    _validate_citation_and_status(df, "rotations_ashanti.csv")
    return df


def validate_knowledge_tables(knowledge_dir: Path | str | None = None) -> dict[str, int]:
    """Validate all Ashanti knowledge CSV tables and return row counts."""
    crops = load_crops_table(knowledge_dir)
    rotations = load_rotations_table(knowledge_dir)
    return {
        "crops_count": len(crops),
        "rotations_count": len(rotations),
    }
