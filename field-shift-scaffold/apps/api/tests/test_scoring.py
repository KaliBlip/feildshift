import json
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from scoring import base_scores, rank_probabilities  # noqa: E402

VECTORS = pathlib.Path(__file__).resolve().parents[3] / "shared" / "test-vectors" / "scoring_basic.json"


def test_base_scores_match_shared_vector():
    v = json.loads(VECTORS.read_text())
    got = base_scores(np.array(v["scores"]), np.array(v["weights"]))
    assert np.allclose(got, v["expected_base_scores"], atol=1e-9)


def test_rank_probabilities_sum_to_one():
    v = json.loads(VECTORS.read_text())
    out = rank_probabilities(np.array(v["scores"]), np.array(v["weights"]), runs=500, seed=1)
    assert abs(sum(out["probability_first"]) - 1.0) < 1e-9
