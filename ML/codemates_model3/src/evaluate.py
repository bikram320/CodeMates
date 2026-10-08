"""Model 3 -- final, one-time test-set evaluation. Usage: python src/evaluate.py"""
import json, joblib
import pandas as pd
from pathlib import Path
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"; MODELS_DIR = ROOT / "models"; TARGET = "is_significant"

def main():
    model = joblib.load(MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json") as f: feature_columns = json.load(f)
    df = pd.read_csv(DATA_DIR / "test.csv")
    X_test = df[feature_columns]; y_test = df[TARGET]
    y_pred = model.predict(X_test); y_proba = model.predict_proba(X_test)[:, 1]
    metrics = {"accuracy": accuracy_score(y_test, y_pred), "precision": precision_score(y_test, y_pred),
               "recall": recall_score(y_test, y_pred), "f1": f1_score(y_test, y_pred),
               "roc_auc": roc_auc_score(y_test, y_proba), "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()}
    print("=== FINAL TEST SET RESULTS ===")
    for k, v in metrics.items(): print(f"{k}: {v}")
    print("\n" + classification_report(y_test, y_pred, target_names=["Minor Contributor", "Significant Contributor"]))
    with open(MODELS_DIR / "test_metrics.json", "w") as f: json.dump(metrics, f, indent=2)
    print(f"Saved: {MODELS_DIR / 'test_metrics.json'}")

if __name__ == "__main__":
    main()
