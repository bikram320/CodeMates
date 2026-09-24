"""
Model 2 — Project Health Prediction
Inference: turn RAW repo data (same shape as the original scraped columns)
into a prediction, using the exact same preprocessing as training.

This mirrors the feature engineering from Step 4 -- if you change that step,
update this file to match, or predictions will be silently wrong.

Usage as a script (example):
    python src/inference.py

Usage as a module (what the Spring Boot integration will call via an API
wrapper, e.g. FastAPI/Flask):
    from inference import predict_health
    result = predict_health(raw_df)
"""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"

_MODEL = None
_FEATURE_COLUMNS = None

RAW_NUMERIC_TO_LOG = ["stars", "forks", "open_issues", "contributors", "size_kb"]
KEEP_LICENSES = [
    "MIT License", "Apache License 2.0", "Unlicensed",
    "GNU General Public License v3.0",
]


def _load_artifacts():
    global _MODEL, _FEATURE_COLUMNS
    if _MODEL is None:
        _MODEL = joblib.load(MODELS_DIR / "best_model.joblib")
        with open(MODELS_DIR / "feature_columns.json") as f:
            _FEATURE_COLUMNS = json.load(f)
    return _MODEL, _FEATURE_COLUMNS


def preprocess_raw(raw_df: pd.DataFrame, feature_columns: list) -> pd.DataFrame:
    """
    raw_df must contain these raw columns (same names as the original
    GitHub Code Graveyard export):
        stars, forks, open_issues, contributors, size_kb,
        project_age_days, language, license
    (license may be missing/NaN -- that's expected and handled below)
    """
    df = raw_df.copy()

    # license: fill missing, bucket rare categories -- must match Step 4 exactly
    df["license"] = df["license"].fillna("Unlicensed")
    df["license_grouped"] = df["license"].apply(
        lambda x: x if x in KEEP_LICENSES else "Other"
    )

    # log-transform skewed numerics -- must match Step 4 exactly
    for c in RAW_NUMERIC_TO_LOG:
        df[f"{c}_log"] = np.log1p(df[c])

    numeric_final = [f"{c}_log" for c in RAW_NUMERIC_TO_LOG] + ["project_age_days"]
    encoded = pd.get_dummies(
        df[numeric_final + ["language", "license_grouped"]],
        columns=["language", "license_grouped"],
        drop_first=True,
    )

    # Align to the exact columns/order the model was trained on.
    # Any category not seen for this row (e.g. a language with no rows in
    # this batch) gets a 0 column added automatically here.
    encoded = encoded.reindex(columns=feature_columns, fill_value=0)
    return encoded


def predict_health(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns a DataFrame with columns: is_abandoned_pred, abandon_probability
    aligned to the input row order.
    """
    model, feature_columns = _load_artifacts()
    X = preprocess_raw(raw_df, feature_columns)
    preds = model.predict(X)
    probs = model.predict_proba(X)[:, 1]
    return pd.DataFrame({
        "is_abandoned_pred": preds,
        "abandon_probability": probs,
    })


if __name__ == "__main__":
    # Example: one Active-looking repo, one Abandoned-looking repo
    example = pd.DataFrame([
        {
            "stars": 5000, "forks": 800, "open_issues": 40, "contributors": 30,
            "size_kb": 12000, "project_age_days": 1500,
            "language": "Python", "license": "MIT License",
        },
        {
            "stars": 120, "forks": 10, "open_issues": 1, "contributors": 1,
            "size_kb": 300, "project_age_days": 2800,
            "language": "Java", "license": None,
        },
    ])
    result = predict_health(example)
    print(pd.concat([example[["stars", "language", "license"]], result], axis=1))
