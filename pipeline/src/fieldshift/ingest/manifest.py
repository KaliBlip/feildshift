"""Dataset registry and SHA-256 provenance manifest tracking."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

VALID_RETRIEVAL_MODES = frozenset({"live", "cached", "synthetic_pilot"})


@dataclass(frozen=True)
class DatasetSpec:
    """Metadata describing an Earth observation or partner dataset."""

    dataset_key: str
    short_name: str
    provider: str
    product_version: str
    resolution_km: float
    temporal_cadence: str
    limitation_note: str


DATASETS_REGISTRY: dict[str, DatasetSpec] = {
    "imerg": DatasetSpec(
        dataset_key="imerg",
        short_name="GPM_3IMERGDF",
        provider="NASA GES DISC",
        product_version="V07B",
        resolution_km=10.0,
        temporal_cadence="daily",
        limitation_note="Satellite precipitation (~10 km); requires local gauge checks.",
    ),
    "smap": DatasetSpec(
        dataset_key="smap",
        short_name="SPL3SMP_E",
        provider="NASA NSIDC DAAC",
        product_version="006",
        resolution_km=9.0,
        temporal_cadence="2-3 days",
        limitation_note="Coarse surface soil moisture (0-5 cm); regional context only.",
    ),
    "modis_ndvi": DatasetSpec(
        dataset_key="modis_ndvi",
        short_name="MOD13Q1",
        provider="NASA LP DAAC",
        product_version="061",
        resolution_km=0.25,
        temporal_cadence="16-day / daily HLS blend",
        limitation_note="250 m pixels mix smallholder plots; cloud gaps during rainy seasons.",
    ),
    "landsat": DatasetSpec(
        dataset_key="landsat",
        short_name="HLSL30",
        provider="NASA LP DAAC / USGS",
        product_version="2.0",
        resolution_km=0.03,
        temporal_cadence="5-16 days",
        limitation_note="30 m field detail, severely cloud-limited in Ashanti peak rains.",
    ),
    "srtm": DatasetSpec(
        dataset_key="srtm",
        short_name="SRTMGL1",
        provider="NASA LP DAAC",
        product_version="003",
        resolution_km=0.03,
        temporal_cadence="static",
        limitation_note="Static elevation/slope baseline; no dynamic tillage changes.",
    ),
    "ecostress": DatasetSpec(
        dataset_key="ecostress",
        short_name="ECO2LSTE",
        provider="NASA LP DAAC",
        product_version="002",
        resolution_km=0.07,
        temporal_cadence="irregular",
        limitation_note="Patchy revisit schedule; supporting heat-stress evidence only.",
    ),
    "nasa_power": DatasetSpec(
        dataset_key="nasa_power",
        short_name="POWER_DAILY_AGRO",
        provider="NASA LaRC POWER",
        product_version="v9",
        resolution_km=50.0,
        temporal_cadence="daily",
        limitation_note="Coarse gridded agroclimate (~50 km); regional baseline only.",
    ),
    "soilgrids": DatasetSpec(
        dataset_key="soilgrids",
        short_name="ISRIC_SOILGRIDS_V2",
        provider="ISRIC",
        product_version="2.0",
        resolution_km=0.25,
        temporal_cadence="static",
        limitation_note="Global modelled soil properties; verify with local soil tests.",
    ),
    "era5_land": DatasetSpec(
        dataset_key="era5_land",
        short_name="ECMWF_ERA5_LAND",
        provider="Copernicus C3S / ECMWF",
        product_version="v1",
        resolution_km=9.0,
        temporal_cadence="hourly / daily",
        limitation_note="Reanalysis gap-fill; cross-checked against GPM IMERG.",
    ),
}


def compute_payload_sha256(payload: bytes | str | dict[str, Any] | list[Any]) -> str:
    """Return the hex SHA-256 digest for raw bytes, text, or JSON-serializable objects."""
    if isinstance(payload, bytes):
        raw = payload
    elif isinstance(payload, str):
        raw = payload.encode("utf-8")
    else:
        raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


@dataclass(frozen=True)
class ProvenanceRecord:
    """Single dataset retrieval entry within an ingestion manifest."""

    dataset_key: str
    short_name: str
    product_version: str
    retrieval_mode: str
    bbox: tuple[float, float, float, float]
    temporal_range: tuple[str, str]
    source_uri: str
    payload_sha256: str
    record_count: int
    retrieved_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def __post_init__(self) -> None:
        if self.retrieval_mode not in VALID_RETRIEVAL_MODES:
            raise ValueError(
                f"retrieval_mode must be one of {sorted(VALID_RETRIEVAL_MODES)}, "
                f"got {self.retrieval_mode!r}"
            )


@dataclass
class ProvenanceManifest:
    """Audit manifest linking ingested products to SHA-256 checksums."""

    manifest_id: str
    region_name: str
    cell_id: str
    records: list[ProvenanceRecord] = field(default_factory=list)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    notes: str = ""

    def add_record(self, record: ProvenanceRecord) -> None:
        self.records.append(record)

    def to_dict(self) -> dict[str, Any]:
        return {
            "manifest_id": self.manifest_id,
            "region_name": self.region_name,
            "cell_id": self.cell_id,
            "created_at": self.created_at,
            "notes": self.notes,
            "records": [asdict(r) for r in self.records],
        }

    def save_json(self, path: Path | str) -> Path:
        out_path = Path(path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")
        return out_path

    @classmethod
    def load_json(cls, path: Path | str) -> ProvenanceManifest:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        records = [
            ProvenanceRecord(
                dataset_key=rec["dataset_key"],
                short_name=rec["short_name"],
                product_version=rec["product_version"],
                retrieval_mode=rec["retrieval_mode"],
                bbox=tuple(rec["bbox"]),
                temporal_range=tuple(rec["temporal_range"]),
                source_uri=rec["source_uri"],
                payload_sha256=rec["payload_sha256"],
                record_count=int(rec["record_count"]),
                retrieved_at=rec["retrieved_at"],
            )
            for rec in raw.get("records", [])
        ]
        return cls(
            manifest_id=raw["manifest_id"],
            region_name=raw["region_name"],
            cell_id=raw["cell_id"],
            records=records,
            created_at=raw["created_at"],
            notes=raw.get("notes", ""),
        )
