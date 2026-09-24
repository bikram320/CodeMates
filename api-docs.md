# CodeMates Backend API Documentation

Generated from the uploaded source code of the gateway and 8 backend services.

**Legend**
- `†` = field/behavior **inferred** from service code because the DTO/config class was not uploaded. Verify against the real class.
- 🔒 = requires a valid `access_token` cookie (enforced by the gateway, and again by each service).
- 🌐 = public (no cookie needed at the gateway).

---

## 1. Overview

| Service | Base path | Purpose |
|---|---|---|
| API Gateway | (all `/api/**`, `/ws`) | JWT fail-fast check, adds `X-User-Id` header |
| auth-service | `/api/auth` | Register, login, refresh, logout, password reset, GitHub OAuth |
| user-profile-service | `/api/users` | Profiles, skills, interests, profile search |
| project-service | `/api/projects`, `/api/tasks` | Projects, members, invitations, tasks, comments, resources |
| social-service | `/api/social/connections` | Developer-to-developer connections |
| messaging-service | `/api/conversations`, `/api/messages`, WebSocket `/ws` | Direct + project chat |
| notification-service | `/api/notifications` | In-app notifications (+ email) |
| discovery-service | `/api/discovery` | Developer search, search history, match scores |
| github-sync-service | `/api/github` | Connect GitHub, sync repos and commit stats |
| contribution-service | `/api/contributions` | Contribution scores, leaderboard, repo links |

**Base URL:** the gateway origin (e.g. `https://<gateway-host>`). All REST paths below are relative to it.

---

## 2. Conventions

### 2.1 Authentication (cookie-based JWT)

Auth is done with **HttpOnly cookies**, not the `Authorization` header. Browser clients must send requests with credentials (`fetch(..., { credentials: "include" })`).

| Cookie | Path | Lifetime | Notes |
|---|---|---|---|
| `access_token` | `/` | `jwt.expiration` ms | HS256 JWT. `sub` = userId (UUID), claim `email`. |
| `refresh_token` | `/api/auth/refresh` | `jwt.refresh-expiration` ms | Opaque random token (SHA-256 hashed in DB). Rotated on every refresh. |
| `oauth_state` | `/api/auth/github` | 300 s | CSRF state for GitHub OAuth. |

Both auth cookies are currently `Secure=false`; set `true` in production (HTTPS).

### 2.2 Gateway behavior

- `OPTIONS` (CORS preflight) requests pass through untouched.
- **Public paths** (no cookie needed): `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/github`, `/api/auth/github/callback`, `/api/auth/health`.
- Every other path requires a valid `access_token` cookie, otherwise:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"success":false,"message":"No access token cookie found","data":null}
```
(`message` can also be `"Invalid or expired access token"`. Note: this body has no `timestamp`.)
- On success the gateway adds `X-User-Id: <uuid>` to the downstream request. Services still validate the cookie themselves.

### 2.3 Response envelope

All services wrap responses in `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": { },
  "timestamp": "2026-09-21T10:15:30.123"
}
```
Errors use `success: false`, `data: null`.

### 2.4 Common types

- IDs are UUIDs. Timestamps are ISO-8601 (`Instant` → `2026-09-21T10:15:30Z`; `LocalDateTime` → no `Z`).
- Deletes are **soft deletes** (`isDeleted` flag) everywhere.
- Cursor pagination (messages, notifications): pass `before=<ISO timestamp>`; response has `hasMore`.

### 2.5 Errors (†)

The `@RestControllerAdvice` classes were not uploaded, so exact HTTP codes are inferred from exception names. Expect roughly:

| Exception | Likely status |
|---|---|
| Validation failure (`@Valid`) | 400 |
| `IllegalArgumentException` (invalid enum value, duplicate skill/interest, username taken) | 400 |
| `*NotFoundException` | 404 |
| `Unauthorized*ActionException`, `NotConversationParticipantException` | 403 |
| `InvalidTokenException` (auth) | 401 |
| `UserAlreadyExistsException`, `DuplicateRepositoryLinkException`, `ConnectionAlreadyExistsException` | 409 |
| `Invalid*StateException` | 400 / 409 |

---

## 3. auth-service — `/api/auth`

### POST `/api/auth/register` 🌐
Create a LOCAL account, publish `user.registered` Kafka event, set cookies.

Request:
```json
{ "email": "a@b.com", "password": "min8chars", "username": "alice", "fullName": "Alice Doe" }
```
| Field | Rules |
|---|---|
| email | required, valid email |
| password | required, ≥ 8 chars |
| username | required, 3–50 chars, must be unique |
| fullName | required |

Response `201`: sets `access_token` + `refresh_token` cookies.
```json
{ "success": true, "message": "Registration successful",
  "data": { "userId": "uuid", "email": "a@b.com", "authProvider": "LOCAL" } }
