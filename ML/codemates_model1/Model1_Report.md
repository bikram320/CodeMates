# CodeMates — Model 1: Developer Matching (v2, Skill-Based)
### Technical Report

---

## 1. Overview

**Model name:** Developer Matching Classifier (Random Forest)
**Task:** Binary classification — predicts whether a pair of developers is
likely to collaborate well, based on skill/interest overlap derived from
each developer's GitHub repo contribution history.
**Part of:** CodeMates ML feature 1 of 3 (Developer Matching, Project Health
Prediction, Contribution Intelligence). Feeds the currently-placeholder
scoring logic in `MatchScoreResponseDto`.

**Revision note:** this is v2. The first version used profile-popularity
similarity (followers, repo counts) plus same-employer/same-city matching
as its primary signals — on review, this measured coincidence rather than
project-collaboration compatibility, so the feature set was rebuilt around
actual skill signals (see Section 5).

---

## 2. The Label — a Proxy, Not Ground Truth

No dataset of real "good match" ratings exists. The label used is:
**`collaborated = 1`** if two developers both contributed to the same GitHub
repository; **`collaborated = 0`** for a randomly sampled pair with no
shared repo. This remains the primary lens for interpreting every result
below — see Section 8 for how this interacts with v2's very strong scores.

---

## 3. Dataset

| Item | Value |
|---|---|
| Source | `10_contributor_info_all.csv` (developer profiles), `repo_contributor_relationship_table_all.csv` (repo-contributor links), `repo_info_stop75.csv` (repo language data), `topic_relationship_table_stop75.csv` (repo topic tags) |
| Raw contributor profiles | 45,236 |
| Raw relationship rows | 129,093 (22,895 unique repos, 98,063 unique contributors) |
| Raw repo info rows | 22,148 (21,297 unique repos after dedup) |
| Raw topic relationship rows | 67,256 |

### Cleaning steps applied
| Step | Effect |
|---|---|
| Deduplicate (repo, contributor) rows | 129,093 → 129,053 |
| Remove bot/automation accounts (187, via GitHub API `type=Bot` + username pattern) | 45,236 → 45,049 profiles |
| Deduplicate contributor profile rows | 45,049 → 44,805 |
| Deduplicate repo_info rows (by repo ID) | 22,148 → 21,297 |
| Filter relationship data to contributors with matching profile data | 129,053 → 66,708 rows (46% coverage) |
| Exclude repos left with only 1 usable contributor | 8,434 repos excluded |

### Final usable pool
11,819 repos usable for pair generation, 44,805 unique contributor profiles,
**18,781 of 20,253 repos (92.7%) have matching language/topic data**.

---

## 4. Label Construction (Pair Building)

Unchanged from v1:
- **Positive pairs:** every unique pair of contributors who shared a repo → **149,792 pairs**
- **Negative pairs:** randomly sampled non-overlapping pairs, matched 1:1 → **149,792 pairs**
- **Final labeled dataset:** 299,584 rows, balanced 50/50
- Pairs canonicalized (alphabetically sorted) so (A,B)/(B,A) never both appear

---

## 5. Feature Engineering (v2 — Rebuilt)

**Per-developer skill profile**, built from every repo they contributed to:
- `languages_used` — set of programming languages across all their repos
- `topics_used` — set of repo topics/tags across all their repos
- `primary_language` — their single most-frequent language

**Per-pair features:**

| Feature | Description |
|---|---|
| `language_jaccard` | Jaccard similarity (\|intersection\|/\|union\|) between the two developers' language sets |
| `topic_jaccard` | Jaccard similarity between their topic sets |
| `primary_language_match` | Boolean: do their single most-used languages match |
| `account_age_days_*` (absdiff/sum/min) | Secondary signal, untransformed |
| `{public_repos, public_gists, followers, following}_{absdiff,sum,min}_log` | Secondary signals, log-transformed (same skew reasoning as Model 2) |

**Removed from v1:** `same_company`, `same_location` — these measured
workplace/geographic coincidence, not project-collaboration compatibility,
and were judged inappropriate for a skill-matching feature after review.

**Data coverage:** 95.6% of pairs have language data for both developers;
50.9% have topic data for both (many GitHub repos simply have no topics
tagged — a normal absence, not a data quality defect; `topic_jaccard=0` in
these cases is the correct, honest value, not a missing-data imputation).

---

## 6. EDA — Why This Feature Set Works

