/**
 * githubApi — real calls to github-sync-service.
 *
 * This talks directly to the Spring Boot backend, matching what's actually
 * implemented in GithubSyncController / GithubConnectRequestDto /
 * GithubProfileResponseDto / RepositoryResponseDto / CommitStatResponseDto /
 * SyncResultDto / ApiResponse. There is no mock layer for this module.
 *
 * Endpoints (all under /api/github; auth is an httpOnly JWT cookie read
 * server-side by JwtCookieExtractor, so no Authorization header is sent here):
 *   POST /api/github/connect                                  { accessToken } -> GithubProfileResponseDto
 *   POST /api/github/sync                                                    -> SyncResultDto
 *   GET  /api/github/profile                                                 -> GithubProfileResponseDto
 *   GET  /api/github/repositories                                            -> RepositoryResponseDto[]
 *   GET  /api/github/repositories/{repositoryId}/commit-stats                -> CommitStatResponseDto
 *
 * That's the full surface the backend exposes, so that's the full surface
 * here too — no disconnect, no branches/PRs/issues/activity-feed calls, no
 * per-project repository linking (none of that exists in this controller).
 *
 * ⚠️ Assumptions — please confirm/adjust once more of the backend is shared:
 *  - Base URL: requests go to a relative `/api/github/...` path, which only
 *    resolves correctly if the frontend is served through the same
 *    gateway/origin as the API (or a dev-server proxy rewrites it). Set
 *    VITE_API_BASE_URL (see API_BASE below) if the gateway is on a different
 *    origin, and let me know if there's a routing/gateway config file to
 *    match instead of guessing.
 *  - Auth: every request sends `credentials: 'include'` so the browser
 *    attaches the httpOnly JWT cookie. If the cookie's name/domain or the
 *    gateway's CORS config doesn't allow credentialed cross-origin requests,
 *    every call here will fail with 401 — happy to adjust once I can see the
 *    auth/cookie and CORS setup.
 *  - Error shape: no global exception handler was included, so this assumes
 *    a failed call still comes back as the `ApiResponse` envelope
 *    (`success:false`, `message`) — possibly alongside a non-2xx status. A
 *    404 from GET /profile is treated as "no GitHub account connected yet"
 *    rather than a hard error (see `isNotConnectedError`); tell me if the
 *    backend signals "not connected" a different way (e.g. `success:false`
 *    with a specific message on a 200, or a different status code).
 *  - Connecting sends a pasted GitHub Personal Access Token (`accessToken`),
 *    matching GithubConnectRequestDto — there's no OAuth callback controller
 *    in what was shared. If GitHub sign-in also goes through an OAuth
 *    redirect elsewhere, point me at that controller and I'll wire it in
 *    instead of (or alongside) the token form.
 *  - LocalDateTime fields (lastSyncedAt, lastPushedAt, lastCommitAt) have no
 *    timezone in the DTOs. They're rendered with the browser's local time as
 *    if the string were already local — if the backend actually serializes
 *    them as UTC, times will be off by the viewer's UTC offset.
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? '';

/** Error type thrown by every function here. `status` is the HTTP status (0 = network error). */
export class GithubApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'GithubApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new GithubApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  // A 204 (or any body-less response) has nothing to unwrap.
  const raw = await response.text();
  let body = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      // Non-JSON body (e.g. an HTML error page from a proxy) — fall through
      // to the status-based error below.
    }
  }

  if (!response.ok || body?.success === false) {
    throw new GithubApiError(
      body?.message || `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return body?.data;
}

/**
 * Connect (or reconnect) the signed-in user's GitHub account.
 * @param accessToken  a GitHub Personal Access Token
 * @returns {Promise<object>} GithubProfileResponseDto
 */
export function connectGithub(accessToken) {
  return request('/api/github/connect', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });
}

/**
 * Trigger a sync of the connected account's repositories.
 * @returns {Promise<object>} SyncResultDto { repositoriesSynced, message }
 */
export function syncGithub() {
  return request('/api/github/sync', { method: 'POST' });
}

/**
 * The signed-in user's connected GitHub profile.
 * Rejects with a 404 GithubApiError (see isNotConnectedError) if nothing is connected yet.
 * @returns {Promise<object>} GithubProfileResponseDto
 */
export function getGithubProfile() {
  return request('/api/github/profile');
}

/**
 * The connected account's synced repositories.
 * @returns {Promise<Array>} RepositoryResponseDto[]
 */
export function getGithubRepositories() {
  return request('/api/github/repositories');
}

/**
 * Commit stats for one repository.
 * @returns {Promise<object>} CommitStatResponseDto
 */
export function getRepositoryCommitStats(repositoryId) {
  return request(`/api/github/repositories/${repositoryId}/commit-stats`);
}

/** True when an error from getGithubProfile just means "not connected yet", not a real failure. */
export function isNotConnectedError(error) {
  return error instanceof GithubApiError && error.status === 404;
}