```
Errors: email already registered / username taken (`UserAlreadyExistsException`).

### POST `/api/auth/login` 🌐
Request: `{ "email": "...", "password": "..." }` (both required, email must be valid).
Response `200`: same `data` shape as register, message `"Login successful"`, cookies set.
Errors: `"Invalid email or password"`, `"Account is deactivated"` (`InvalidTokenException`).

### POST `/api/auth/refresh` 🌐
No body. Reads the `refresh_token` cookie (browser only sends it to this exact path). Revokes the old refresh token, issues new access + refresh cookies (**rotation**).
Response `200`: `{ "message": "Token refreshed successfully", "data": null }`.
Errors: `401` `"Refresh token not found"` if cookie missing; `InvalidTokenException` if revoked/expired/unknown.

### POST `/api/auth/logout` 🔒
No body. Revokes the refresh token (if the cookie is present) and clears both cookies. Response `200`: `"Logged out successfully"`.

### POST `/api/auth/logout-all` 🔒
Revokes **all** refresh tokens for the current user and clears cookies. Response `200`: `"Logged out from all devices"`.

### POST `/api/auth/forgot-password` 🌐
Request: `{ "email": "a@b.com" }`.
Always returns `200` with `"If this email is registered you will receive a reset link"` (does not reveal whether the email exists).
- Rate limit: `app.password-reset.max-requests-per-hour` (default **3**) per email per hour (Redis); over the limit silently does nothing.
- Reset token: UUID stored in Redis for **15 minutes**; emailed asynchronously as `<frontend.reset-password-url>?token=<token>`.

### POST `/api/auth/reset-password` 🌐
Request: `{ "token": "uuid-from-email", "newPassword": "min8chars" }`.
Response `200`: `"Password reset successful"`; token is deleted (single use), all refresh tokens revoked, cookies cleared.
Errors: `"Password reset token is invalid or expired"`.

### GET `/api/auth/github` 🌐
Browser redirect (not a JSON API — use as a link `href`). Sets `oauth_state` cookie and responds `302` to GitHub's authorize URL (scopes `read:user user:email`).

### GET `/api/auth/github/callback?code=...&state=...` 🌐
Called by GitHub. Validates `state` against the cookie, exchanges the code, finds/creates the user **by email** (username collisions get a numeric suffix), sets auth cookies and responds `302`:
- Success → `frontend.oauth-success-redirect`
- Failure → `frontend.oauth-failure-redirect?error=<code>` where code is `state_mismatch`, `no_verified_email`, or `oauth_failed`.

### GET `/api/auth/health` 🌐
`200` `"Auth service is running"`.

---

## 4. user-profile-service — `/api/users`

All authenticated endpoints read the user from the `access_token` cookie.

**ProfileResponse**
```json
{
  "id": "uuid", "userId": "uuid", "username": "alice", "fullName": "Alice Doe",
  "bio": "...", "avatarUrl": "...", "experienceLevel": "BEGINNER",
  "portfolioUrl": "...", "linkedinUrl": "...", "githubUsername": "...",
  "isOpenToCollaborate": true, "activityStatus": "ACTIVE",
  "skills": [ { "id": "uuid", "skillName": "Java", "proficiencyLevel": "BEGINNER", "yearsOfExperience": 0 } ],
  "interests": [ { "id": "uuid", "interestName": "AI" } ],
  "createdAt": "..."
}
```
A profile is auto-created (`experienceLevel=BEGINNER`, `activityStatus=ACTIVE`, `isOpenToCollaborate=true`) when the `user.registered` event is consumed.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | 🔒 | Own profile |
| PUT | `/api/users/me` | 🔒 | Partial update (null fields ignored) |
| GET | `/api/users/{username}` | 🔒 | Public profile by username |
| GET | `/api/users/search` | 🔒* | Search (used by discovery-service) |
| POST | `/api/users/me/skills` | 🔒 | Add skill → `201` |
| DELETE | `/api/users/me/skills/{skillId}` | 🔒 | Remove skill |
| POST | `/api/users/me/interests` | 🔒 | Add interest → `201` |
| DELETE | `/api/users/me/interests/{interestId}` | 🔒 | Remove interest |
| GET | `/api/users/health` | 🔒 | Health |

\* The controller comment says "public, no auth", but `/api/users/search` is **not** in the gateway's public list, so via the gateway it needs the cookie.

**PUT `/api/users/me`** body (all optional, `UpdateProfileRequest` †):
`username, fullName, bio, avatarUrl, experienceLevel, portfolioUrl, linkedinUrl, githubUsername, isOpenToCollaborate, activityStatus`. Error if `username` is taken by another user.

**POST `/api/users/me/skills`** body †: `{ "skillName": "Java", "proficiencyLevel": "BEGINNER", "yearsOfExperience": 2 }` — `proficiencyLevel` defaults `BEGINNER`, `yearsOfExperience` defaults `0`. Duplicate skill name → error.

**POST `/api/users/me/interests`** body †: `{ "interestName": "AI" }`. Duplicate → error.

**GET `/api/users/search`** query params (all optional, combinable):
| Param | Type | Notes |
|---|---|---|
| `skills` | list | matches profiles having **any** of the skills (exact name) |
| `interests` | list | matches profiles having **any** of the interests |
| `experienceLevel` | string | exact match |
| `openToCollaborate` | boolean | |

Different filters are AND-ed. Max **50** results, no pagination. Returns `List<ProfileResponse>`.

> Reserved words: `me`, `search`, `health` are matched as literal paths before `/{username}`, so those usernames can't be fetched via `/api/users/{username}`.

---

## 5. project-service — `/api/projects`, `/api/tasks`

Roles: project members have a role; `LEADER` is required for management actions (other role names are defined in `ProjectService`, which was not included in the uploaded documents †).
Task statuses: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`. Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

