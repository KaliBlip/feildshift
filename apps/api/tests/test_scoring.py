import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from index import StressTestRequest, stress_test  # noqa: E402
from scoring import base_scores, rank_probabilities  # noqa: E402

VECTORS = pathlib.Path(__file__).resolve().parents[3] / "shared" / "test-vectors" / "scoring_basic.json"
STRESS_VECTORS = pathlib.Path(__file__).resolve().parents[3] / "shared" / "test-vectors" / "stress_test_basic.json"


def test_base_scores_match_shared_vector():
    v = json.loads(VECTORS.read_text())
    got = base_scores(np.array(v["scores"]), np.array(v["weights"]))
    assert np.allclose(got, v["expected_base_scores"], atol=1e-9)


def test_rank_probabilities_sum_to_one():
    v = json.loads(VECTORS.read_text())
    out = rank_probabilities(np.array(v["scores"]), np.array(v["weights"]), runs=500, seed=1)
    assert abs(sum(out["probability_first"]) - 1.0) < 1e-9


def test_stress_test_matches_shared_vector():
    sv = json.loads(STRESS_VECTORS.read_text())
    for scenario in sv["scenarios"].values():
        req = StressTestRequest(
            strategies=sv["strategies"],
            criteria=["Water", "Soil", "Erosion", "Income"],
            scores=sv["scores"],
            weights=sv["weights"],
            is_baseline=sv["is_baseline"],
            rain_factor=scenario["rain_factor"],
            temp_delta_c=scenario["temp_delta_c"],
            runs=200,
            seed=42,
        )
        res = stress_test(req)
        assert np.allclose(res["stressed_scores"], scenario["expected_stressed_scores"], atol=1e-4)
        assert np.allclose(res["base_scores"], scenario["expected_base_scores"], atol=1e-4)
        assert res["lowest_regret_strategy"] == sv["expected_lowest_regret_strategy"]
