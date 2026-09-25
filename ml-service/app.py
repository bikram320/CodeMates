"""
CodeMates — ML Service (FastAPI)

Single service hosting both trained models, each loaded once at startup:
  - Model 2: Project Health Prediction  (models/health/)
  - Model 1: Developer Matching          (models/matching/)

Run:
    uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2

Endpoints:
    GET  /health                     -> liveness check (is the SERVICE up)
    POST /predict/health/batch       -> project health predictions (project-service calls this)
    POST /predict/health             -> single-repo, for manual testing
    POST /predict/match/batch        -> developer match predictions (discovery-service calls this)
    POST /predict/match              -> single-pair, for manual testing
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

MODELS_DIR = Path(__file__).parent / "models"

app = FastAPI(title="CodeMates ML Service")


# ======================================================================
# MODEL 2 — PROJECT HEALTH PREDICTION
# ======================================================================

HEALTH_MODELS_DIR = MODELS_DIR / "health"
_HEALTH_MODEL = joblib.load(HEALTH_MODELS_DIR / "best_model.joblib")
with open(HEALTH_MODELS_DIR / "feature_columns.json") as f:
    _HEALTH_FEATURE_COLUMNS = json.load(f)

RAW_NUMERIC_TO_LOG = ["stars", "forks", "open_issues", "contributors", "size_kb"]
KEEP_LICENSES = [
    "MIT License", "Apache License 2.0", "Unlicensed",
    "GNU General Public License v3.0",
]


class RepoFeatures(BaseModel):
    project_id: str
    stars: int
    forks: int
    open_issues: int
    contributors: int
    size_kb: float
    project_age_days: int
    language: str
    license: Optional[str] = None


class HealthBatchPredictRequest(BaseModel):
    repos: list[RepoFeatures]


class HealthPredictionResult(BaseModel):
    project_id: str
    abandon_probability: float = Field(..., ge=0.0, le=1.0)
    is_abandoned_pred: int
    health_status: str  # GREEN / YELLOW / RED


class HealthBatchPredictResponse(BaseModel):
    results: list[HealthPredictionResult]


def _preprocess_health(df: pd.DataFrame) -> pd.DataFrame:
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
    return encoded.reindex(columns=_HEALTH_FEATURE_COLUMNS, fill_value=0)


def _health_status(probability: float) -> str:
    if probability < 0.35:
        return "GREEN"
    elif probability <= 0.65:
        return "YELLOW"
    return "RED"


@app.post("/predict/health/batch", response_model=HealthBatchPredictResponse)
def predict_health_batch(request: HealthBatchPredictRequest):
    if not request.repos:
        return HealthBatchPredictResponse(results=[])

    raw_df = pd.DataFrame([r.model_dump() for r in request.repos])
    project_ids = raw_df["project_id"].tolist()

    X = _preprocess_health(raw_df.drop(columns=["project_id"]))
    probabilities = _HEALTH_MODEL.predict_proba(X)[:, 1]
    predictions = _HEALTH_MODEL.predict(X)

    results = [
        HealthPredictionResult(
            project_id=pid,
            abandon_probability=float(prob),
            is_abandoned_pred=int(pred),
            health_status=_health_status(float(prob)),
        )
        for pid, prob, pred in zip(project_ids, probabilities, predictions)
    ]
    return HealthBatchPredictResponse(results=results)


@app.post("/predict/health", response_model=HealthPredictionResult)
def predict_health_single(repo: RepoFeatures):
    batch_result = predict_health_batch(HealthBatchPredictRequest(repos=[repo]))
    return batch_result.results[0]


# ======================================================================
# MODEL 1 — DEVELOPER MATCHING
# ======================================================================

MATCHING_MODELS_DIR = MODELS_DIR / "matching"
_MATCH_MODEL = joblib.load(MATCHING_MODELS_DIR / "best_model.joblib")
with open(MATCHING_MODELS_DIR / "feature_columns.json") as f:
    _MATCH_FEATURE_COLUMNS = json.load(f)

MATCH_NUMERIC_LOG_COLS = ["public_repos", "public_gists", "followers", "following"]


class DeveloperSkillProfile(BaseModel):
    user_id: str  # passthrough, matched back on response
    languages: list[str] = []       # every language used across their repos
    topics: list[str] = []          # every topic/tag across their repos
    primary_language: Optional[str] = None  # their single most-used language
    public_repos: int
    public_gists: int
    followers: int
    following: int
    account_age_days: int  # precompute this on the Java side from GitHub account created_at


class MatchPairRequest(BaseModel):
    user_id: str          # the developer requesting matches (matches MatchScore.userId)
    candidate_id: str     # the developer being scored against them (matches MatchScore.matchedUserId)
    dev_a: DeveloperSkillProfile
    dev_b: DeveloperSkillProfile


class MatchBatchPredictRequest(BaseModel):
    pairs: list[MatchPairRequest]


class MatchPredictionResult(BaseModel):
    user_id: str
    candidate_id: str
    match_probability: float = Field(..., ge=0.0, le=1.0)
    predicted_match: int


class MatchBatchPredictResponse(BaseModel):
    results: list[MatchPredictionResult]


def _jaccard(set_a: set, set_b: set) -> float:
    if not set_a or not set_b:
        return 0.0
    union = set_a | set_b
    return len(set_a & set_b) / len(union) if union else 0.0


def _build_match_features(dev_a: DeveloperSkillProfile, dev_b: DeveloperSkillProfile) -> dict:
    lang_a, lang_b = set(dev_a.languages), set(dev_b.languages)
    topics_a, topics_b = set(dev_a.topics), set(dev_b.topics)

    row = {
        "language_jaccard": _jaccard(lang_a, lang_b),
        "topic_jaccard": _jaccard(topics_a, topics_b),
        "primary_language_match": int(
            dev_a.primary_language is not None and dev_a.primary_language == dev_b.primary_language
        ),
    }

    va, vb = dev_a.account_age_days, dev_b.account_age_days
    row["account_age_days_absdiff"] = abs(va - vb)
    row["account_age_days_sum"] = va + vb
    row["account_age_days_min"] = min(va, vb)

    for col in MATCH_NUMERIC_LOG_COLS:
        va, vb = getattr(dev_a, col), getattr(dev_b, col)
        row[f"{col}_absdiff_log"] = np.log1p(abs(va - vb))
        row[f"{col}_sum_log"] = np.log1p(va + vb)
        row[f"{col}_min_log"] = np.log1p(min(va, vb))
    return row


@app.post("/predict/match/batch", response_model=MatchBatchPredictResponse)
def predict_match_batch(request: MatchBatchPredictRequest):
    if not request.pairs:
        return MatchBatchPredictResponse(results=[])

    rows = [_build_match_features(p.dev_a, p.dev_b) for p in request.pairs]
    X = pd.DataFrame(rows).reindex(columns=_MATCH_FEATURE_COLUMNS, fill_value=0)

    probabilities = _MATCH_MODEL.predict_proba(X)[:, 1]
    predictions = _MATCH_MODEL.predict(X)

    results = [
        MatchPredictionResult(
            user_id=p.user_id,
            candidate_id=p.candidate_id,
            match_probability=float(prob),
            predicted_match=int(pred),
        )
        for p, prob, pred in zip(request.pairs, probabilities, predictions)
    ]
    return MatchBatchPredictResponse(results=results)


@app.post("/predict/match", response_model=MatchPredictionResult)
def predict_match_single(pair: MatchPairRequest):
    batch_result = predict_match_batch(MatchBatchPredictRequest(pairs=[pair]))
    return batch_result.results[0]


# ======================================================================
# SERVICE-LEVEL HEALTH CHECK
# ======================================================================

@app.get("/health")
def service_health():
    """Liveness/readiness check for this service itself (not project health)."""
    return {
        "status": "up",
        "health_model_loaded": _HEALTH_MODEL is not None,
        "match_model_loaded": _MATCH_MODEL is not None,
    }