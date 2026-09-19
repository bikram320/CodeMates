# CodeMates — ML Model Requirements

For: whoever's researching/building the 3 ML features. This doc tells you exactly what data
already exists in the system, what doesn't, and what shape your model's output needs to be in
to plug back into the real API. You shouldn't need to guess or reverse-engineer anything from
the codebase to get started.

---

## How to read this

Each model has the same 6 sections:
1. **Purpose** — what it's actually for, in plain terms
2. **Data available today** — real fields/endpoints already in the system you can pull from
3. **Data NOT available yet** — gaps someone needs to instrument/collect before certain approaches work
4. **Integration contract** — the exact input/output shape the backend expects (some already built, some proposed)
5. **Suggested approach** — starting points, not mandates — the backend dev (me/the team) can help implement whichever you land on
6. **Evaluation** — how you'll know it's working

---

# Model 1 — Developer Matching / Recommendation

## 1. Purpose
Given a user, recommend other developers they'd collaborate well with, and explain the score
across 4 dimensions: skill overlap, experience fit, activity level, and shared interests.

## 2. Data available today

| Source | Field | Where it lives |
|---|---|---|
| user-profile-service | `skills[]`: `{ skillName, proficiencyLevel, yearsOfExperience }` | `GET /api/users/{username}` or `/me` |
| user-profile-service | `interests[]`: `{ interestName }` | same |
| user-profile-service | `experienceLevel` (free-text, likely `BEGINNER/INTERMEDIATE/ADVANCED` — confirm exact values with backend before hardcoding) | same |
| user-profile-service | `isOpenToCollaborate`, `activityStatus` | same |
| user-profile-service | `GET /api/users/search?skills=&experienceLevel=&interests=&openToCollaborate=` | bulk candidate pool |
| github-sync-service | `commitsLast30Days`, `commitsLast7Days`, `totalCommits` per repo | `GET /api/github/repositories/{id}/commit-stats` |
| contribution-service | `tasksCompleted`, `commitsCount`, `messagesSent`, `totalScore` per user per project | `GET /api/contributions/projects/{projectId}/users/{userId}` |
| social-service | existing accepted connections — usable as a **weak positive signal** ("these two already chose to connect") | `GET /api/social/connections` |
| discovery-service | search history — what filters people actually search with, a signal of what they're looking for | `GET /api/discovery/search/history` |

## 3. Data NOT available yet
- **No labeled "good match" outcomes.** There's no record of "these two worked together and it went well." If you want to train (rather than hand-engineer) a matching model, you need to define what counts as a positive label — see Suggested Approach below, option B.
- **No cross-project collaboration history table.** "Have these two ever been on the same project together" isn't directly queryable — you'd derive it by joining project-service's member lists yourself.
- **Skill taxonomy isn't normalized.** `skillName` is free text (whatever the user typed) — "React" and "ReactJS" and "React.js" are different strings today. You'll likely need a normalization/synonym step before any similarity scoring works well.

## 4. Integration contract — already built, don't change without confirming with backend

The write/read endpoints for scores **already exist and work** — your model just needs to
call them correctly. This is not something you're designing from scratch.

**Write a score** (your model calls this, meant for an internal job — no user-facing auth check):
```
POST /api/discovery/match-scores
Body: {
  "userId": "uuid",
  "matchedUserId": "uuid",
  "skillScore": number,       // 0–100 recommended, but not enforced server-side — pick a scale and be consistent
  "experienceScore": number,
  "activityScore": number,
  "interestScore": number
}
```
The backend computes `totalMatchScore` itself as a fixed weighted sum — **you don't send this,
the server derives it**: `skill×0.40 + experience×0.20 + activity×0.20 + interest×0.20`, rounded
to 2 decimals. If your model wants different weights, that's a backend code change to discuss,
not something you control from the data side.

