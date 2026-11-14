"""Earth observation ingestion adapters and provenance tracking."""

from fieldshift.ingest.manifest import (
    DATASETS_REGISTRY,
    VALID_RETRIEVAL_MODES,
    DatasetSpec,
    ProvenanceManifest,
    ProvenanceRecord,
    compute_payload_sha256,
)
from fieldshift.ingest.sources import (
    DEFAULT_POWER_PARAMETERS,
    build_power_request_url,
    generate_ashanti_pilot_raw_daily,
    search_earthaccess_granules,
)

__all__ = [
    "DATASETS_REGISTRY",
    "DEFAULT_POWER_PARAMETERS",
    "DatasetSpec",
    "ProvenanceManifest",
    "ProvenanceRecord",
    "VALID_RETRIEVAL_MODES",
    "build_power_request_url",
    "compute_payload_sha256",
    "generate_ashanti_pilot_raw_daily",
    "search_earthaccess_granules",
]
