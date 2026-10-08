# CodeMates — Model 2: Project Health Prediction

Binary classifier: predicts whether a GitHub repo is `Active` (0) or `Abandoned` (1),
based on non-leaky repo metadata.

## Folder structure

```
codemates_model2/
├── data/
│   ├── train.csv      # 29,911 rows, feature-engineered, stratified 70%
│   ├── val.csv        # 6,409 rows, stratified 15% -- used during development/tuning
│   └── test.csv        # 6,410 rows, stratified 15% -- touch ONCE, at the end
├── src/
│   ├── train.py        # trains 3 candidate models, picks the best on val, saves it
│   ├── evaluate.py      # final, one-time scoring of the saved model on test.csv
│   └── inference.py     # takes raw (pre-feature-engineering) repo data -> prediction
├── models/              # created by train.py -- artifacts land here
│   ├── best_model.joblib
│   ├── feature_columns.json
│   ├── val_metrics.json
│   └── test_metrics.json   # created by evaluate.py
└── requirements.txt
```

## Setup

```bash
cd codemates_model2
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run order

```bash
python src/train.py       # Step 7 -- trains, compares, saves best model to models/
python src/evaluate.py    # Step 8 -- final untouched test-set numbers
python src/inference.py   # example: predict on 2 hand-written raw repos
```

## What train.py does

Trains three candidates on `train.csv`, scores all three on `val.csv`:
- Logistic Regression (`class_weight="balanced"`) — interpretable baseline
- Random Forest (`class_weight="balanced"`) — primary candidate
- Gradient Boosting — secondary candidate

Picks the winner by **F1 score on the Abandoned class**, not accuracy — the
majority-class baseline already gets 68.6% accuracy while catching zero
abandoned repos, so accuracy alone doesn't tell you anything useful here.

## What evaluate.py does

Loads whichever model `train.py` decided was best, scores it exactly once on
`test.csv`. This is the number for your report. Don't loop back and retune
based on this — if you do, `test.csv` stops being an honest estimate.

## What inference.py does

`preprocess_raw()` re-implements the Step 4 feature engineering (log1p
transform, license bucketing, one-hot encoding, column alignment via
`feature_columns.json`) so you can feed it **raw** repo data (not
pre-engineered) and get a prediction back. This is what the Spring Boot
integration will call through a small API wrapper (FastAPI/Flask) — see
`predict_health()`.

**If you change the feature engineering in your EDA/notebook work later,
update `preprocess_raw()` to match, or predictions will be silently
wrong** — this is the single most common bug in this kind of pipeline.

## Metric definitions (for your report)

- **Precision (Abandoned)**: of repos predicted abandoned, what fraction
  actually are. Low precision = model cries wolf too often.
- **Recall (Abandoned)**: of actually-abandoned repos, what fraction the
  model catches. Low recall = model misses real abandonment.
- **F1**: harmonic mean of the two — used to pick the "best" model since
  neither precision nor recall alone tells the full story.
- **ROC-AUC**: probability the model ranks a random abandoned repo higher
  (more likely abandoned) than a random active one, across all thresholds.