**Read scores** (for testing your own output):
```
GET /api/discovery/match-scores/top?limit=10       — top matches for the logged-in user
GET /api/discovery/match-scores/{matchedUserId}     — score between caller and one specific user
```

🚫 **Not yet built:** a `reason` / explanation field. If your model should explain *why* it
recommended someone ("shared React + Python, both ADVANCED, both active this week"), that's a
new field that needs a backend schema change — flag it early if you want it, don't build your
model output around a field that doesn't exist to receive it.

## 5. Suggested approach

**Option A — heuristic/rule-based (fastest to ship, no training data needed):**
- Skill score: Jaccard similarity of skill-name sets (after normalization), weighted by proficiency overlap
- Experience score: inverse distance between experience levels (closer levels = higher score), or deliberately favor complementary pairing (a BEGINNER + ADVANCED pairing might score high if the goal is mentorship, not just similarity — decide which the product wants)
- Activity score: normalize recent commit/task/message counts (contribution-service + github-sync-service) into a 0–100 scale
- Interest score: same Jaccard approach as skills, on `interests[]`

This gets something real shipped fast and is what the current weighted-sum backend was built to receive. Good starting point regardless of whether you go further with actual ML later.

**Option B — learned model (needs labeled data, better long-term):**
- Define a positive label: e.g., "connection request sent + accepted" from social-service, or (once it exists) "co-membership on a project that reached COMPLETED status"
- Negative labels: connection requests rejected, or random non-connected pairs
- Features: the same 4 dimensions above, as numeric inputs
- Model: start simple — logistic regression or gradient-boosted trees (XGBoost/LightGBM) predicting P(good match), rather than jumping to embeddings/neural approaches with this little data
- This needs real usage data to accumulate first — not viable on day one of a new platform. Option A first, revisit this once there's enough connection/collaboration history.

## 6. Evaluation
- Option A: no formal metric needed initially — spot-check scores make intuitive sense (two Python devs with 3 shared skills should outscore two devs with nothing in common)
- Option B: precision/recall on held-out labeled pairs, or simpler — track connection-acceptance rate for top-recommended matches vs random pairs once live

---

# Model 2 — Project Health Prediction (Green/Yellow/Red)

## 1. Purpose
Given an active project, predict whether it's on track, at moderate risk, or at high risk of
stalling/failing — surfaced to the project LEADER as an early warning.

## 2. Data available today

| Source | Field | Where it lives |
|---|---|---|
| project-service | `Task.status, priority, dueDate, completedAt, createdAt, assignedToUserId` | `GET /api/projects/{id}/tasks` |
| project-service | `Project.createdAt, status, memberCount, maxMembers` | `GET /api/projects/{id}` |
| project-service | `ProjectMember.joinedAt, role` | `GET /api/projects/{id}/members` |
| contribution-service | per-user, per-project `tasksCompleted, commitsCount, messagesSent, totalScore, lastCalculatedAt` | `GET /api/contributions/projects/{id}/leaderboard` |
| contribution-service | full event timeline: `eventType, pointsAwarded, createdAt` per user per project | `GET /api/contributions/projects/{id}/users/{userId}/events` |
| messaging-service | project conversation `lastMessageAt` (proxy for team communication recency) | `GET /api/conversations/{id}` (PROJECT-type) |
| github-sync-service | repo-level `commitsLast30Days`, `commitsLast7Days` per linked repo | via contribution-service's repository-links → `GET /api/github/repositories/{id}/commit-stats` |

## 3. Data NOT available yet
- **No historical labeled outcomes.** This is the big one — there's no record anywhere of "this project succeeded" vs "this project stalled/died." The platform is new; no project has a known outcome yet. This blocks any supervised learning approach until real usage accumulates.
- **No "expected velocity" baseline.** There's no target/planned completion date at the project level, only per-task `dueDate` — so "behind schedule" has to be inferred from task due-dates in aggregate, not from an explicit project plan.
- **No member departure/inactivity flag beyond soft-delete.** If someone stops contributing but doesn't formally leave, that's only detectable by absence of activity, not an explicit status.

