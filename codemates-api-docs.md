# CodeMates — API Reference (for Frontend)

## How to read this
- ✅ **Confirmed** — taken directly from controller/service code.
- ⚠️ **Inferred** — field names reconstructed from `.builder()...build()` or `request.getX()` calls seen in the service layer (reliable for *names*, not for validation rules).
- 🚫 **Unknown** — not visible in any code shared so far.

Every field below is now ✅ or ⚠️-with-real-names — no remaining path-confirmed-but-shape-unknown sections. ⚠️ still just means "validation constraints (required/format/length) aren't visible from service code, only field presence."

---

## How auth works (read this first)

CodeMates uses **httpOnly cookies**, not bearer tokens. This changes how you call the API from the frontend:

- On every `fetch`, set `credentials: 'include'`. With `axios`, set `withCredentials: true` globally.
- You **cannot** read `access_token` or `refresh_token` from JavaScript — they're httpOnly by design. Don't try to store them in localStorage or attach an `Authorization` header; it won't do anything.
- `access_token` cookie — path `/`, short-lived, sent on every request.
- `refresh_token` cookie — path `/api/auth/refresh` **only**. It will not be sent to any other endpoint. Call `POST /api/auth/refresh` (no body) when you get a 401 on a normal request; the response sets fresh cookies.
- Login/register responses do **not** return the tokens in the JSON body — only non-sensitive user info (`userId`, `email`, `authProvider`). Don't look for a token field to store; there isn't one to store.
- CORS: the gateway currently has CORS **disabled** in `SecurityConfig` (`.cors(AbstractHttpConfigurer::disable)`). This needs to be enabled with your exact frontend origin and `allowCredentials(true)` before cross-origin cookie auth will work at all — flag this to your backend teammate if you're developing on a different port/origin than the gateway.
- A 401 from **any** endpoint except the ones below means "log the user out and redirect to login" — the access token is invalid or expired and refresh should be attempted first.

**Public (no cookie needed):** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/health`, `GET /api/users/search` (per `ProfileController`, this is intentionally public to power discovery), `GET /api/users/{username}` (public profile view), `GET /api/projects/{id}` (public project view — not auth-checked in `ProjectController`).

🚫 `/api/auth/github` and `/api/auth/github/callback` are listed as public in `SecurityConfig` but no controller for them was shared — GitHub login itself isn't documented here yet, separate from `github-sync-service`'s `/api/github/connect` (which *is* documented below and is a different, authenticated flow for linking an already-logged-in account to GitHub).

---

## Response envelope (every endpoint, every service)

All responses — success and error — use the same shape:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { /* endpoint-specific payload, or null */ },
  "timestamp": "2026-09-18T10:15:30Z"
}
```

`data` is `null` for actions with no return value (delete, mark-read, etc.) and for all error responses.

## Error responses

Confirmed from `GlobalExceptionHandler` (messaging-service; the same `@RestControllerAdvice` pattern is used across services per the shared `ApiResponse`/exception-class conventions — assume the same shape everywhere, status codes may vary by exception type per service):

| Situation | HTTP Status | `message` |
|---|---|---|
| Resource not found (task, conversation, message, connection, etc.) | `404` | e.g. `"Conversation not found: <id>"` |
| Not authorized for this specific action (not the sender/author/participant) | `403` | e.g. `"Only the sender can edit this message"` |
| Invalid state transition / bad business rule | `400` | e.g. `"Cannot start a conversation with yourself"` |
| `@Valid` request body validation failure | `400` | first failing field: `"<field>: <constraint message>"` |
| Not authenticated / bad or missing JWT | `401` | e.g. `"Unauthenticated WebSocket session"` (gateway 401 body: see below) |
| Downstream service unreachable (e.g. messaging → project-service) | `503` | `"Could not verify project membership right now. Try again shortly."` |
| Anything unhandled | `500` | `"Something went wrong"` |