### 5.1 Projects

| Method | Path | Description |
|---|---|---|
| POST | `/api/projects` | Create project (`CreateProjectRequest` †) → `201`, `ProjectResponse` |
| PUT | `/api/projects/{id}` | Update (`UpdateProjectRequest` †) |
| DELETE | `/api/projects/{id}` | Delete |
| GET | `/api/projects/{id}` | Get project |
| GET | `/api/projects/my` | Projects of current user |
| POST | `/api/projects/{id}/invitations` | Invite member (`InviteMemberRequest` †) → `ProjectInvitationResponseDto` |
| PUT | `/api/projects/invitations/{invitationId}/accept` | Accept → `ProjectMemberResponseDto` |
| PUT | `/api/projects/invitations/{invitationId}/reject` | Reject → `ProjectInvitationResponseDto` |
| GET | `/api/projects/invitations/pending` | Pending invitations for current user |
| DELETE | `/api/projects/{id}/members/{memberUserId}` | Remove member |
| PUT | `/api/projects/{id}/members/{memberUserId}/role` | Change role, body `{ "role": "..." }` |
| GET | `/api/projects/{id}/members` | List members |
| GET | `/api/projects/{id}/members/{userId}/check` | Membership check → `MembershipCheckResponse` (used by messaging-service) |
| GET | `/api/projects/health` | Health |