## 4. Integration contract — 🚫 not yet built, propose this shape

There's no health-check endpoint today. Once the model is ready, the natural integration point
(to discuss with the backend team) is something like:

```
GET /api/projects/{id}/health   (new endpoint, project-service)
Response data: {
  "status": "GREEN" | "YELLOW" | "RED",
  "riskScore": number,          // 0–100, higher = worse, for sorting/thresholds
  "factors": [
    { "signal": "overdue_tasks", "severity": "HIGH", "detail": "4 of 10 tasks overdue" },
    { "signal": "member_inactivity", "severity": "MEDIUM", "detail": "2 members with no activity in 14 days" }
  ],
  "calculatedAt": "instant"
}
```
This is a proposal, not a locked contract — the `factors` array especially is meant for the
frontend to render as "why is this yellow" explanations, so keep that in mind when designing
what your model outputs (a bare Green/Yellow/Red with no reasoning is much less useful to build
UI around).

## 5. Suggested approach

**Start heuristic, same reasoning as Model 1** — there's no labeled data to train on yet, so:
- Compute a handful of risk signals as features:
  - `overdueTaskRatio` = tasks past `dueDate` and not `DONE` ÷ total tasks
  - `taskVelocity` = tasks completed in last 7/14 days vs project's historical average
  - `memberActivityGap` = days since each member's last contribution event, flag if > N days
  - `communicationGap` = days since last project-conversation message
  - `contributionConcentration` = is the project being carried by 1 person while others are near-zero (Gini-coefficient-style imbalance on `totalScore` across members)
- Combine into a weighted risk score (0–100), threshold into Green/Yellow/Red (e.g., <30 / 30–60 / >60 — tune these once you see real distributions)
- This is buildable **today**, no waiting on data accumulation, and gives the team something demoable

**Later, once real projects have run their course:**
- Once projects start reaching `COMPLETED` or getting abandoned (`ARCHIVED` with no recent activity is a reasonable proxy label), retroactively label historical projects and train a classifier on the same feature set
- Time-series approaches (survival analysis / hazard modeling — predicting "time to stall") are a good fit later, overkill now

## 6. Evaluation
- Heuristic phase: sanity-check against project-service's `status` field manually — an `ARCHIVED` project with no activity in 30 days should score RED; an `ACTIVE` project with steady task completion should score GREEN
- Learned phase (later): standard classification metrics (precision/recall per class) against retroactively-labeled historical projects

---

# Model 3 — Contribution Intelligence

## 1. Purpose
Go beyond raw event counting (what contribution-service does today) to judge whether
contributions are *meaningful* — catching gaming/spam and weighting substance over volume.

**Important scoping note:** contribution-service already does rule-based point-awarding (fixed
points per task priority, per commit, per message with a daily cap to prevent obvious spam
farming). This model's job is the layer *on top* of that — not replacing it, refining it.

## 2. Data available today

| Source | Field | Where it lives |
|---|---|---|
| contribution-service | full event audit log: `eventType, pointsAwarded, referenceId, referenceType, description, createdAt` per user per project | `GET /api/contributions/projects/{id}/users/{userId}/events` |
| contribution-service | current scoring rules (fixed points by task priority, flat commit point, flat message point with daily cap) — read the actual constants in `ScoringProperties`/`ContributionScoreService` in the codebase, not guessed here, since exact point values weren't shown to me | contribution-service source |
| project-service | task `priority`, `title`, `description` (length/content as a rough complexity proxy) | `GET /api/projects/{projectId}/tasks/{taskId}` |
| messaging-service | message `content`, `messageType`, frequency per user per day | via conversation history endpoints |
| project-service | task comments — `content`, frequency per user | `GET /api/projects/{projectId}/tasks/{taskId}/comments` |