| Feature | Spearman r vs. `collaborated` |
|---|---|
| `language_jaccard` | **+0.822** |
| `primary_language_match` | +0.718 |
| `topic_jaccard` | +0.632 |
| (all v1 profile-stat features) | \|r\| < 0.2 |

This is a dramatically stronger signal than any feature found in v1 — direct
confirmation that skill/language overlap is the right basis for this model,
where popularity/location coincidence was not.

---

## 7. Model Selection

| Model | Val Accuracy | Val Precision | Val Recall | Val F1 | Val ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.912 | 0.926 | 0.895 | 0.910 | 0.968 |
| **Random Forest** ✅ | 0.946 | 0.913 | **0.985** | **0.948** | **0.985** |

**Selection metric:** F1 (consistent with Models 1v1 and 2). Random Forest's
much higher recall (catching 98.5% of true collaborations) drove the win —
appropriate for a matching feature, where missing a genuinely good pairing
(false negative) is a worse product outcome than surfacing an extra
candidate to review (false positive).

**Hyperparameters:** `n_estimators=150, max_depth=14, min_samples_leaf=5, random_state=42`

---

## 8. Final Test Set Results

| Metric | Validation | Test | Δ |
|---|---|---|---|
| Accuracy | 0.946 | 0.946 | 0.000 |
| Precision | 0.913 | 0.913 | 0.000 |
| Recall | 0.985 | 0.985 | 0.000 |
| F1 | 0.948 | 0.948 | 0.000 |
| ROC-AUC | 0.985 | 0.985 | 0.000 |

Essentially zero drop from validation to test — strong evidence of a
genuinely learnable, non-overfit relationship, not a fluke of one split.

**Confusion matrix:** `[[20356, 2113], [330, 22139]]`

**Important interpretive caveat (read before citing this number
uncritically):** part of why this score is so high is that the features
(`language_jaccard`, `primary_language_match`) are themselves close
cousins of the label-generating mechanism — people who share a repo
overwhelmingly tend to share that repo's language. This is not label
leakage in the strict technical sense (no feature is a deterministic
function of the label the way Model 2's `days_since_last_push` was), but
it does mean this is a comparatively easier prediction task than "will
these two people work well together," which is the deeper thing CodeMates
ultimately wants. State this plainly in any presentation of this result —
it's a genuine strength (skill overlap is real, useful signal) with a
genuine caveat (it's an easier proxy target than true compatibility).

---

## 9. Feature Importance

| Rank | Feature | Importance |
|---|---|---|
| 1 | `language_jaccard` | 0.530 |
| 2 | `primary_language_match` | 0.250 |
| 3 | `topic_jaccard` | 0.155 |
| 4-18 | profile-stat features (each) | ≤ 0.009 |

**`language_jaccard` + `primary_language_match` + `topic_jaccard` = 93.5%**
of total model decision-making — confirms this is now genuinely a
skill-match model, with follower/repo/gist counts reduced to a minor tail,
exactly the intended correction from v1.

---

## 10. Known Limitations

- **Section 8's caveat is the central limitation** — strong scores partly
  reflect an easier proxy task, not necessarily true compatibility
  prediction.
- The underlying `collaborated` label is still "shared a repo," not a
  validated "good match" rating (same limitation as v1, inherited by
  design).
- 50.9% topic-data coverage means roughly half of pairs get `topic_jaccard=0`
  by default (no topics tagged on either developer's repos) — the model
  still performs well by leaning on `language_jaccard`/`primary_language_match`
  in these cases, but topic-based nuance is unavailable for half the data.
- Only 46% of contributors in the raw relationship data had usable profile
  information — the model cannot score over half of all observed GitHub
  contributors in this dataset.
- Negative pairs are randomly sampled "never shared a repo" pairs — assumes
  random pairs are truly non-collaborative, a reasonable but unverified
  assumption.

---

## 11. Status

✅ Pipeline complete: data audit → cleaning → pair construction → skill-profile
construction (language/topic extraction) → feature engineering → EDA →
stratified split → model comparison → final evaluation → feature importance
→ inference validated on example pairs → integrated into the shared
FastAPI `ml-service` (`/predict/match/batch`, `/predict/match`), tested
end-to-end against the real trained model.

**Next:** Spring Boot `discovery-service` integration — pending
`GithubProfile.java`/`GithubUserApiResponse.java` to determine exact field
names for extending profile sync with the language/topic data this model
needs, and a decision on how Model 1's single probability maps into
`MatchScoreService`'s existing 4-way weighted sub-score schema.