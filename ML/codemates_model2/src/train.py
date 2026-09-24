"""
Model 2 — Project Health Prediction
Step 7: Train candidate models, compare on validation set, save the best one.

Usage:
    python src/train.py

Reads:  data/train.csv, data/val.csv
Writes: models/best_model.joblib
        models/feature_columns.json   (exact column order the model expects)
        models/val_metrics.json       (comparison metrics for all candidates)
"""
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

TARGET = "is_abandoned"


def load_split(name: str):
    df = pd.read_csv(DATA_DIR / f"{name}.csv")
    X = df.drop(columns=[TARGET])
    y = df[TARGET]
    return X, y


def evaluate(model, X_val, y_val) -> dict:
    y_pred = model.predict(X_val)
    y_proba = model.predict_proba(X_val)[:, 1]
    return {
        "accuracy": accuracy_score(y_val, y_pred),
        "precision_abandoned": precision_score(y_val, y_pred, zero_division=0),
        "recall_abandoned": recall_score(y_val, y_pred, zero_division=0),
        "f1_abandoned": f1_score(y_val, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_val, y_proba),
        "confusion_matrix": confusion_matrix(y_val, y_pred).tolist(),  # [[TN, FP], [FN, TP]]
    }


def main():
    X_train, y_train = load_split("train")
    X_val, y_val = load_split("val")

    # feature order the model was trained on -- inference must reproduce this exactly
    feature_columns = list(X_train.columns)

    # class_weight='balanced' matters here: our classes are 69/31, not extreme
    # but still worth correcting so the model doesn't lean toward predicting
    # "Active" just because it's more common.
    candidates = {
        "logistic_regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=42
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=12, min_samples_leaf=5,
            class_weight="balanced", random_state=42, n_jobs=-1
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=300, max_depth=3, learning_rate=0.05, random_state=42
        ),
    }

    results = {}
    fitted = {}
    for name, model in candidates.items():
        print(f"Training {name} ...")
        model.fit(X_train, y_train)
        metrics = evaluate(model, X_val, y_val)
        results[name] = metrics
        fitted[name] = model
        print(f"  val F1(Abandoned)={metrics['f1_abandoned']:.4f} "
              f"recall={metrics['recall_abandoned']:.4f} "
              f"precision={metrics['precision_abandoned']:.4f} "
              f"roc_auc={metrics['roc_auc']:.4f}")

    # Pick the winner by F1 on the Abandoned class -- the class we actually
    # care about catching, not overall accuracy (see baseline step: accuracy
    # is misleading on this dataset).
    best_name = max(results, key=lambda n: results[n]["f1_abandoned"])
    best_model = fitted[best_name]
    print(f"\nBest model: {best_name}")

    joblib.dump(best_model, MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json", "w") as f:
        json.dump(feature_columns, f, indent=2)
    with open(MODELS_DIR / "val_metrics.json", "w") as f:
        json.dump({"best_model": best_name, "candidates": results}, f, indent=2)

    print(f"\nSaved: {MODELS_DIR / 'best_model.joblib'}")
    print(f"Saved: {MODELS_DIR / 'feature_columns.json'}")
    print(f"Saved: {MODELS_DIR / 'val_metrics.json'}")


if __name__ == "__main__":
    main()
