"""
CodeMates — Project Health ML Service (FastAPI)

Standalone microservice. Loads the trained Random Forest ONCE at startup,
serves predictions over HTTP. Spring Boot never talks to this synchronously
on a user-facing request -- see health_sync scheduled job on the Java side.

Run:
    uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2

Endpoints:
    GET  /health                 -> liveness check (is the SERVICE up)
    POST /predict/batch          -> the one Spring Boot actually calls
    POST /predict                -> single-repo convenience endpoint (debugging/testing)
"""
import json
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

MODELS_DIR = Path(__file__).parent / "models"

RAW_NUMERIC_TO_LOG = ["stars", "forks", "open_issues", "contributors", "size_kb"]
KEEP_LICENSES = [
    "MIT License", "Apache License 2.0", "Unlicensed",
    "GNU General Public License v3.0",
]

# ---- loaded once, at import time (module-level = shared across all requests) ----
_MODEL = joblib.load(MODELS_DIR / "best_model.joblib")
with open(MODELS_DIR / "feature_columns.json") as f:
    _FEATURE_COLUMNS = json.load(f)

app = FastAPI(title="CodeMates Project Health ML Service")


# ---------- request / response schemas ----------

class RepoFeatures(BaseModel):
    project_id: str  # pass-through so Spring Boot can match responses back to projects
    stars: int
    forks: int
    open_issues: int
    contributors: int
    size_kb: float
    project_age_days: int
    language: str
    license: Optional[str] = None


class BatchPredictRequest(BaseModel):
    repos: list[RepoFeatures]


class PredictionResult(BaseModel):
    project_id: str
    abandon_probability: float = Field(..., ge=0.0, le=1.0)
    is_abandoned_pred: int
    health_status: str  # GREEN / YELLOW / RED


class BatchPredictResponse(BaseModel):
    results: list[PredictionResult]


# ---------- preprocessing (mirrors training feature engineering exactly) ----------

def _preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["license"] = df["license"].fillna("Unlicensed")
    df["license_grouped"] = df["license"].apply(
        lambda x: x if x in KEEP_LICENSES else "Other"
    )
    for c in RAW_NUMERIC_TO_LOG:
        df[f"{c}_log"] = np.log1p(df[c])

    numeric_final = [f"{c}_log" for c in RAW_NUMERIC_TO_LOG] + ["project_age_days"]
    encoded = pd.get_dummies(
        df[numeric_final + ["language", "license_grouped"]],
        columns=["language", "license_grouped"],
        drop_first=True,
    )
    return encoded.reindex(columns=_FEATURE_COLUMNS, fill_value=0)


def _health_status(probability: float) -> str:
    if probability < 0.35:
        return "GREEN"
    elif probability <= 0.65:
        return "YELLOW"
    return "RED"


# ---------- endpoints ----------

@app.get("/health")
def service_health():
    """Liveness/readiness check for this service itself (not project health)."""
    return {"status": "up", "model_loaded": _MODEL is not None}


@app.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(request: BatchPredictRequest):
    if not request.repos:
        return BatchPredictResponse(results=[])

    raw_df = pd.DataFrame([r.model_dump() for r in request.repos])
    project_ids = raw_df["project_id"].tolist()

    X = _preprocess(raw_df.drop(columns=["project_id"]))
    probabilities = _MODEL.predict_proba(X)[:, 1]
    predictions = _MODEL.predict(X)

    results = [
        PredictionResult(
            project_id=pid,
            abandon_probability=float(prob),
            is_abandoned_pred=int(pred),
            health_status=_health_status(float(prob)),
        )
        for pid, prob, pred in zip(project_ids, probabilities, predictions)
    ]
    return BatchPredictResponse(results=results)


@app.post("/predict", response_model=PredictionResult)
def predict_single(repo: RepoFeatures):
    batch_result = predict_batch(BatchPredictRequest(repos=[repo]))
    return batch_result.results[0]
