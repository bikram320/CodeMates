"""
Model 2 — Project Health Prediction
Step 8: Final evaluation on the held-out test set.

Run this ONCE, after training and after you're done tuning. This is the
number that goes in your report -- don't go back and retune based on it.

Usage:
    python src/evaluate.py

Reads:  data/test.csv, models/best_model.joblib
Writes: models/test_metrics.json
"""
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"
TARGET = "is_abandoned"


def main():
    model = joblib.load(MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json") as f:
        feature_columns = json.load(f)

    df = pd.read_csv(DATA_DIR / "test.csv")
    X_test = df[feature_columns]  # enforce exact training column order
    y_test = df[TARGET]

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision_abandoned": precision_score(y_test, y_pred, zero_division=0),
        "recall_abandoned": recall_score(y_test, y_pred, zero_division=0),
        "f1_abandoned": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }

    print("=== FINAL TEST SET RESULTS ===")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    print("\n" + classification_report(y_test, y_pred, target_names=["Active", "Abandoned"]))

    with open(MODELS_DIR / "test_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved: {MODELS_DIR / 'test_metrics.json'}")


if __name__ == "__main__":
    main()
