"""Earth observation ingestion adapters and provenance tracking."""

from fieldshift.ingest.manifest import (
    DATASETS_REGISTRY,
    NON_GLOBAL_US_BASELINES,
    VALID_RETRIEVAL_MODES,
    DatasetSpec,
    ProvenanceManifest,
    ProvenanceRecord,
    compute_payload_sha256,
)
from fieldshift.ingest.sources import (
    DEFAULT_POWER_PARAMETERS,
    build_power_request_url,
    classify_usda_texture,
    fetch_earthdata_ashanti_snapshot,
    fetch_isdasoil_point,
    fetch_nasa_power_daily,
    fetch_soilgrids_point,
    generate_ashanti_pilot_raw_daily,
    search_earthaccess_granules,
)

__all__ = [
    "DATASETS_REGISTRY",
    "DEFAULT_POWER_PARAMETERS",
    "DatasetSpec",
    "NON_GLOBAL_US_BASELINES",
    "ProvenanceManifest",
    "ProvenanceRecord",
    "VALID_RETRIEVAL_MODES",
    "build_power_request_url",
    "classify_usda_texture",
    "compute_payload_sha256",
    "fetch_earthdata_ashanti_snapshot",
    "fetch_isdasoil_point",
    "fetch_nasa_power_daily",
    "fetch_soilgrids_point",
    "generate_ashanti_pilot_raw_daily",
    "search_earthaccess_granules",
]