> Request/response DTO fields for projects and invitations were not in the uploaded files; take them from the DTO classes.

### 5.2 Tasks — `/api/projects/{projectId}/tasks`

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/` | LEADER | Create task → `201` |
| PUT | `/{taskId}` | LEADER | Update core fields (null = unchanged) |
| PUT | `/{taskId}/status` | assignee or LEADER | Move task / change status |
| DELETE | `/{taskId}` | LEADER | Soft delete |
| GET | `/{taskId}` | any auth'd user | Get task |
| GET | `/?status=TODO` | any auth'd user | List tasks, optional status filter |
| GET | `/api/tasks/my` | 🔒 | All tasks assigned to me (all projects) |

**Create** body (`CreateTaskRequest`, † for which fields are `@NotBlank`):
```json
{ "title": "Build login page", "description": "...", "priority": "HIGH",
  "assignedToUserId": "uuid", "dueDate": "...", "position": 0 }
```
`priority` defaults to `MEDIUM`; status starts as `TODO`; assignee must be a project member.

**Update** body: `title, description, dueDate, priority, assignedToUserId` (only non-null applied).

**Change status** body: `{ "status": "DONE", "position": 3 }` (`position` optional). Setting `DONE` sets `completedAt` and publishes `task.completed`; moving out of DONE clears `completedAt`.

**TaskResponse**
```json
{ "id": "uuid", "projectId": "uuid", "createdByUserId": "uuid", "assignedToUserId": "uuid",
  "title": "...", "description": "...", "status": "TODO", "priority": "MEDIUM",
  "dueDate": "...", "completedAt": null, "position": 0, "createdAt": "...", "updatedAt": "..." }
```

### 5.3 Task comments — `/api/projects/{projectId}/tasks/{taskId}/comments`

| Method | Path | Who |
|---|---|---|
| POST | `/` | any project member → `201` |
| PUT | `/{commentId}` | author only |
| DELETE | `/{commentId}` | author or LEADER |
| GET | `/` | any auth'd user (ascending by time) |

Body: `{ "content": "..." }`.
**TaskCommentResponse**: `id, taskId, authorUserId, content, isEdited, editedAt, createdAt`.

### 5.4 Project resources — `/api/projects/{projectId}/resources`

| Method | Path | Who |
|---|---|---|
| POST | `/` | any project member → `201` |
| DELETE | `/{resourceId}` | uploader or LEADER |
| GET | `/` | any auth'd user (newest first) |

Body: `{ "name": "...", "url": "...", "description": "...", "resourceType": "LINK" }` — `resourceType` ∈ `LINK | DOCUMENT | DESIGN | OTHER`, default `LINK`.
**ResourceResponse**: `id, projectId, uploadedByUserId, name, url, description, resourceType, createdAt`.

---

## 6. social-service — `/api/social/connections`

Connection status values: `PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED` (`NONE` = no relationship, status endpoint only).

| Method | Path | Description |
|---|---|---|
| POST | `/request` | Body `{ "receiverUserId": "uuid" }`. Cannot target yourself. Fails if a non-`REJECTED` connection exists. |
| PUT | `/{id}/accept` | Receiver only, must be `PENDING`. Publishes connection-accepted event. |
| PUT | `/{id}/reject` | Receiver only, must be `PENDING`. |
| PUT | `/{id}/block` | Either party of the connection. |
| DELETE | `/{id}` | Either party. Soft delete. |
| GET | `/` | My accepted connections → `ConnectionSummaryDto[]` |
| GET | `/pending` | Pending requests where I'm the receiver |
| GET | `/status/{userId}` | `{ "status": "NONE" \| "PENDING" \| ... }` |

**ConnectionResponseDto**: `id, senderUserId, receiverUserId, status, respondedAt, createdAt`.
**ConnectionSummaryDto**: `connectionId, otherUserId, connectedSince`.

---

## 7. messaging-service

### 7.1 REST

| Method | Path | Description |
|---|---|---|
| POST | `/api/conversations/direct` | Body `{ "targetUserId": "uuid" }`. Find-or-create DIRECT conversation (returns `201` even if it already existed). Cannot chat with yourself. |
| GET | `/api/conversations/my` | My conversations, newest activity first |
| GET | `/api/conversations/{id}` | One conversation (access checked) |
| PUT | `/api/conversations/{id}/read` | Set my `lastReadAt` |
| PUT | `/api/conversations/{id}/mute` | Mute |
| PUT | `/api/conversations/{id}/unmute` | Unmute |
| GET | `/api/conversations/health` | Health |
| GET | `/api/conversations/{conversationId}/messages?before=&limit=` | History |
| PUT | `/api/messages/{id}` | Edit (sender only), body `{ "content": "..." }` |
| DELETE | `/api/messages/{id}` | Soft delete (sender only) |

**History** — `before` = ISO-8601 instant (optional), `limit` default 50, max 100. Response:
```json
{ "messages": [ /* MessageResponse, oldest → newest within the page */ ], "hasMore": true }
```
To load older pages, pass `before = messages[0].createdAt` of the current page.

**ConversationResponse**
```json
{ "id": "uuid", "type": "DIRECT|PROJECT", "projectId": null, "createdByUserId": "uuid",
  "lastMessageAt": "...", "lastMessagePreview": "first 120 chars…",
  "participants": [ { "userId": "uuid", "lastReadAt": "...", "isMuted": false } ],
  "createdAt": "..." }
