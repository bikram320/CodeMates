# CodeMates — Model 2: Project Health Prediction
### Technical Report

---

## 1. Overview

**Model name:** Project Health Classifier (Random Forest)
**Task:** Binary classification — predicts whether a GitHub repository is `Active` or `Abandoned`, based on real, non-circular repository metadata (no use of last-push-date or any feature that trivially defines the label).
**Part of:** CodeMates — developer collaboration platform (ML feature 2 of 3: Developer Matching, **Project Health Prediction**, Contribution Intelligence).

---

## 2. Dataset

| Item | Value |
|---|---|
| Source | "GitHub Code Graveyard" dataset (Kaggle) — real, scraped GitHub repositories |
| Raw size | 46,201 rows |
| After cleaning | 42,730 rows (removed 3,470 "Archived" repos — archiving is often intentional, not a decay signal, so it doesn't belong in a binary Active/Abandoned label) |
| Class balance | 68.6% Active / 31.4% Abandoned |
| Label leakage found & removed | `days_since_last_push` deterministically defines the label (Abandoned = >731 days since last push) — excluded from training features entirely, kept only to verify the label was assigned correctly |

### Train / Validation / Test split

Stratified split, preserving the 69/31 class ratio in every subset:

| Split | Rows | % of data | Abandonment rate |
|---|---|---|---|
| Train | 29,911 | 70% | 31.43% |
| Validation | 6,409 | 15% | 31.42% |
| Test | 6,410 | 15% | 31.42% |

---

## 3. Feature Engineering

| Raw feature | Transformation applied | Why |
|---|---|---|
| `stars`, `forks`, `open_issues`, `contributors`, `size_kb` | `log1p(x)` | All five were heavily right-skewed (skew 4–81); log-transform prevents a handful of extreme repos from dominating the model |
| `project_age_days` | none | Already near-symmetric (skew ≈ 0.07) |
| `language` | One-hot encoded (7 categories, `C++` dropped as baseline) | Abandonment rate varied 2x across languages (21.5% Rust → 45.2% Java) — a real, usable signal |
| `license` | Missing values filled as `"Unlicensed"`, rare licenses (<~1000 rows) grouped into `"Other"`, then one-hot encoded (`MIT` dropped as baseline) | Missing license was found to be **strongly predictive** (56.6% abandonment rate vs. 31.4% baseline) — encoding it as its own category rather than dropping/imputing preserves that signal |
| `open_issues / contributors` ratio | **Tested, rejected** | Weaker signal (Spearman r = +0.115) than `contributors` alone (−0.466); added noise rather than information |

**Final feature matrix:** 42,730 rows × 16 features (6 numeric + 6 language dummies + 4 license dummies).

---

## 4. Model Selection

Three candidate models were trained on identical data and compared on the same validation set, using **F1-score on the Abandoned class** (not accuracy) as the selection metric — the majority-class baseline already achieves 68.6% accuracy while catching zero abandoned repos, so accuracy alone cannot distinguish a useful model from a useless one.

| Model | Val F1 (Abandoned) | Val Recall | Val Precision | Val ROC-AUC |
|---|---|---|---|---|
| Logistic Regression (`class_weight=balanced`) | 0.670 | 0.794 | 0.579 | 0.841 |
| **Random Forest (`class_weight=balanced`)** ✅ | **0.675** | 0.786 | 0.591 | **0.850** |
| Gradient Boosting | 0.644 | 0.599 | 0.698 | 0.849 |

### Why Random Forest was chosen
- Best F1 and ROC-AUC of the three, with strong recall — for a health-*warning* system, missing a genuinely abandoned project (false negative) is a worse outcome than flagging a healthy one for review (false positive), so recall was weighted as the more important error to minimize.
- Tree-based, so it is unaffected by the remaining feature skew/scale and can capture non-linear interactions (e.g. "old age *combined with* low contributors") that Logistic Regression cannot express.
- Produces feature importances natively, enabling model interpretability (Section 6).

**Hyperparameters:** `n_estimators=300, max_depth=12, min_samples_leaf=5, class_weight="balanced", random_state=42`

---

## 5. Final Test Set Results

Evaluated **once**, after model selection was finalized on validation data — this is the unbiased, reportable performance estimate.

| Metric | Value |
|---|---|
| Accuracy | 75.3% |
| Precision (Abandoned) | 0.579 |
| Recall (Abandoned) | 0.786 |
| F1 (Abandoned) | 0.667 |
| ROC-AUC | 0.847 |

**Confusion matrix:**

|  | Predicted Active | Predicted Abandoned |
|---|---|---|
| **Actual Active** | 3,245 (TN) | 1,151 (FP) |
| **Actual Abandoned** | 431 (FN) | 1,583 (TP) |

**Validation vs. Test comparison** (confirms the model generalizes — no overfitting to the validation set during model selection):

| Metric | Validation | Test | Difference |
|---|---|---|---|
| F1 (Abandoned) | 0.675 | 0.667 | −0.008 |
| Recall | 0.786 | 0.786 | 0.000 |
| Precision | 0.591 | 0.579 | −0.012 |
| ROC-AUC | 0.850 | 0.847 | −0.003 |

**Baseline comparison** (majority-class predictor, always predicts "Active"): 68.6% accuracy, 0.0 precision/recall/F1 on the Abandoned class. The trained model represents a genuine +6.7 point accuracy gain *and*, more importantly, actually detects the minority class the baseline entirely fails to catch.

---

## 6. Feature Importance

| Rank | Feature | Importance |
|---|---|---|
| 1 | `contributors_log` | 0.439 |
| 2 | `project_age_days` | 0.162 |
| 3 | `open_issues_log` | 0.092 |
| 4 | `size_kb_log` | 0.071 |
| 5 | `stars_log` | 0.066 |
| 6 | `forks_log` | 0.059 |
| 7 | `license_grouped_Unlicensed` | 0.057 |
| 8–16 | individual `language`/`license` categories | 0.001 – 0.013 each |

**Interpretation:** Contributor count alone accounts for nearly half the model's decision-making — a repo's team size is a far stronger abandonment signal than its popularity (`stars`, `forks` rank near the bottom). `project_age_days` ranks higher in the trained model (0.162) than its standalone correlation would suggest, indicating the model is capturing a non-linear interaction (e.g. "old *and* low-contributor" being disproportionately risky) that simple univariate analysis can't see on its own. The missing-license signal found in EDA is confirmed as genuinely used by the model, not a spurious correlation.

---

## 7. From Prediction to Health Status (Green / Yellow / Red)

The model outputs a continuous **abandonment probability** (`predict_proba`), not just a binary label. This is bucketed into three tiers for the CodeMates UI:

| Status | Probability range | Meaning |
|---|---|---|
| 🟢 Green | `< 0.35` | Healthy — low abandonment risk |
| 🟡 Yellow | `0.35 – 0.65` | At risk — worth a human review |
| 🔴 Red | `> 0.65` | Likely abandoned or declining |

*Note: these thresholds are centered on the model's natural 0.5 decision boundary with a buffer zone on each side, chosen based on model calibration rather than a separately validated risk scale — a reasonable starting point for v1, refinable with user feedback once deployed.*

---

## 8. Pipeline / File Structure

```
codemates_model2/
├── data/                    train.csv, val.csv, test.csv
├── src/
│   ├── train.py              trains & compares 3 models, saves the best one
│   ├── evaluate.py           one-time final scoring on test.csv
│   ├── feature_importance.py extracts which features the model relies on
│   └── inference.py          raw repo data -> prediction (for the API layer)
├── models/
│   ├── best_model.joblib
│   ├── feature_columns.json
│   ├── val_metrics.json
│   ├── test_metrics.json
│   └── feature_importance.json
└── requirements.txt
```

**Artifacts produced:** trained model (`.joblib`), exact feature schema (`.json`), and full metric logs — sufficient to reproduce, audit, or redeploy the model without retraining.

---

## 9. Known Limitations

- **Scope:** trained only on established repositories (dataset minimum: 101 stars, ~2.7 years old) — not validated for brand-new or very small projects.
- **Precision (0.58):** roughly 4 in 10 "Abandoned" predictions are false positives — suitable for a review-triggering warning signal, not for fully automated, irreversible actions.
- **"Worked on same repo" style proxy labels were not used here** (that limitation applies to Model 1, not this one) — Model 2's label is directly derived from real push-recency data, a stronger ground truth.
- Yellow/Green/Red thresholds are a design choice, not independently validated against a separate risk-labeled dataset.

---

## 10. Status

✅ Model 2 pipeline complete: data cleaning → EDA → feature engineering → stratified split → baseline → model comparison → final evaluation → feature importance → inference validated on example inputs.

**Next:** wrap `inference.py` in a lightweight API (FastAPI/Flask) for Spring Boot integration, pending confirmation of remaining pre-integration steps.