Gateway-level 401 (before the request even reaches a service — missing/invalid `access_token` cookie) uses a **locally-built** version of the same shape, not the real `ApiResponse` class (the gateway has no dependency on it): `{"success": false, "message": "...", "data": null}` — note: **no `timestamp` field** on this one specifically.

---

## Testing/base URLs

Go through the gateway for all frontend calls: `http://localhost:8080/api/...`. Direct-to-service ports exist (`:8081`–`:8089`) but skip the gateway's auth check — don't use them from the app.

---

## 1. auth-service — gateway `/api/auth/**` ✅

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ email, password, username, fullName }` ⚠️ (fields confirmed used; required/format rules not visible) | `{ userId, email, authProvider }` — sets cookies, `201` |
| POST | `/api/auth/login` | Public | `{ email, password }` | `{ userId, email, authProvider }` — sets cookies, `200` |
| POST | `/api/auth/refresh` | Requires `refresh_token` cookie | none | `null` — rotates both cookies |
| POST | `/api/auth/logout` | Requires `refresh_token` cookie | none | `null` — clears both cookies |
| POST | `/api/auth/logout-all` | Requires `access_token` cookie | none | `null` — clears cookies, revokes all refresh tokens |
| POST | `/api/auth/forgot-password` | Public | `{ email }` | `null` — always returns success message regardless of whether email exists (security-by-design, don't treat this as confirmation the email is registered) |
| POST | `/api/auth/reset-password` | Public | `{ token, newPassword }` | `null` — clears cookies, forces re-login |
| GET | `/api/auth/health` | Public | — | plain string |

`authProvider` is `"LOCAL"` for password accounts, `"GITHUB"` for GitHub OAuth accounts (see below).

### GitHub OAuth login ✅ (implemented — see codebase patch)

This is a **redirect flow**, not a JSON endpoint — don't `fetch()` it.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/auth/github` | Public | Point a link/button's `href` straight at this. Redirects the browser to GitHub. |
| GET | `/api/auth/github/callback` | Public | GitHub redirects here after consent. On success, sets `access_token`/`refresh_token` cookies exactly like login, then redirects the browser to your frontend's configured success URL. On failure, redirects to the failure URL with `?error=state_mismatch|no_verified_email|oauth_failed`. |

Frontend integration:
```html
<a href="http://localhost:8080/api/auth/github">Continue with GitHub</a>
```
No JSON response to parse — after the redirect lands back on your app, the user is already
authenticated (cookies are set). Your success-redirect route just needs to route into the app.

If a GitHub account's email matches an existing local (password) account, the current policy
is: **log them straight in**, no password confirmation. Flag to your backend teammate if you
want stricter account-linking instead.

---

## 2. user-profile-service — gateway `/api/users/**` ✅

| Method | Path | Auth | Body / Params | Response `data` |
|---|---|---|---|---|
| GET | `/api/users/me` | Cookie | — | `ProfileResponse` (own profile) |
| GET | `/api/users/{username}` | **Public** | — | `ProfileResponse` |
| GET | `/api/users/search?skills=&experienceLevel=&interests=&openToCollaborate=` | **Public** | all params optional, `skills`/`interests` repeatable query params | `ProfileResponse[]`, capped at 50, no pagination |
| PUT | `/api/users/me` | Cookie | `UpdateProfileRequest` (all fields optional — only non-null ones are applied) | `ProfileResponse` |
| POST | `/api/users/me/skills` | Cookie | `AddSkillRequest` | `SkillResponse`, `201` |
| DELETE | `/api/users/me/skills/{skillId}` | Cookie | — | `null` |
| POST | `/api/users/me/interests` | Cookie | `AddInterestRequest` | `InterestResponse`, `201` |
| DELETE | `/api/users/me/interests/{interestId}` | Cookie | — | `null` |
| GET | `/api/users/health` | Public | — | plain string |