```
**MessageResponse**: `id, conversationId, senderUserId, content, messageType, fileUrl, fileName, isEdited, editedAt, createdAt`.

**Access rules:** DIRECT → must be a local participant. PROJECT → live call to project-service on every access (removed members lose access immediately). PROJECT conversations are created from the `project.created` Kafka event.

### 7.2 WebSocket / STOMP

- **Endpoint:** `ws://<host>/ws` (plain WebSocket, no SockJS). Handshake authenticated by `JwtHandshakeInterceptor` (cookie-based †); STOMP frames additionally checked by `StompAuthChannelInterceptor`. Allowed origins currently `*` — restrict in production.
- **Application prefix:** `/app`. **Broker:** `/topic`, `/queue`.

| Direction | Destination | Payload |
|---|---|---|
| Send → | `/app/conversations/{conversationId}/send` | `SendMessageRequest`: `{ "content": "...", "messageType": "TEXT", "fileUrl": null, "fileName": null }` (`messageType` ∈ `TEXT, FILE, IMAGE, SYSTEM`, default `TEXT`) |
| Send → | `/app/conversations/{conversationId}/typing` | `TypingEvent`: `{ "typing": true }` † |
| Subscribe ← | `/topic/conversations/{conversationId}` | `ConversationEvent`: `{ "type": "MESSAGE_NEW" \| "MESSAGE_EDITED" \| "MESSAGE_DELETED", "message": MessageResponse }` † |
| Subscribe ← | `/topic/conversations/{conversationId}/typing` | `TypingBroadcast`: `{ conversationId, userId, typing }` † |
| Subscribe ← | `/topic/presence` | `PresenceBroadcast`: `{ "userId": "uuid", "status": "ONLINE" \| "OFFLINE" }` |
| Subscribe ← | `/user/queue/errors` | Plain string error message for failed send/typing frames |

Presence is in-memory per instance (multi-tab aware: OFFLINE only when the last session closes).

---

## 8. notification-service — `/api/notifications` 🔒

| Method | Path | Description |
|---|---|---|
| GET | `/?before=&limit=20&unreadOnly=false` | Paginated list (`limit` clamped 1–100) |
| GET | `/unread-count` | `UnreadCountResponse` († `{ "count": n }`) |
| PATCH | `/{id}/read` | Mark one read → `NotificationResponse` |
| PATCH | `/read-all` | `{ "updatedCount": n }` |
| DELETE | `/{id}` | Soft delete (owner only) |

