# CodeMates — Model 1 v2: Developer Matching (Skill-Based)

Binary classifier predicting whether two developers are a good collaboration
match, based on **skill/interest overlap** derived from their GitHub repo
contribution history — languages used and repo topics, not popularity stats.

## Why v2 exists
The first version of this model used profile-stat similarity (followers,
repo counts) plus same-company/same-location as its main signals. That
measured coincidence, not compatibility, and wasn't what a developer-matching
feature should be based on. v2 replaces the feature set with real skill
signals — language and topic overlap — while keeping the same pair-
construction methodology (collaborated=1 if two devs shared a repo).

## Result: massively stronger model
| | v1 (profile stats + company/location) | v2 (skill-based) |
|---|---|---|
| Test F1 | 0.608 | **0.948** |
| Test ROC-AUC | 0.652 | **0.985** |
| Top feature | account_age_days_absdiff (weak) | language_jaccard (dominant) |

## Folder structure
```
codemates_model1_v2/
├── data/            train.csv, val.csv, test.csv (299,584 rows total, balanced 50/50)
├── src/
│   ├── train.py               trains LogReg + RF, saves the best (by F1)
│   ├── evaluate.py            final test-set scoring
│   ├── feature_importance.py  what's driving predictions
│   └── inference.py           raw dev-pair (languages/topics/stats) -> match prediction
├── models/          best_model.joblib, feature_columns.json, metrics, importances
└── requirements.txt
```

## Features
| Feature | Description |
|---|---|
| `language_jaccard` | Jaccard similarity between the two devs' sets of languages used across all their repos |
| `topic_jaccard` | Jaccard similarity between their sets of repo topics/tags |
| `primary_language_match` | Do their single most-used languages match |
| `account_age_days_*`, `*_log` (followers/following/repos/gists) | Minor secondary profile-stat signals, kept from v1 but no longer dominant |

**Dropped from v1:** `same_company`, `same_location` — these measured
workplace/geographic coincidence, not skill compatibility, and are not
appropriate signals for a project-collaboration matching feature.

## Feature importance
`language_jaccard` (53%) + `primary_language_match` (25%) + `topic_jaccard`
(15.5%) = **93.5%** of the model's decision-making — confirms this is now
genuinely a skill-match model, not a popularity/coincidence model.

## Data coverage caveats
- 95.6% of pairs have language data for both developers; 50.9% have topic
  data for both (many repos have no topics tagged on GitHub at all — this
  is normal, not a data quality issue). Pairs without topic data get
  `topic_jaccard=0`, which the model handles fine since it's a real,
  common case, not missing data to impute.

## Run order
```bash
pip install -r requirements.txt
python src/train.py
python src/feature_importance.py
python src/evaluate.py
python src/inference.py
```
