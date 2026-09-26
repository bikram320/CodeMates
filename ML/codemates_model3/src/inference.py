"""
Model 3 -- Contribution Significance Prediction
Predicts whether a developer is likely to become a significant (top-tier)
contributor to a given repo/project, based on their profile + skill match
with the project -- NOT based on how much they've already contributed
(that would be circular).

Usage:
    from inference import predict_significance
    result = predict_significance(dev, repo)

dev shape:
    {"public_repos": 45, "public_gists": 3, "followers": 200, "following": 50,
     "account_age_days": 3200, "primary_language": "Python"}
repo shape:
    {"stars": 5000, "forks": 800, "subscribers": 200, "topic_count": 6, "language": "Python"}
"""
import json
import joblib
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"

_MODEL = None
_FEATURE_COLUMNS = None

LOG_DEV_COLS = ["public_repos", "public_gists", "followers", "following"]
LOG_REPO_COLS = {"stars": "stargazers_count", "forks": "forks_count", "subscribers": "subscribers_count"}


def _load_artifacts():
    global _MODEL, _FEATURE_COLUMNS
    if _MODEL is None:
        _MODEL = joblib.load(MODELS_DIR / "best_model.joblib")
        with open(MODELS_DIR / "feature_columns.json") as f:
            _FEATURE_COLUMNS = json.load(f)
    return _MODEL, _FEATURE_COLUMNS


def build_features(dev: dict, repo: dict) -> dict:
    row = {}
    for col in LOG_DEV_COLS:
        row[f"{col}_log"] = np.log1p(dev[col])
    for repo_key, out_col in LOG_REPO_COLS.items():
        row[f"{out_col}_log"] = np.log1p(repo[repo_key])
    row["account_age_days"] = dev["account_age_days"]
    row["topic_count"] = repo["topic_count"]
    row["primary_lang_match"] = int(dev.get("primary_language") == repo.get("language"))
    return row


def predict_significance(dev: dict, repo: dict) -> dict:
    model, feature_columns = _load_artifacts()
    import pandas as pd
    X = pd.DataFrame([build_features(dev, repo)]).reindex(columns=feature_columns, fill_value=0)
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0, 1]
    return {"predicted_significant": int(pred), "significance_probability": float(proba)}


if __name__ == "__main__":
    strong_dev = {"public_repos": 80, "public_gists": 10, "followers": 500, "following": 100,
                  "account_age_days": 3500, "primary_language": "Python"}
    weak_dev = {"public_repos": 3, "public_gists": 0, "followers": 2, "following": 50,
                "account_age_days": 400, "primary_language": "PHP"}
    repo = {"stars": 8000, "forks": 1200, "subscribers": 300, "topic_count": 5, "language": "Python"}

    print("Experienced, language-matched dev:", predict_significance(strong_dev, repo))
    print("New account, language-mismatched dev:", predict_significance(weak_dev, repo))