**NotificationPageResponse**: `{ "notifications": [...], "nextCursor": "<ISO instant>|null", "hasMore": true }` — pass `nextCursor` as `before` for the next page.
**NotificationResponse** †: `id, recipientUserId, senderUserId, type, title, body, referenceId, referenceType, isRead, readAt, createdAt`.

Notifications are created by Kafka consumers (no create endpoint). Some also trigger an email using the address stored from `user.registered`.

**`type` values:** `WELCOME`, `PROJECT_CREATED`, `PROJECT_INVITATION`, `PROJECT_MEMBER_JOINED`, `PROJECT_MEMBER_REMOVED`, `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_COMPLETED`, `MESSAGE_RECEIVED`, `GITHUB_SYNC_COMPLETED`.
**`referenceType` values:** `PROJECT`, `TASK`, `INVITATION`, `CONVERSATION`, `USER`.

---

## 9. discovery-service — `/api/discovery` 🔒

| Method | Path | Description |
|---|---|---|
| GET | `/search` | Find developers (proxies user-profile search) and logs the search |
| GET | `/search/history` | My past searches, newest first |
| GET | `/health` | Health |
| POST | `/match-scores` | Upsert a match score for a user pair → `201` |
| GET | `/match-scores/top?limit=10` | My top matches (`limit` capped at 50) |
| GET | `/match-scores/{matchedUserId}` | Score between me and another user (404 if none) |

**GET `/search`** params (all optional): `skills` (list), `experienceLevel`, `interests` (list), `openToCollaborate`. Max 50 results. Returns `ProfileSearchResult[]` (same fields as ProfileResponse †).
**SearchHistoryResponseDto**: `{ id, searchQuery, filtersUsed: {..}, resultsCount, createdAt }`.

**POST `/match-scores`** body (`UpsertMatchScoreRequest` †):
```json
{ "userId": "uuid", "matchedUserId": "uuid",
  "skillScore": 80, "experienceScore": 60, "activityScore": 70, "interestScore": 50 }
```
Null scores become 0. `totalMatchScore = 0.40·skill + 0.20·experience + 0.20·activity + 0.20·interest` (2 decimals, HALF_UP). Intended for the future ML engine.
**MatchScoreResponseDto**: `id, userId, matchedUserId, skillScore, experienceScore, activityScore, interestScore, totalMatchScore, lastCalculatedAt`.

---

## 10. github-sync-service — `/api/github` 🔒

| Method | Path | Description |
|---|---|---|
| POST | `/connect` | Body `{ "accessToken": "<github token>" }` → `GithubProfileResponseDto` |
| POST | `/sync` | Refresh profile stats, repos and commit stats; publishes `github.commit.synced` → `SyncResultDto` |
| GET | `/profile` | Connected GitHub profile |
| GET | `/repositories` | My synced repositories |
| GET | `/repositories/{repositoryId}/commit-stats` | Commit stats for a repo |

**GithubProfileResponseDto**: `githubUsername, avatarUrl, bio, publicReposCount, followersCount, followingCount, lastSyncedAt`.
**SyncResultDto**: `{ "repositoriesSynced": 12, "message": "Sync completed" }`.
**RepositoryResponseDto**: `id, repoName, repoFullName, repoUrl, primaryLanguage, starsCount, forksCount, isPrivate, isForked, lastPushedAt`.
**CommitStatResponseDto**: `totalCommits, commitsLast30Days, commitsLast7Days, lastCommitAt`.

Errors: `GithubProfileNotFoundException` when no profile is connected (sync/profile) or no stats exist for the repo.

---

## 11. contribution-service — `/api/contributions` 🔒

| Method | Path | Description |
|---|---|---|
| GET | `/projects/{projectId}/users/{userId}` | Score for a user in a project (zeros if none yet) |
| GET | `/projects/{projectId}/leaderboard` | All scores, highest `totalScore` first |
| GET | `/projects/{projectId}/users/{userId}/events` | Scoring history, newest first |
| POST | `/projects/{projectId}/repository-links` | Body `{ "repositoryId": "uuid" }` → `201` `RepositoryLinkResponse` |
| DELETE | `/projects/{projectId}/repository-links/{repositoryId}` | Unlink |
| GET | `/projects/{projectId}/repository-links` | List links |

