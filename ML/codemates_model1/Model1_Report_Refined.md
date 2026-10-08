# CodeMates — Model 1: Developer Matching
### Refined Technical Report (v2, Skill-Based)

---

## 1. Purpose

When a user opens the discovery page, CodeMates needs to answer: **"Which developers would this person work well with?"**
Model 1 takes two developers and returns a **match probability (0 to 1)** that they are a good collaboration pair. That number becomes the `skillScore` inside the Spring Boot `MatchScoreService`, replacing the earlier placeholder logic.

**Problem type:** Binary classification (collaborated = 1 / did not collaborate = 0)
**Algorithm:** Random Forest Classifier

---

## 2. Dataset

Real GitHub data, four linked CSV files:

| File | What it contains | Size |
|---|---|---|
| `10_contributor_info_all.csv` | Developer profiles (followers, repos, gists, account age…) | 45,236 profiles |
| `repo_contributor_relationship_table_all.csv` | Which developer contributed to which repository | 129,093 links (22,895 repos) |
| `repo_info_stop75.csv` | Repository details, including programming language | 22,148 rows |
| `topic_relationship_table_stop75.csv` | Topic tags of each repository | 67,256 rows |

### Cleaning
| Step | Result |
|---|---|
| Removed duplicate (repo, contributor) rows | 129,093 → 129,053 |
| Removed 187 bot accounts (dependabot etc.) | 45,236 → 45,049 profiles |
| Removed duplicate profiles | 45,049 → 44,805 |
| Removed duplicate repo rows | 22,148 → 21,297 |
| Kept only contributors that have a profile | 129,053 → 66,708 rows (46% coverage) |
| Excluded repos with only 1 usable contributor (no pair possible) | 8,434 repos removed |

**Final pool:** 11,819 repos usable for pair building, 44,805 developer profiles.

### The label (target)
No public dataset says "these two developers are a good match", so a **proxy label** is used:
- `collaborated = 1` → both developers contributed to the same GitHub repository (149,792 pairs)
- `collaborated = 0` → randomly chosen pair that never shared a repository (149,792 pairs)

Final dataset: **299,584 pairs, perfectly balanced 50/50**.

---

## 3. Features (what the model looks at)

Each developer gets a **skill profile** built from every repo they contributed to: the set of languages used, the set of topics used, and their most-used (primary) language. Each row is then a **pair** of developers, described by:

| Feature | Meaning | Why it matters |
|---|---|---|
| `language_jaccard` | Overlap of the two developers' language sets (shared ÷ total) | Developers who code in the same languages can actually work on the same codebase |
| `primary_language_match` | Do both use the same main language? (yes/no) | Same "home" language → smoother teamwork |
| `topic_jaccard` | Overlap of the topics of their repos (web, ML, devops…) | Shared interests/domains |
| `account_age_days_*` | Difference / sum / minimum of account ages | Secondary experience signal |
| `public_repos`, `public_gists`, `followers`, `following` (`absdiff`, `sum`, `min`, log-transformed) | Profile statistics | Minor secondary signals; log used because these counts are heavily skewed |

**Design decision — v1 vs v2:** Version 1 used followers/repo counts and *same company / same city*. That measured coincidence, not skill compatibility, so it was rebuilt. `same_company` and `same_location` were deleted, and the features above were created. Result: F1 rose from ~0.61 (v1) to **0.948** (v2).

**Correlation with the label (Spearman):** `language_jaccard` +0.822, `primary_language_match` +0.718, `topic_jaccard` +0.632, all old profile-stat features below 0.2.

---

## 4. Why Random Forest?

We did not pick Random Forest by habit. We compared it against a simple linear model on the same data, and the choice rests on the properties of this problem:

