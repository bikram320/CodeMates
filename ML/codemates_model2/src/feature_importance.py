"""
Model 2 — Project Health Prediction
Feature importance: shows which features the trained model actually relies on.
Useful for the project report -- confirms (or contradicts) the EDA findings.

Usage:
    python src/feature_importance.py

Reads:  models/best_model.joblib, models/feature_columns.json
Writes: models/feature_importance.json
"""
import json
import joblib
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"


def main():
    model = joblib.load(MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json") as f:
        feature_columns = json.load(f)

    if not hasattr(model, "feature_importances_"):
        print(f"{type(model).__name__} has no feature_importances_ "
              f"(that's a tree-ensemble-only attribute -- e.g. Logistic "
              f"Regression uses .coef_ instead). Skipping.")
        return

    importances = pd.Series(model.feature_importances_, index=feature_columns)
    importances = importances.sort_values(ascending=False)

    print("=== FEATURE IMPORTANCE (Random Forest) ===")
    print(importances.to_string())

    with open(MODELS_DIR / "feature_importance.json", "w") as f:
        json.dump(importances.to_dict(), f, indent=2)
    print(f"\nSaved: {MODELS_DIR / 'feature_importance.json'}")


if __name__ == "__main__":
    main()