**`UpdateProfileRequest`** ⚠️ (all optional, only sent fields change): `username, fullName, bio, avatarUrl, experienceLevel, portfolioUrl, linkedinUrl, githubUsername, isOpenToCollaborate, activityStatus`

**`AddSkillRequest`** ⚠️: `skillName` (required — duplicate names rejected with `400`), `proficiencyLevel` (optional, defaults to `"BEGINNER"`), `yearsOfExperience` (optional, defaults to `0`)

**`AddInterestRequest`** ⚠️: `interestName` (required — duplicates rejected)

**`ProfileResponse`** ✅ (from `buildProfileResponse`):
```json
{
  "id": "uuid", "userId": "uuid", "username": "string", "fullName": "string",
  "bio": "string", "avatarUrl": "string", "experienceLevel": "string",
  "portfolioUrl": "string", "linkedinUrl": "string", "githubUsername": "string",
  "isOpenToCollaborate": true, "activityStatus": "string",
  "skills": [{ "id": "uuid", "skillName": "string", "proficiencyLevel": "string", "yearsOfExperience": 0 }],
  "interests": [{ "id": "uuid", "interestName": "string" }],
  "createdAt": "instant"
}
```

`experienceLevel` defaults to `"BEGINNER"` and `activityStatus` to `"ACTIVE"` on profile auto-creation (fired by the `user.registered` Kafka event, so a profile exists moments after registration — no explicit "create profile" endpoint).

🚫 The actual allowed string values for `experienceLevel` / `activityStatus` / `proficiencyLevel` aren't enforced as a Java enum anywhere visible — they're free-text columns. Worth asking your backend teammate for the agreed value set (e.g. is it `BEGINNER/INTERMEDIATE/ADVANCED`?) so the frontend dropdown matches exactly.

---

