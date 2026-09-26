"""
Model 3 -- Contribution Significance Prediction
Trains LogReg, Random Forest, Gradient Boosting; picks best by F1.
Usage: python src/train.py
"""
import json, joblib
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"; MODELS_DIR = ROOT / "models"; MODELS_DIR.mkdir(exist_ok=True)
TARGET = "is_significant"

def load_split(name):
    df = pd.read_csv(DATA_DIR / f"{name}.csv")
    return df.drop(columns=[TARGET]), df[TARGET]

def evaluate(model, X, y):
    y_pred = model.predict(X); y_proba = model.predict_proba(X)[:, 1]
    return {"accuracy": accuracy_score(y, y_pred), "precision": precision_score(y, y_pred),
            "recall": recall_score(y, y_pred), "f1": f1_score(y, y_pred), "roc_auc": roc_auc_score(y, y_proba)}

def main():
    X_train, y_train = load_split("train")
    X_val, y_val = load_split("val")
    feature_columns = list(X_train.columns)

    # class_weight="balanced" -- is_significant is 36/64, a real (not constructed) imbalance
    candidates = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "random_forest": RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_leaf=5, class_weight="balanced", random_state=42, n_jobs=-1),
        "gradient_boosting": GradientBoostingClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, random_state=42),
    }
    results, fitted = {}, {}
    for name, model in candidates.items():
        print(f"Training {name} ...")








        model.fit(X_train, y_train)
        metrics = evaluate(model, X_val, y_val)
        results[name] = metrics; fitted[name] = model
        print(f"  val F1={metrics['f1']:.4f} recall={metrics['recall']:.4f} precision={metrics['precision']:.4f} roc_auc={metrics['roc_auc']:.4f}")

    best_name = max(results, key=lambda n: results[n]["f1"])
    print(f"\nBest model: {best_name}")
    joblib.dump(fitted[best_name], MODELS_DIR / "best_model.joblib")
    with open(MODELS_DIR / "feature_columns.json", "w") as f: json.dump(feature_columns, f, indent=2)
    with open(MODELS_DIR / "val_metrics.json", "w") as f: json.dump({"best_model": best_name, "candidates": results}, f, indent=2)
    print(f"Saved to {MODELS_DIR}")

if __name__ == "__main__":
    main()
