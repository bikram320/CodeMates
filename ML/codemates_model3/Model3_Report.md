# CodeMates — Model 3: Contribution Significance Prediction
### Technical Report

---

## 1. Overview

**Model name:** Contribution Significance Classifier (Random Forest)
**Task:** Binary classification — predicts whether a developer is likely to
become a significant (top-tier) contributor to a given project, based on
their profile and skill match with the project.
**Part of:** CodeMates ML feature 3 of 3, feeding the currently-unbuilt
Contribution Score / member-ranking logic described in the README's
"Contribution Tracking System" and "Analytics Dashboard" sections.

---

## 2. Candidate Dataset Rejected — and Why

The original plan investigated Kaggle's "commits-eda" notebook (built on
the "GitHub Commit Messages Dataset," classifying commits into
Corrective/Security/Adaptive/Refactor categories). This was **rejected**
for two reasons:

1. **Circular labels.** The notebook generates its own category labels
   using keyword-matching rules applied directly to the commit message
   text — the same text that would be used as model input. A model trained
   this way would just be reverse-engineering the notebook author's keyword
   rules, not learning anything independently real. This is the same class
   of problem as Model 2's near-miss with `days_since_last_push`.
2. **Wrong task.** Corrective/Security/Adaptive/Refactor classifies *what
   type* of change a commit is, not whether it's *meaningful vs. trivial*
   — a one-line typo fix and a real security patch are both "Corrective."

Smaller, genuinely manually-labeled alternatives exist in the research
literature (Levin et al., Ghadhab et al. — 1,100-1,800 commits, labels
cross-referenced against real issue trackers), but were judged too small
for the scale used in Models 1 and 2, and still classify commit *type*
rather than contribution *significance*.

**Task redefinition (with the user):** rather than classifying individual
commits, this model predicts **contributor significance within a project**
— directly reusing Model 1's already-cleaned, large-scale data.

---

## 3. The Label — Real, Non-Circular

`is_significant = 1` if a contributor's real GitHub `Contributions` count
(actual commit count, from GitHub's own API — already present in
`repo_contributor_relationship_table_all.csv`) places them in the **top
25th percentile of contributors within that specific repo**.

**Critical design decision:** `Contributions` count is used only to
*construct the label* — it is never used as a model *feature*. The model
predicts significance from who the contributor is and what the project is,
not from how much they've already contributed. This avoids the
circularity that sank the original Kaggle candidate.

