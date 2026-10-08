# CodeMates — Model 3: Contribution Significance Prediction
### Refined Technical Report

---

## 1. Purpose

CodeMates wants to identify **which developers are likely to become key contributors to a project**, to support the contribution score, member ranking and analytics dashboard. Model 3 predicts, from a developer's profile and how well their skills fit the project, the probability that they will be a **top-tier contributor** in that project.

**Problem type:** Binary classification (significant / not significant)
**Algorithm:** Random Forest Classifier

---

## 2. Why the Task Was Redefined

The first plan used Kaggle's "commits-eda" notebook, which classifies commit messages into Corrective / Security / Adaptive / Refactor. It was rejected for two reasons:
1. **Circular labels.** The categories were made by keyword rules applied to the same commit text the model would read as input, so the model would only re-learn those rules.
2. **Wrong task.** Those categories describe *what type* of change a commit is, not whether a contribution is *meaningful*.

The task became **contributor significance within a project**, reusing the large, already-cleaned data from Model 1 (no new download).

---

## 3. Dataset

| File | Used for |
|---|---|
| `repo_contributor_relationship_table_all.csv` | Real GitHub `Contributions` (commit counts) per developer per repo |
| `10_contributor_info_all.csv` | Developer profile statistics |
| `repo_info_stop75.csv` | Repository context (stars, forks, subscribers, language) |
| Model 1 language lookups | Each developer's most-used language |

| Step | Rows |
|---|---|
| Starting rows (after Model 1 cleaning) | 66,708 |
| After removing single-contributor repos | 58,274 |
| After dropping rows with no repo context (4.2%) | **55,847** |

### The label
`is_significant = 1` if the developer's real commit count is in the **top 25% of contributors within that repository**; otherwise 0.
- Class balance: **36.1% significant / 63.9% not significant** (a natural imbalance, not constructed).
- **Single-contributor repos were excluded**, otherwise every solo developer would automatically be "top 100%".
- **Contribution count is used only to build the label and is never a feature.** The model must predict significance from *who the person is and what the project is*, not from how much they already committed. That avoids circularity.

---

## 4. Features (columns the model uses)

| Feature | Meaning |
|---|---|
| `public_repos_log`, `public_gists_log`, `followers_log`, `following_log` | Developer's GitHub profile statistics (log-transformed because of heavy skew) |
| `account_age_days` | Developer's tenure on GitHub |
| `stargazers_count_log`, `forks_count_log`, `subscribers_count_log` | Popularity/scale of the project |
| `topic_count` | Number of topics on the repo |
| `primary_lang_match` | Does the repo's main language match the developer's own main language? |

**Correlation with the label (Spearman):** `followers` +0.167, `primary_lang_match` +0.124 (38.8% significant when the language matches vs 22.6% when not), `account_age_days` +0.072, `public_gists` +0.050, all repo-context features below 0.05.

These correlations are **weak**. Predicting whether a specific person will become a top contributor from public profile data has a real ceiling, because motivation, timing and employment are not visible in the data.

---

## 5. Why Random Forest?

Logistic Regression, Random Forest and Gradient Boosting were compared on the same validation data.

| Model | Val Accuracy | Val Precision | Val Recall | Val F1 | Val ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.630 | 0.490 | 0.620 | 0.548 | 0.669 |
| **Random Forest ✅** | 0.632 | 0.493 | 0.630 | 0.553 | 0.678 |
| Gradient Boosting | 0.665 | 0.569 | 0.304 | 0.396 | 0.680 |

**Reasons for Random Forest:**
1. **Weak, spread-out signal.** With no dominant feature, the useful information sits in *combinations* (for example, an experienced developer whose language matches a popular repo). Random Forest finds such combinations without them being hand-designed.
2. **Stability on noisy data.** Averaging many trees keeps predictions stable when each individual feature is only a faint signal, and the validation-to-test results stayed consistent (F1 0.553 → 0.574).
3. **Handles skewed, mixed data** without heavy preprocessing.
4. **Better recall than Gradient Boosting.** Gradient Boosting had the best accuracy (0.665) but recall of only 0.304: it mostly predicts "not significant". For a discovery/ranking feature, failing to spot promising contributors is the costlier error, so recall and F1 decided the choice. Accuracy alone would have picked the wrong model.
5. **Interpretable:** feature importance shows which profile signals matter.
6. **Probability output** suits ranking members by likelihood.

**Selection metric:** F1 (same as Models 1 and 2), because the classes are imbalanced (64/36).

---

## 6. Output and Results

**Model output:** the **probability (0–1) that a developer becomes a significant contributor** to a project, served via `/predict/contribution` and `/predict/contribution/batch` and used by the Contribution Intelligence view.

**Final test results (unseen data):**

| Metric | Value | Plain-language meaning |
|---|---|---|
| Accuracy | 64.8% | Overall correct (baseline "always not significant" = 63.9%) |
| Precision | 0.510 | About half of predicted "significant" contributors truly are |
| Recall | 0.657 | Finds 65.7% of the real top contributors |
| F1 | 0.574 | Balance of precision and recall |
| ROC-AUC | 0.696 | Ranks a real top contributor above a non-top one 69.6% of the time |

**Confusion matrix (test set, 8,378 rows):**

| | Predicted not significant | Predicted significant |
|---|---|---|
| **Actually not significant** | 3,439 (correct) | 1,913 (false alarm) |
| **Actually significant** | 1,038 (missed) | 1,988 (correct) |

The baseline reaches 63.9% accuracy but finds **zero** significant contributors. The model gives up little accuracy and gains real recall (0.657). Results moved slightly *up* from validation to test (F1 0.553 → 0.574), which is normal split variance and shows no overfitting.

---

## 7. Feature Importance (what the model focused on)

| Rank | Feature | Importance |
|---|---|---|
| 1 | `followers_log` | 0.259 |
| 2 | `public_repos_log` | 0.117 |
| 3 | `account_age_days` | 0.102 |
| 4 | `stargazers_count_log` | 0.098 |
| 5 | `primary_lang_match` | 0.098 |
| 6–10 | remaining features | 0.035 – 0.087 each |

Unlike Models 1 and 2, **no single feature dominates**. Importance is spread across the set, matching the weak correlations. This is itself evidence of how hard the task is.

---

## 8. Limitations

- **Weakest of the three models** (F1 0.574 vs 0.667 and 0.948). This reflects a harder problem, not a pipeline defect, and is reported plainly.
- The "top 25%" threshold is a design choice; top 10% would give a stricter model.
- Repo-context features added little; other signals (issue count, contributor count, activity recency) are worth testing.
- Same 4.2% missing-context and single-contributor exclusions as earlier models.
- The public dataset lacks task completion, resource-sharing and message activity. Once CodeMates has real platform data, these should improve the model considerably.

---

## 9. Integration Status

Trained and saved, and served by the shared FastAPI `ml-service` (`/predict/contribution`, `/predict/contribution/batch`). It is called by `project-service`; the frontend never calls the ML service directly and receives results through `GET /api/projects/{id}/contributions`.
