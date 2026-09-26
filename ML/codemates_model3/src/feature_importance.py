"""Model 3 -- feature importance from the trained Random Forest. Usage: python src/feature_importance.py"""
import json, joblib
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"

def main():
    model = joblib.load(MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json") as f: feature_columns = json.load(f)
    if not hasattr(model, "feature_importances_"):
        print(f"{type(model).__name__} has no feature_importances_"); return
    importances = pd.Series(model.feature_importances_, index=feature_columns).sort_values(ascending=False)
    print("=== FEATURE IMPORTANCE ===")
    print(importances.to_string())
    with open(MODELS_DIR / "feature_importance.json", "w") as f: json.dump(importances.to_dict(), f, indent=2)
    print(f"Saved: {MODELS_DIR / 'feature_importance.json'}")

if __name__ == "__main__":
    main()