1. **Tabular, mixed-type data.** Our inputs are numbers, ratios (Jaccard scores) and yes/no flags. Tree-based models are the standard strong choice for this kind of data and need no feature scaling.
2. **Non-linear relationships.** Compatibility is not a straight line. For example, a high language overlap combined with topic overlap is much stronger evidence than either alone. A Random Forest learns these "if-this-and-that" rules automatically; Logistic Regression can only draw one linear boundary.
3. **Many trees vote, which reduces overfitting.** A single decision tree memorises training data. A Random Forest trains many trees on random samples of rows and features and averages their votes, so individual mistakes cancel out. That is why validation and test scores are identical (0.948 / 0.948).
4. **Robust to skewed and noisy features** such as followers or gist counts, and it copes with the many features that carry little signal.
5. **Built-in feature importance.** We can show exactly which features drive decisions (Section 6), which matters for explaining a matching feature to users and examiners.
6. **Probability output.** `predict_proba` gives a 0–1 score that plugs directly into the weighted match score.
7. **Fast inference.** Scoring is quick enough to serve batches of candidate pairs through the FastAPI service.

**Why not the alternatives?**
- *Logistic Regression* was trained as the baseline: F1 0.910, recall 0.895 — good, but Random Forest is clearly better on recall (0.985).
- *Neural networks* were not used: this is structured tabular data with modest size, where forests match or beat them, and they are harder to interpret.

**Selection metric:** F1, with recall in focus — for matching, missing a genuinely good pair is worse than showing one extra candidate.

**Hyperparameters:** `n_estimators=150` (150 trees), `max_depth=14` (limits tree depth to prevent memorising), `min_samples_leaf=5` (each leaf needs at least 5 samples), `random_state=42` (reproducible results).

| Model | Val Accuracy | Val Precision | Val Recall | Val F1 | Val ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.912 | 0.926 | 0.895 | 0.910 | 0.968 |
| **Random Forest ✅** | 0.946 | 0.913 | 0.985 | 0.948 | 0.985 |

---

## 5. Output and Results

**Model output:** a single **match probability between 0 and 1** for a pair of developers (`POST /predict/match` for one pair, `/predict/match/batch` for many). Higher = stronger skill overlap. In Spring Boot this value is mapped to `skillScore`.

**Final test results (unseen data):**

| Metric | Value | Plain-language meaning |
|---|---|---|
| Accuracy | 94.6% | 94.6 of every 100 pairs classified correctly |
| Precision | 0.913 | When the model says "good match", it is right 91.3% of the time |
| Recall | 0.985 | It finds 98.5% of all genuinely collaborating pairs |
| F1 | 0.948 | Balance of precision and recall |
| ROC-AUC | 0.985 | Given one good and one bad pair, the model ranks the good one higher 98.5% of the time |

**Confusion matrix (test set, 44,938 pairs):**

| | Predicted no | Predicted yes |
|---|---|---|
| **Actually no** | 20,356 (correct) | 2,113 (false alarm) |
| **Actually yes** | 330 (missed) | 22,139 (correct) |

Only 330 real collaborations were missed out of 22,469.

---

## 6. Feature Importance (what the model focused on)

| Rank | Feature | Importance |
|---|---|---|
| 1 | `language_jaccard` | 0.530 |
| 2 | `primary_language_match` | 0.250 |
| 3 | `topic_jaccard` | 0.155 |
| 4–18 | all profile-stat features | ≤ 0.009 each |

The three skill features make up **93.5%** of the model's decisions. Followers and repo counts are almost irrelevant. This confirms it is a genuine **skill-matching** model.

---

## 7. Limitations (state these honestly)

- **The label is a proxy.** "Shared a repository" is not the same as "worked well together". Because shared repos naturally share a language, the features are close relatives of the label, so this is an easier task than true compatibility. The high score shows skill overlap is real and useful, not that we can predict teamwork quality.
- **Random negatives.** Non-collaborating pairs are random pairs, assumed not to be good matches.
- **Topic coverage is 50.9%.** Many repos have no topics, so `topic_jaccard = 0` for about half of pairs; the model then relies on language features.
- **Coverage:** only 46% of contributors had usable profile data.

---

## 8. Integration Status

Trained model saved as an artifact and served by the shared FastAPI `ml-service` (`/predict/match`, `/predict/match/batch`). The Spring Boot `discovery-service` calls it and maps `match_probability` to `skillScore`; `github-sync-service` was extended to sync the language/topic data the model needs.