## 3. project-service — gateway `/api/projects/**` and `/api/tasks/**` ✅ Fully confirmed

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/api/projects` | Cookie | `CreateProjectRequest` | `ProjectResponse`, `201` — creator is auto-added as `LEADER`, no invitation needed |
| PUT | `/api/projects/{id}` | Cookie, **LEADER only** | `UpdateProjectRequest` (all optional) | `ProjectResponse` |
| DELETE | `/api/projects/{id}` | Cookie, **LEADER only** | — | `null` (soft delete) |
| GET | `/api/projects/{id}` | **Public** | — | `ProjectResponse` |
| GET | `/api/projects/my` | Cookie | — | `ProjectResponse[]` — projects the caller is a member of |
| POST | `/api/projects/{id}/invitations` | Cookie, **LEADER only** | `InviteMemberRequest` | `ProjectInvitationResponseDto` — `400` if already a member or already has a pending invite |
| PUT | `/api/projects/invitations/{invitationId}/accept` | Cookie, **invitee only** | — | `ProjectMemberResponseDto` — `400` if expired (auto-marked `EXPIRED`) or project is full |
| PUT | `/api/projects/invitations/{invitationId}/reject` | Cookie, **invitee only** | — | `ProjectInvitationResponseDto` |
| GET | `/api/projects/invitations/pending` | Cookie | — | `ProjectInvitationResponseDto[]` — invitations addressed to the caller |
| DELETE | `/api/projects/{id}/members/{memberUserId}` | Cookie, **self (leave) or LEADER (remove)** | — | `null` — `400` if target is the LEADER (must transfer leadership or delete project first) |
| PUT | `/api/projects/{id}/members/{memberUserId}/role` | Cookie, **LEADER only** | `ChangeRoleRequest { role }` | `ProjectMemberResponseDto` |
| GET | `/api/projects/{id}/members` | **Public** | — | `ProjectMemberResponseDto[]` |
| GET | `/api/projects/{id}/members/{userId}/check` | **Public** | — | `MembershipCheckResponse { isMember: boolean, role: string|null }` |
| GET | `/api/projects/health` | Public | — | plain string |

**`CreateProjectRequest`** ✅: `name, description, githubRepoUrl, visibility (optional, defaults "PRIVATE"), techStack, maxMembers (optional, defaults 10)`

**`UpdateProjectRequest`** ✅ (all optional, only non-null applied): `name, description, githubRepoUrl, techStack, maxMembers, status, visibility`

**`InviteMemberRequest`** ✅: `invitedUserId (required), role (optional, defaults "CONTRIBUTOR")`. Invitations expire after **7 days** (server-computed, not client-settable).

**`ChangeRoleRequest`** ✅: `{ role }`

**Valid `role` values:** `LEADER`, `CONTRIBUTOR`, `REVIEWER` — anything else is `400`. Only one LEADER model enforced here implicitly (the removeMember guard), though nothing stops `changeRole` from creating a second LEADER — worth a sanity check with your backend teammate if the UI assumes exactly one leader.
**Valid `status` values:** `ACTIVE`, `COMPLETED`, `ARCHIVED`.
**Valid `visibility` values:** `PUBLIC`, `PRIVATE`.

**`ProjectResponse`** ✅:
```json
{
  "id": "uuid", "ownerUserId": "uuid", "name": "string", "description": "string",
  "githubRepoUrl": "string", "status": "ACTIVE|COMPLETED|ARCHIVED", "visibility": "PUBLIC|PRIVATE",
  "techStack": "string or array — same type as stored, check Project model if unsure",
  "maxMembers": 10, "memberCount": 1, "createdAt": "instant"
}
```
`memberCount` is computed live on every response (a DB count query), not denormalized/cached.

**`ProjectMemberResponseDto`** ✅: `{ id, projectId, userId, role, joinedAt, invitedByUserId }`

**`ProjectInvitationResponseDto`** ✅: `{ id, projectId, invitedUserId, invitedByUserId, role, status, expiresAt, respondedAt, createdAt }`. `status` progresses `PENDING → ACCEPTED|REJECTED|EXPIRED`.

### Tasks — `/api/projects/{projectId}/tasks/**` ✅ Fully confirmed (real `TaskService.java` was provided)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/projects/{projectId}/tasks` | Cookie, **LEADER role only** | `CreateTaskRequest` | `403` if not LEADER |
| PUT | `/api/projects/{projectId}/tasks/{taskId}` | Cookie, **LEADER only** | `UpdateTaskRequest` (all fields optional) | |
| PUT | `/api/projects/{projectId}/tasks/{taskId}/status` | Cookie, **assignee or LEADER** | `ChangeTaskStatusRequest` | |
| DELETE | `/api/projects/{projectId}/tasks/{taskId}` | Cookie, **LEADER only** | — | soft delete |
| GET | `/api/projects/{projectId}/tasks/{taskId}` | Public | — | |
| GET | `/api/projects/{projectId}/tasks?status=` | Public | `status` optional query param | |
| GET | `/api/tasks/my` | Cookie | — | tasks assigned to the caller, across all projects |

**`CreateTaskRequest`** ✅: `title, description, assignedToUserId (optional — must be an existing project member or 400), priority (optional, defaults "MEDIUM"), dueDate, position (optional, defaults 0)`. New tasks always start with `status: "TODO"`.

**`UpdateTaskRequest`** ✅ (all optional, only non-null applied): `title, description, dueDate, priority, assignedToUserId`

**`ChangeTaskStatusRequest`** ✅: `status` (required), `position` (optional — for drag-and-drop board reordering)

**Valid `status` values:** `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` — anything else is `400`.
**Valid `priority` values:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

**`TaskResponse`** ✅:
```json
{
  "id": "uuid", "projectId": "uuid", "createdByUserId": "uuid", "assignedToUserId": "uuid|null",
  "title": "string", "description": "string", "status": "TODO|IN_PROGRESS|REVIEW|DONE",
  "priority": "LOW|MEDIUM|HIGH|URGENT", "dueDate": "date", "completedAt": "instant|null",
  "position": 0, "createdAt": "instant", "updatedAt": "instant"
}
```
`completedAt` is auto-set when status moves to `DONE` and auto-cleared if moved away from `DONE`.

### Task comments — `/api/projects/{projectId}/tasks/{taskId}/comments` ✅

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `.../comments` | Cookie, any project member | `CreateTaskCommentRequest { content }` | `201` |
| PUT | `.../comments/{commentId}` | Cookie, **author only** | `UpdateTaskCommentRequest { content }` | `403` otherwise |
| DELETE | `.../comments/{commentId}` | Cookie, **author or LEADER** | — | |
| GET | `.../comments` | Public | — | ordered oldest → newest |

**`TaskCommentResponse`** ✅: `{ id, taskId, authorUserId, content, isEdited, editedAt, createdAt }`

### Project resources / workspace file sharing ✅ (implemented — see codebase patch)

**Link-based, not binary upload** — members paste a URL (Google Drive, Figma, a hosted file,
a GitHub folder, etc.); the service stores metadata about the link, not the file itself.

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/api/projects/{projectId}/resources` | Cookie, any project member | `CreateResourceRequest { name, url, description?, resourceType? }` | `ResourceResponse`, `201` |
| DELETE | `/api/projects/{projectId}/resources/{resourceId}` | Cookie, **uploader or LEADER** | — | `null` (soft delete) |
| GET | `/api/projects/{projectId}/resources` | **Public** | — | `ResourceResponse[]`, newest first |

**`CreateResourceRequest`**: `name` (required), `url` (required), `description` (optional), `resourceType` (optional, defaults `"LINK"`)
**Valid `resourceType` values:** `LINK`, `DOCUMENT`, `DESIGN`, `OTHER`
**`ResourceResponse`**: `{ id, projectId, uploadedByUserId, name, url, description, resourceType, createdAt }`

---

## 4. social-service — gateway `/api/social/**` ✅

| Method | Path | Body | Response `data` | Notes |
|---|---|---|---|---|
| POST | `/api/social/connections/request` | `{ receiverUserId }` | `ConnectionResponseDto` | `400` if sending to self or an active (non-rejected) connection already exists |
| PUT | `/api/social/connections/{id}/accept` | — | `ConnectionResponseDto` | receiver only, `403` otherwise |
| PUT | `/api/social/connections/{id}/reject` | — | `ConnectionResponseDto` | receiver only |
| PUT | `/api/social/connections/{id}/block` | — | `ConnectionResponseDto` | either party |
| DELETE | `/api/social/connections/{id}` | — | `null` | soft delete, either party |
| GET | `/api/social/connections` | — | `ConnectionSummaryDto[]` | accepted connections only |
| GET | `/api/social/connections/pending` | — | `ConnectionResponseDto[]` | requests *received* by caller, status `PENDING` |
| GET | `/api/social/connections/status/{userId}` | — | `{ status }` | `status` is `NONE` if no row exists |

**`ConnectionResponseDto`** ✅: `{ id, senderUserId, receiverUserId, status, respondedAt, createdAt }`
**`ConnectionSummaryDto`** ✅: `{ connectionId, otherUserId, connectedSince }`
**Status values:** `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`, `NONE` (status-check-only, not persisted).

⚠️ No Kafka events published by this service yet (per original notes) — connection activity won't trigger notifications.

---

## 5. discovery-service — gateway `/api/discovery/**` ⚠️

| Method | Path | Auth | Params | Response `data` |
|---|---|---|---|---|
| GET | `/api/discovery/search?skills=&experienceLevel=&interests=&openToCollaborate=` | Cookie | same filters as user-profile's `/search` | `ProfileSearchResult[]` 🚫 shape unknown — proxies user-profile-service live, capped at 50, and logs the query to search history |
| GET | `/api/discovery/search/history` | Cookie | — | `SearchHistoryResponseDto[]` ✅ |
| GET | `/api/discovery/health` | Public | — | plain string |

**`SearchHistoryResponseDto`** ✅: `{ id, searchQuery, filtersUsed: object, resultsCount, createdAt }`

### Match scores — `/api/discovery/match-scores`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/discovery/match-scores` | **No JWT check** — meant for an internal ML service, not the frontend | `UpsertMatchScoreRequest` | Don't call this from the app |
| GET | `/api/discovery/match-scores/top?limit=10` | Cookie | — | `MatchScoreResponseDto[]`, capped at 50 |
| GET | `/api/discovery/match-scores/{matchedUserId}` | Cookie | — | `MatchScoreResponseDto`, `404` if none computed yet |

**`MatchScoreResponseDto`** ✅: `{ id, userId, matchedUserId, skillScore, experienceScore, activityScore, interestScore, totalMatchScore, lastCalculatedAt }`. Note: **the actual ML scoring model doesn't exist yet** — this is read/write plumbing only, so `/top` and `/{matchedUserId}` may return empty/404 until someone runs the offline job.

---

## 6. github-sync-service — gateway `/api/github/**` ✅

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/api/github/connect` | Cookie | `{ accessToken }` (a GitHub personal access token the user provides — 🚫 the OAuth flow to obtain it isn't in this controller) | `GithubProfileResponseDto` |
| POST | `/api/github/sync` | Cookie | — | `{ repositoriesSynced, message }` — `404`-style error if not connected yet |
| GET | `/api/github/profile` | Cookie | — | `GithubProfileResponseDto` |
| GET | `/api/github/repositories` | Cookie | — | `RepositoryResponseDto[]` |
| GET | `/api/github/repositories/{repositoryId}/commit-stats` | **Public** | — | `CommitStatResponseDto` |

**`GithubProfileResponseDto`** ✅: `{ githubUsername, avatarUrl, bio, publicReposCount, followersCount, followingCount, lastSyncedAt }`
**`RepositoryResponseDto`** ✅: `{ id, repoName, repoFullName, repoUrl, primaryLanguage, starsCount, forksCount, isPrivate, isForked, lastPushedAt }`
**`CommitStatResponseDto`** ✅: `{ totalCommits, commitsLast30Days, commitsLast7Days, lastCommitAt }`

`connect` requires a **real GitHub personal access token from the user** (not an OAuth code) — the frontend needs some UI to collect this (e.g. "paste your GitHub token" or a proper OAuth flow that isn't wired up here yet). Worth confirming with your backend teammate which one they intend.

---

## 7. contribution-service — gateway `/api/contributions/**` ✅

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| GET | `/api/contributions/projects/{projectId}/users/{userId}` | Public | — | `ContributionScoreResponse` (returns a zeroed object, not 404, if no score row exists yet) |
| GET | `/api/contributions/projects/{projectId}/leaderboard` | Public | — | `ContributionScoreResponse[]`, sorted highest first |
| GET | `/api/contributions/projects/{projectId}/users/{userId}/events` | Public | — | `ContributionEventResponse[]`, newest first |
| POST | `/api/contributions/projects/{projectId}/repository-links` | Cookie | `{ repositoryId }` | `RepositoryLinkResponse`, `201` |
| DELETE | `/api/contributions/projects/{projectId}/repository-links/{repositoryId}` | — | — | `null` |
| GET | `/api/contributions/projects/{projectId}/repository-links` | — | — | `RepositoryLinkResponse[]` |

**`ContributionScoreResponse`** ✅: `{ userId, projectId, tasksCompleted, tasksReviewed, messagesSent, commitsCount, filesShared, totalScore, lastCalculatedAt }`
**`ContributionEventResponse`** ✅: `{ id, userId, projectId, eventType, pointsAwarded, referenceId, referenceType, description, createdAt }`
**`RepositoryLinkResponse`** ✅: `{ id, projectId, userId, repositoryId, lastKnownTotalCommits }`

This service has **no manual score-entry endpoint** — everything under `tasksCompleted`/`commitsCount`/`messagesSent`/`totalScore` updates only via Kafka consumption of task completions, GitHub syncs, and project messages. Known gap: `tasksReviewed` and `filesShared` columns exist but nothing increments them yet — they'll always read `0`.

---

## 8. notification-service — gateway `/api/notifications/**` ✅

| Method | Path | Params | Response `data` |
|---|---|---|---|
| GET | `/api/notifications?before=&limit=&unreadOnly=` | `limit` defaults 20, capped 1–100; `before` is an ISO instant cursor | `NotificationPageResponse` |
| GET | `/api/notifications/unread-count` | — | `{ count }` |
| PATCH | `/api/notifications/{id}/read` | — | `NotificationResponse` |
| PATCH | `/api/notifications/read-all` | — | `{ updatedCount: number }` |
| DELETE | `/api/notifications/{id}` | — | `null` (soft delete) |

**`NotificationPageResponse`** ✅: `{ notifications: NotificationResponse[], nextCursor: instant|null, hasMore: boolean }`

**`NotificationResponse`** ⚠️ (built via a static `.from(notification)` I don't have the body of, but every field it could plausibly need is set in `NotificationService.create`): `{ id, recipientUserId, senderUserId, type, title, body, referenceId, referenceType, isRead, readAt, createdAt }`

**`type`** is one of (from `NotificationType` constants — this is the real enforced set):
`WELCOME, PROJECT_CREATED, PROJECT_INVITATION, PROJECT_MEMBER_JOINED, PROJECT_MEMBER_REMOVED, TASK_CREATED, TASK_ASSIGNED, TASK_STATUS_CHANGED, TASK_COMPLETED, MESSAGE_RECEIVED, GITHUB_SYNC_COMPLETED`

**`referenceType`** (from `ReferenceType` constants): `PROJECT, TASK, INVITATION, CONVERSATION, USER`

There's **no POST endpoint** to create a notification manually — it's Kafka-consumer-only. ⚠️ Known gap: `task.comment.added` isn't consumed yet, so commenting on a task never generates a notification. ⚠️ On first boot, the consumer group replays full Kafka history (`auto.offset.reset=earliest`) — expect a burst of backdated notifications the first time this service starts, not just going forward.

---

## 9. messaging-service — gateway `/api/conversations/**`, `/api/messages/**`, WebSocket `/ws` ✅

### REST

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/api/conversations/direct` | Cookie | `{ targetUserId }` | `ConversationResponse`, `201` (find-or-create — calling twice with the same pair returns the existing conversation) |
| GET | `/api/conversations/my` | Cookie | — | `ConversationResponse[]`, sorted by most recent activity |
| GET | `/api/conversations/{id}` | Cookie | — | `ConversationResponse` |
| PUT | `/api/conversations/{id}/read` | Cookie | — | `null` |
| PUT | `/api/conversations/{id}/mute` | Cookie | — | `null` |
| PUT | `/api/conversations/{id}/unmute` | Cookie | — | `null` |
| GET | `/api/conversations/{conversationId}/messages?before=&limit=` | Cookie | `before` ISO instant cursor, `limit` default 50 / max 100 | `MessagePageResponse` |
| PUT | `/api/messages/{id}` | Cookie, **sender only** | `{ content }` | `MessageResponse` |
| DELETE | `/api/messages/{id}` | Cookie, **sender only** | — | `null` (soft delete) |
| GET | `/api/conversations/health` | Public | — | plain string |

⚠️ There is **no REST "send message" endpoint** — sending only happens over WebSocket (below). Use REST purely for initial history load, listing conversations, and edit/delete.

**`ConversationResponse`** ✅:
```json
{
  "id": "uuid", "type": "DIRECT|PROJECT", "projectId": "uuid|null", "createdByUserId": "uuid",
  "lastMessageAt": "instant|null", "lastMessagePreview": "string|null",
  "participants": [{ "userId": "uuid", "lastReadAt": "instant|null", "isMuted": false }],
  "createdAt": "instant"
}
```
**`MessageResponse`** ✅: `{ id, conversationId, senderUserId, content, messageType, fileUrl, fileName, isEdited, editedAt, createdAt }`
**`MessagePageResponse`** ✅: `{ messages: MessageResponse[], hasMore: boolean }`
**`messageType`** valid values: `TEXT, FILE, IMAGE, SYSTEM` (defaults to `TEXT` if omitted).

For `PROJECT`-type conversations, access is checked **live against project-service on every request** — removing someone from a project revokes their chat access immediately, even before any local cleanup runs. `PROJECT` conversations auto-create via the `project.created` Kafka event; members are added/removed via `member.joined`/`member.removed` events.

### WebSocket (STOMP over raw WebSocket, no SockJS)

Connect to `ws://localhost:8080/ws` (through the gateway) or directly to `:8086/ws`. The handshake is JWT-cookie-validated (`JwtHandshakeInterceptor`) — same `access_token` cookie as REST, so log in via REST first, then open the socket.

**Client sends to:**
| Destination | Payload | Effect |
|---|---|---|
| `/app/conversations/{conversationId}/send` | `SendMessageRequest ⚠️ { content, messageType?, fileUrl?, fileName? }` | Validates access, saves, broadcasts to the conversation topic, no direct reply — listen on the topic below |
| `/app/conversations/{conversationId}/typing` | `TypingEvent ⚠️ { typing: boolean }` | Validates access, broadcasts typing state |

**Client subscribes to:**
| Topic | Payload | When |
|---|---|---|
| `/topic/conversations/{conversationId}` | `ConversationEvent { eventType: "MESSAGE_NEW"\|"MESSAGE_EDITED"\|"MESSAGE_DELETED", message: MessageResponse }` | New message (via WS or the REST edit/delete endpoints — same channel either way) |
| `/topic/conversations/{conversationId}/typing` | `TypingBroadcast { conversationId, userId, typing }` | Someone starts/stops typing |
| `/topic/presence` | `PresenceBroadcast { userId, status: "ONLINE"\|"OFFLINE" }` | Any tracked user's online status changes (fires once per user, not per session/tab) |
| `/user/queue/errors` | plain string (exception message) | Your own `send`/`typing` frame failed server-side — subscribe to this or failures are silent |

⚠️ Presence is **in-memory, per-instance** — fine for one messaging-service instance, but if it's ever scaled horizontally, presence state won't be shared across instances until that's moved to Redis. Not your problem as a frontend dev, just don't be surprised if presence looks flaky under load-balancing later.

---

## Cross-cutting notes worth building around

- **Soft deletes everywhere** — every "delete" is a flag flip, not a real removal. Already-fetched IDs you're holding client-side will 404 correctly on next fetch, but don't assume a `DELETE` response means the row is gone from some other cached list you're holding — re-fetch.
- **UUIDs everywhere** — every ID (`userId`, `projectId`, `taskId`, etc.) is a UUID string, not a numeric ID.
- **Public GETs are genuinely public** — `GET /api/projects/{id}`, `GET /api/projects/{id}/members`, `GET /api/users/{username}`, `GET /api/users/search`, task reads, and contribution/leaderboard reads work with **no cookie at all**. Don't gate these behind a login check in the frontend if you don't need to.
- **Cookie-gated LEADER-only actions fail with `403`, not a hidden UI state** — if you're building a Kanban board, still hide leader-only controls for non-leaders client-side, but don't rely on that as your only guard; the API will reject it either way.
