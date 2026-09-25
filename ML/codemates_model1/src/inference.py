"""
Model 1 v2 — Developer Matching (skill-based)
Inference: given two developers' languages/topics (derived from their repo
contribution history) and profile stats, predict match likelihood.

Usage:
    from inference import predict_match
    result = predict_match(dev_a, dev_b)

dev_a / dev_b shape:
    {
        "languages": {"Python", "Go"},           # set of languages across their repos
        "topics": {"machine-learning", "cli"},   # set of topics across their repos
        "primary_language": "Python",             # their single most-used language
        "public_repos": 45, "public_gists": 3,
        "followers": 200, "following": 50,
        "account_age_days": 3200
    }
"""
import json
import joblib
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"

_MODEL = None
_FEATURE_COLUMNS = None

NUMERIC_LOG_COLS = ["public_repos", "public_gists", "followers", "following"]


def _load_artifacts():
    global _MODEL, _FEATURE_COLUMNS
    if _MODEL is None:
        _MODEL = joblib.load(MODELS_DIR / "best_model.joblib")
        with open(MODELS_DIR / "feature_columns.json") as f:
            _FEATURE_COLUMNS = json.load(f)
    return _MODEL, _FEATURE_COLUMNS


def _jaccard(set_a, set_b):
    if not set_a or not set_b:
        return 0.0
    union = set_a | set_b
    return len(set_a & set_b) / len(union) if union else 0.0


def build_features(dev_a: dict, dev_b: dict) -> dict:
    row = {
        "language_jaccard": _jaccard(set(dev_a.get("languages") or []), set(dev_b.get("languages") or [])),
        "topic_jaccard": _jaccard(set(dev_a.get("topics") or []), set(dev_b.get("topics") or [])),
        "primary_language_match": int(
            dev_a.get("primary_language") is not None
            and dev_a.get("primary_language") == dev_b.get("primary_language")
        ),
    }
    va = dev_a["account_age_days"]; vb = dev_b["account_age_days"]
    row["account_age_days_absdiff"] = abs(va - vb)
    row["account_age_days_sum"] = va + vb
    row["account_age_days_min"] = min(va, vb)

    for col in NUMERIC_LOG_COLS:
        va, vb = dev_a[col], dev_b[col]
        row[f"{col}_absdiff_log"] = np.log1p(abs(va - vb))
        row[f"{col}_sum_log"] = np.log1p(va + vb)
        row[f"{col}_min_log"] = np.log1p(min(va, vb))
    return row


def predict_match(dev_a: dict, dev_b: dict) -> dict:
    model, feature_columns = _load_artifacts()
    import pandas as pd
    row = build_features(dev_a, dev_b)
    X = pd.DataFrame([row]).reindex(columns=feature_columns, fill_value=0)
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0, 1]
    return {"predicted_match": int(pred), "match_probability": float(proba)}


if __name__ == "__main__":
    dev_a = {
        "languages": {"Python", "Go", "JavaScript"}, "topics": {"machine-learning", "api"},
        "primary_language": "Python", "public_repos": 45, "public_gists": 3,
        "followers": 200, "following": 50, "account_age_days": 3200,
    }
    dev_b = {
        "languages": {"Python", "Rust"}, "topics": {"machine-learning", "cli-tool"},
        "primary_language": "Python", "public_repos": 30, "public_gists": 1,
        "followers": 90, "following": 20, "account_age_days": 2100,
    }
    dev_c = {
        "languages": {"PHP", "HTML"}, "topics": {"wordpress"},
        "primary_language": "PHP", "public_repos": 10, "public_gists": 0,
        "followers": 15, "following": 100, "account_age_days": 900,
    }
    print("Same-language, overlapping-topic pair:", predict_match(dev_a, dev_b))
    print("Unrelated tech-stack pair:", predict_match(dev_a, dev_c))