**Degenerate-case handling:** repos with only 1 contributor were excluded
before computing percentiles — otherwise every solo-contributor repo
trivially assigns its single contributor the 100th percentile,
artificially inflating the "significant" class (this pattern, and the fix,
mirrors Model 1's single-contributor-repo exclusion).

---

## 4. Dataset

Reused directly from Model 1's cleaning pipeline (no new download):

| Item | Value |
|---|---|
| Source | `repo_contributor_relationship_table_all.csv` (real contribution counts), `10_contributor_info_all.csv` (profiles), `repo_info_stop75.csv` (repo context), plus Model 1's language lookups |
| Starting rows (post Model-1 cleaning, multi-contributor repos only) | 66,708 → 58,274 after excluding single-contributor repos |
| After dropping rows with missing repo context (4.2%, repos outside `repo_info` coverage) | **55,847** |
| Label balance | 36.1% significant / 63.9% not significant (a real, natural imbalance — not constructed) |

---

## 5. Feature Engineering

| Feature | Description |
|---|---|
| `{public_repos,public_gists,followers,following}_log` | Contributor's GitHub profile stats, log-transformed (same skew reasoning as Models 1 & 2) |
| `account_age_days` | Contributor tenure |
| `{stargazers_count,forks_count,subscribers_count}_log` | Repo popularity/scale context |
| `topic_count` | Number of topic tags on the repo |
| `primary_lang_match` | Boolean: does the repo's primary language match the contributor's own most-used language (reused from Model 1 v2's language logic) |

---

## 6. EDA — Weak Signal, Reported Honestly

| Feature | Spearman r vs. `is_significant` |
|---|---|
| `followers` | +0.167 |
| `primary_lang_match` | +0.124 (38.8% significant rate when true vs. 22.6% when false) |
| `account_age_days` | +0.072 |
| `public_gists` | +0.050 |
| all repo-context features | \|r\| < 0.05 |

**This is meaningfully weaker than Model 1 (r up to 0.822) or Model 2**
(r up to −0.466). Reported plainly rather than hidden: predicting "will
this specific person become a top contributor to this specific repo" from
general profile signals alone has a real ceiling — factors like personal
motivation, timing, and employment (none observable in this data) likely
dominate the true answer more than anything measurable here.

---

## 7. Model Selection

| Model | Val Accuracy | Val Precision | Val Recall | Val F1 | Val ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.630 | 0.490 | 0.620 | 0.548 | 0.669 |
| **Random Forest** ✅ | 0.632 | 0.493 | 0.630 | **0.553** | 0.678 |
| Gradient Boosting | 0.665 | 0.569 | 0.304 | 0.396 | 0.680 |

**Selection metric:** F1, consistent with Models 1 & 2. Gradient Boosting
had the best accuracy but a much lower recall (0.304) — it defaults to
predicting "not significant" far more often, which would make it a poor
fit for a ranking/discovery feature where under-identifying genuinely
promising contributors is the costlier error.

---

## 8. Final Test Set Results

| Metric | Validation | Test | Δ |
|---|---|---|---|
| Accuracy | 0.632 | 0.648 | +0.016 |
| Precision | 0.493 | 0.510 | +0.017 |
| Recall | 0.630 | 0.657 | +0.027 |
| F1 | 0.553 | 0.574 | +0.021 |
| ROC-AUC | 0.678 | 0.696 | +0.018 |

All metrics moved slightly *up* from validation to test rather than down —
within normal split-to-split variance, and no sign of overfitting.

**Confusion matrix:** `[[3439, 1913], [1038, 1988]]`

**Baseline:** majority-class (always "not significant") = 63.9% accuracy
with 0 recall on the significant class. The trained model trades some
accuracy for genuinely useful recall (0.657) — a meaningful, if modest,
improvement in identifying likely-significant contributors that a
majority-class guess cannot provide at all.

---

## 9. Feature Importance

| Rank | Feature | Importance |
|---|---|---|
| 1 | `followers_log` | 0.259 |
| 2 | `public_repos_log` | 0.117 |
| 3 | `account_age_days` | 0.102 |
| 4 | `stargazers_count_log` | 0.098 |
| 5 | `primary_lang_match` | 0.098 |
| 6-10 | remaining features | 0.035-0.087 each |

Unlike Models 1 & 2, **no single feature dominates** — importance is
spread relatively evenly across the feature set. This matches the diffuse,
weaker EDA correlations: no one signal is doing most of the work, which is
itself informative about how hard this prediction task genuinely is.

---

## 10. Known Limitations

- **Weakest of the three models by a clear margin** (F1 0.574 vs. 0.667
  and 0.948) — reported honestly rather than downplayed. This reflects a
  genuinely harder task, not a pipeline defect.
- The label ("top 25% of contribution within this repo") is a reasonable,
  real, objective proxy for "significant contributor," but is still a
  design choice — a different percentile threshold (e.g. top 10%) would
  produce a different, stricter model.
- Repo-context features (stars/forks/subscribers) contributed relatively
  little (each under 0.10 importance) despite being included — worth
  future investigation into whether other repo-level signals (e.g. issue
  count, contributor count, activity recency) would help more.
- Same 4.2% missing-repo-context and single-contributor-repo exclusions as
  earlier models apply here too.
- This model was deliberately built to predict significance *without*
  using past contribution volume as a feature — for CodeMates' real
  internal use, richer signals (task-completion history, resource-sharing
  activity, message engagement) that don't exist in this public dataset
  could meaningfully improve on this once real platform data accumulates.

---

## 11. Status

✅ Pipeline complete: dataset candidate evaluated and rejected (with
reasoning) → task redefined → label construction (with degenerate-case
handling) → feature engineering (reusing Model 1 infrastructure) → EDA →
stratified split → baseline → model comparison → final evaluation →
feature importance → inference validated on example inputs.

**Next:** integrate into the shared FastAPI `ml-service`
(`/predict/contribution/batch`), same pattern as Models 1 & 2.