**ContributionScoreResponse**: `userId, projectId, tasksCompleted, tasksReviewed, messagesSent, commitsCount, filesShared, totalScore, lastCalculatedAt`.
**ContributionEventResponse**: `id, userId, projectId, eventType (TASK_COMPLETED | COMMIT | MESSAGE_SENT), pointsAwarded, referenceId, referenceType (TASK | REPOSITORY | MESSAGE), description, createdAt`.
**RepositoryLinkResponse**: `id, projectId, userId, repositoryId, lastKnownTotalCommits`.

**How scores are earned (Kafka-driven, no write endpoint):**
- `task.completed` → points by task priority (`ScoringProperties`); duplicate task events ignored.
- `github.commit.synced` → `commit points × new commits` since the link's `lastKnownTotalCommits` (linking starts counting from 0 for that repo).
- `message.sent` → only `PROJECT` conversation messages; points stop after `messageDailyCap` per user/project/day (UTC).

Duplicate link → `DuplicateRepositoryLinkException`; unknown link → `RepositoryLinkNotFoundException`.

---

## 12. Kafka events (inter-service)

| Topic | Producer | Consumers / effect |
|---|---|---|
| `user.registered` | auth-service (key = userId; `{userId,email,username,fullName,authProvider}`) | user-profile (create profile), notification (store contact, welcome) |
| `project.created` and member add/remove events | project-service | messaging (project conversation + participants), notification |
| `task.*` (created, assigned, status changed, completed) | project-service | notification; `task.completed` → contribution |
| `github.commit.synced` | github-sync-service | contribution |
| `message.sent` | messaging-service | contribution (and notification †) |
| connection request/accepted | social-service | notification |

Exact topic names other than `user.registered`, `task.completed`, `github.commit.synced`, `message.sent` are †.

---

## 13. Issues spotted while reading the code

1. **Logout doesn't revoke the refresh token in browsers.** The `refresh_token` cookie has `Path=/api/auth/refresh`, so the browser won't send it to `/api/auth/logout`; the server-side revoke is skipped (cookies are still cleared).
2. **Logout / logout-all sit behind the gateway auth check.** They aren't in `PUBLIC_PATHS`, so with an expired access token they return `401` before cookies are cleared. Clients should call `/refresh` first or the gateway list should be adjusted.
3. **`JwtCookieExtractor` cookie name** — the gateway source notes some service copies read `accessToken` instead of `access_token`; all copies must read `access_token`.
4. **`Secure=false` cookies** and `setAllowedOriginPatterns("*")` on `/ws` must be tightened for production.
5. **GitHub tokens stored in plaintext** (`GithubProfile.githubAccessToken`) — consider encrypting.
6. **Authorization gaps (no membership/ownership check in code shown):** `GET` task/comment/resource endpoints, contribution endpoints (including link/unlink), `GET /api/github/repositories/{id}/commit-stats`, and `POST /api/discovery/match-scores` (any logged-in user can write scores for any pair).
7. **GitHub login links by email.** An existing LOCAL account with the same email is logged in via GitHub. A public GitHub email from `/user` isn't guaranteed verified; consider requiring the verified primary email always.
8. **Task-completion points go to the user who changed the status** (`publishTaskCompleted(..., userId)`), which may be a LEADER rather than the assignee.
9. **`updateComment` doesn't verify** the comment belongs to the `taskId`/`projectId` in the URL.
10. **GitHub callback** declares `code` as required; if the user denies access GitHub sends `error=access_denied` with no `code`, causing a `400` instead of the failure redirect.
11. Username changes in user-profile are not synced back to auth-service's `username`.

---

*Missing source files (so marked †): project-service DTOs and `ProjectService`, `JwtCookieExtractor`, `JwtHandshakeInterceptor`, `StompAuthChannelInterceptor`, exception handlers, several request/response DTOs, `application.properties` values (ports, gateway routes).*