# CodeMates — Model 2: Project Health Prediction
### Refined Technical Report

---

## 1. Purpose

On the project analytics page, CodeMates shows whether a repository is **healthy or at risk of being abandoned**, as a **Green / Yellow / Red** status. Model 2 predicts the probability that a GitHub repository is abandoned, using only its metadata.

**Problem type:** Binary classification (Active / Abandoned)
**Algorithm:** Random Forest Classifier

---

## 2. Dataset

**Source:** "GitHub Code Graveyard" dataset (Kaggle) — real, scraped GitHub repositories.

| Item | Value |
|---|---|
| Raw rows | 46,201 |
| After cleaning | 42,730 |
| Removed | 3,470 "Archived" repos (archiving is usually intentional, not a sign of decay) |
| Class balance | 68.6% Active / 31.4% Abandoned |

**Label:** a repo is **Abandoned** if its last push was more than 731 days (~2 years) ago, otherwise **Active**.

**Data leakage found and fixed:** the column `days_since_last_push` is exactly what defines the label. If the model saw it, it would just re-read the answer. It was **excluded from all training features** and kept only to verify the label was assigned correctly. The model must predict abandonment from *other* properties of the repo.

**Scope:** dataset repos have at least 101 stars and are ~2.7+ years old.

---

## 3. Features (columns the model uses)

| Column | Meaning | Treatment |
|---|---|---|
| `contributors` | Number of people contributing | log transform |
| `project_age_days` | Age of the repository | none (already symmetric) |
| `open_issues` | Open issue count | log transform |
| `size_kb` | Repository size | log transform |
| `stars` | Popularity | log transform |
| `forks` | Number of forks | log transform |
| `language` | Main programming language | one-hot (7 categories, C++ baseline) |
| `license` | License type | missing → "Unlicensed", rare ones → "Other", one-hot (MIT baseline) |

**Final matrix:** 42,730 rows × 16 features.

**Why these choices:**
- **Log transform** on stars, forks, issues, contributors and size: these are extremely right-skewed (skew 4–81), so a few giant repos would dominate. Logging compresses them.
- **Language** matters: abandonment ranged from 21.5% (Rust) to 45.2% (Java).
- **Missing license is a real signal:** unlicensed repos are abandoned 56.6% of the time versus 31.4% overall, so "Unlicensed" is kept as its own category instead of being dropped.
- **Rejected feature:** `open_issues / contributors` ratio (r = +0.115) was weaker than `contributors` alone (r = −0.466) and added noise.

---

## 4. Why Random Forest?

Three models were trained on identical data and compared on the same validation set.

| Model | Val F1 (Abandoned) | Val Recall | Val Precision | Val ROC-AUC |
|---|---|---|---|---|
| Logistic Regression | 0.670 | 0.794 | 0.579 | 0.841 |
| **Random Forest ✅** | 0.675 | 0.786 | 0.591 | 0.850 |
| Gradient Boosting | 0.644 | 0.599 | 0.698 | 0.849 |

**Reasons for Random Forest:**
1. **It captures interactions.** Abandonment is rarely about one factor. "Old *and* few contributors" is far riskier than either alone. Trees learn such combined rules; Logistic Regression cannot, since it adds features up linearly. This is visible in the results: `project_age_days` gets much higher importance in the forest than its simple correlation suggests.
2. **Ensemble of many trees.** 300 trees, each trained on random parts of the data, vote together. This averaging removes the instability and overfitting of a single decision tree.
3. **Handles skewed, unscaled data and mixed feature types** (counts, ages, one-hot categories) without heavy preprocessing.
4. **Handles class imbalance:** `class_weight="balanced"` makes mistakes on the smaller Abandoned class count more, so the model does not simply predict "Active" for everything.
5. **Interpretable:** it produces feature importances, so we can explain *why* a repo is flagged.
6. **Probability output** works naturally for the Green/Yellow/Red buckets.
7. **Best balance on validation:** highest F1 and ROC-AUC. Gradient Boosting was more precise but missed many abandoned repos (recall 0.599), which is the wrong trade-off for a warning system.

**Why F1 and recall, not accuracy?** A model that always says "Active" scores 68.6% accuracy while catching zero abandoned projects. Accuracy cannot separate a useful model from a useless one, so F1 on the Abandoned class was the selection metric, with recall prioritised: missing a dying project is worse than flagging a healthy one for review.

**Hyperparameters:** `n_estimators=300`, `max_depth=12`, `min_samples_leaf=5`, `class_weight="balanced"`, `random_state=42`.

---

## 5. Output and Results

**Model output:** an **abandonment probability (0–1)**, converted into a status:

| Status | Probability | Meaning |
|---|---|---|
| 🟢 Green | < 0.35 | Healthy |
| 🟡 Yellow | 0.35 – 0.65 | At risk, worth a review |
| 🔴 Red | > 0.65 | Likely abandoned or declining |

**Final test results (unseen data, evaluated once):**

| Metric | Value | Plain-language meaning |
|---|---|---|
| Accuracy | 75.3% | Overall correct predictions (baseline "always Active" = 68.6%) |
| Precision | 0.579 | About 58% of "Abandoned" warnings are correct |
| Recall | 0.786 | Catches 78.6% of truly abandoned repos |
| F1 | 0.667 | Balance of precision and recall |
| ROC-AUC | 0.847 | Ranks an abandoned repo above an active one 84.7% of the time |

**Confusion matrix (test set, 6,410 repos):**

| | Predicted Active | Predicted Abandoned |
|---|---|---|
| **Actually Active** | 3,245 (correct) | 1,151 (false alarm) |
| **Actually Abandoned** | 431 (missed) | 1,583 (correct) |

Validation vs. test are almost identical (F1 0.675 → 0.667, ROC-AUC 0.850 → 0.847), so the model generalises and is not overfitted. Compared with the baseline, it gains 6.7 points of accuracy and, more importantly, detects the minority class the baseline never finds.

---

## 6. Feature Importance (what the model focused on)

| Rank | Feature | Importance |
|---|---|---|
| 1 | `contributors_log` | 0.439 |
| 2 | `project_age_days` | 0.162 |
| 3 | `open_issues_log` | 0.092 |
| 4 | `size_kb_log` | 0.071 |
| 5 | `stars_log` | 0.066 |
| 6 | `forks_log` | 0.059 |
| 7 | `license_grouped_Unlicensed` | 0.057 |
| 8–16 | language / license categories | 0.001 – 0.013 |

**Key finding:** team size is the strongest abandonment signal (almost half of all decisions), far stronger than popularity. Stars and forks rank low: a popular project with a single maintainer can still die.

---

## 7. Limitations

- Trained on established repos only; not validated for brand-new or tiny projects.
- Precision 0.58: about 4 in 10 warnings are false alarms, so this is a **review-triggering warning**, not a basis for automatic action.
- Green/Yellow/Red thresholds are a design choice centred on the 0.5 boundary, not validated against a separate risk scale.
- The label is a strong ground truth (real push dates), but is by definition a 2-year inactivity rule.

---

## 8. Integration

Served through the shared FastAPI `ml-service` (`/predict/batch`, port 8000). A Spring Boot scheduled job in `project-service` (`ProjectHealthService`, daily at 3 AM, plus a manual sync trigger) fetches repo metadata from `github-sync-service`, calls the model, and stores results in the `project_schema.project_health` table. The frontend reads them via `GET /api/projects/{id}/health`. Predictions are cached, so user requests never wait on the model.

**Saved artifacts:** `best_model.joblib`, `feature_columns.json`, metric logs and feature importances, enough to reproduce or redeploy without retraining.
