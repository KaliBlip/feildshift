"""Environmental analytics and unsupervised ML models (M1 to M4)."""

from fieldshift.models.anomaly import (
    DEFAULT_ANOMALY_FEATURES,
    detect_season_anomalies,
)
from fieldshift.models.clustering import (
    DEFAULT_CLUSTER_FEATURES,
    cluster_seasons_and_analogs,
    retrieve_analog_seasons,
)
from fieldshift.models.phenology import extract_ndvi_phenology
from fieldshift.models.trends import (
    analyze_seasonal_trends,
    enrich_season_features_with_models,
)
from fieldshift.models.validation import (
    evaluate_cluster_bootstrap_stability,
    evaluate_leave_one_year_out,
    evaluate_rainfall_source_agreement,
)

__all__ = [
    "DEFAULT_ANOMALY_FEATURES",
    "DEFAULT_CLUSTER_FEATURES",
    "analyze_seasonal_trends",
    "cluster_seasons_and_analogs",
    "detect_season_anomalies",
    "enrich_season_features_with_models",
    "evaluate_cluster_bootstrap_stability",
    "evaluate_leave_one_year_out",
    "evaluate_rainfall_source_agreement",
    "extract_ndvi_phenology",
    "retrieve_analog_seasons",
]
