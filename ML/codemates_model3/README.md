# CodeMates — Model 3: Contribution Significance Prediction

Binary classifier predicting whether a developer is likely to become a
**significant (top-tier) contributor** to a given project, based on their
profile and skill match with the project — NOT based on how much they've
already contributed (that would be circular). Feeds CodeMates' planned
Contribution Score / member-ranking feature.

## Reframing note
The original brief described this as classifying individual commits as
"meaningful vs trivial." That approach was investigated and rejected (see
Model3_Report.md Section 2) — the only large public dataset for that task
generates its own labels via keyword-matching on commit messages, which is
circular. This model instead predicts **contributor significance within a
project**, reusing Model 1's already-cleaned data (no new download needed).

## Folder structure
```
codemates_model3/
├── data/            train.csv, val.csv, test.csv (55,847 rows total, 36/64 split)
├── src/
│   ├── train.py               trains 3 candidates, saves best (by F1)
│   ├── evaluate.py             final test-set scoring
│   ├── feature_importance.py   what's driving predictions
│   └── inference.py            raw dev+repo -> significance prediction
├── models/          best_model.joblib, feature_columns.json, metrics
└── requirements.txt
```

## The label
`is_significant = 1` if a contributor's real GitHub `Contributions` count
places them in the **top 25th percentile within that specific repo**
(computed only among repos with ≥2 contributors, to avoid the trivial
100th-percentile case for single-contributor repos). This is a real,
objective, GitHub-derived fact — not researcher-invented.

## Features (deliberately exclude contribution count itself)
| Feature | Why |
|---|---|
| `{public_repos,public_gists,followers,following}_log` | Contributor's general GitHub profile/experience |
| `account_age_days` | Contributor tenure |
| `{stargazers,forks,subscribers}_count_log` | Repo popularity/scale |
| `topic_count` | Repo's topic tag richness |
| `primary_lang_match` | Does the repo's language match the contributor's own primary/most-used language |

## Results — honestly weaker than Models 1 & 2
| Metric | Test |
|---|---|
| Accuracy | 0.648 |
| Precision | 0.510 |
| Recall | 0.657 |
| F1 | 0.574 |
| ROC-AUC | 0.696 |

This is a harder, more diffuse prediction problem than either prior model
— predicting "will this specific person become a top contributor to this
specific repo" from general profile signals alone has a real ceiling. See
Model3_Report.md for full discussion.

## Run order
```bash
pip install -r requirements.txt
python src/train.py
python src/feature_importance.py
python src/evaluate.py
python src/inference.py
```