## 3. Data NOT available yet — this is the biggest gap of the three models
- **No commit-level detail.** github-sync-service only stores commit *counts* (`totalCommits`, `commitsLast30Days`, `commitsLast7Days`) — no lines-changed, files-touched, or commit-message content. If "commit quality" matters to your model (a 200-line refactor vs a 1-line typo fix currently score identically), **this needs new data collection**: extending `GithubApiClient` to pull per-commit stats (`additions`, `deletions`, `files changed`) from GitHub's API, which isn't wired up today. Flag this early — it's a backend + API-quota scoping conversation, not just a modeling one.
- **No message/comment quality signal beyond count.** Nothing currently measures whether a message was substantive ("here's the bug and how I'd fix it...") vs filler ("ok", "sounds good"). If you want to score this, you're looking at message length/content analysis — possible with what's already stored (`content` field exists), but nothing computes it today.
- **No explicit "gaming" labels.** Like Models 1 and 2, there's no historical record of "this was flagged as gamed/spammy" to train against.

## 4. Integration contract — 🚫 not yet built, propose this shape

Two reasonable integration points to discuss with backend, not mutually exclusive:

**A. A multiplier fed back into scoring** (changes contribution-service's existing point math):
```
Conceptually: finalPoints = basePoints (existing fixed-rule points) × qualityMultiplier (your model's output, e.g. 0.5–1.5)
```
This would mean contribution-service calls out to your model (or a cached score) before
awarding points — a real architectural change, needs backend buy-in before building around it.

**B. A separate read-only "quality score" alongside the existing totalScore** (additive, lower risk):
```
GET /api/contributions/projects/{id}/users/{userId}/quality   (new endpoint, proposed)
Response data: {
  "userId", "projectId",
  "qualityScore": number,     // 0–100
  "flags": ["POSSIBLE_MESSAGE_SPAM"],   // or empty
  "calculatedAt": "instant"
}
```
Start with **B** — it's additive and doesn't risk breaking the existing (working) scoring
system while the model is still being validated.

## 5. Suggested approach

**Phase 1 — anomaly/spam detection (rule-based, buildable now):**
- Flag users hitting the message daily cap every single day (likely gaming, not organic communication)
- Flag comments/messages below a length threshold that occur in high volume (low-effort spam pattern)
- This alone is useful and doesn't need any new data collection

**Phase 2 — commit quality (needs the GitHub API extension noted above):**
- Once lines-changed/files-touched data is collected, weight commit contribution by size/impact rather than flat count
- Careful: bigger isn't always better (a huge low-quality commit shouldn't outscore a small precise fix) — this is genuinely a research question, worth timeboxing rather than over-engineering

**Phase 3 — task complexity weighting:**
- Currently task points are priority-based only (LOW/MEDIUM/HIGH/URGENT). A more nuanced model could factor in description length, comment thread activity, or time-to-complete relative to similar tasks — diminishing returns territory, do this last if at all

## 6. Evaluation
- Phase 1: manual spot-check against known test accounts sending spam vs organic messages
- Phase 2/3: harder to formally evaluate without labeled "this contribution was valuable" data — likely stays heuristic-tuned rather than formally trained unless the team decides to build a labeling process (e.g., project LEADERs manually rating teammate contributions periodically, which would be a new feature itself)

---

## Summary — what to build first, in order

1. **Model 1, Option A** (heuristic matching) — fastest win, endpoint already exists and works today
2. **Model 2, heuristic health score** — no new backend dependency to ship a first version, high visible value
3. **Model 3, Phase 1** (spam/anomaly detection) — buildable with existing data, no new instrumentation needed
4. Everything past this point (learned matching, learned health prediction, commit-quality scoring) depends on either **real usage data accumulating** or **new data collection being built** — don't block on these for a first release of any of the three features.

If any of the 🚫 "not yet built" integration contracts above are the direction you want to go,
say so before implementation starts — those need a backend conversation (new endpoints, schema
changes) in parallel with the model work, not after.
