/**
 * src/api/githubApi.js
 *
 * Talks to github-sync-service (GithubSyncController) to let a user connect
 * their GitHub account and pull in the developer-skill data that
 * discovery-service's ML matching depends on (see MatchSyncService ->
 * GithubProfileClient -> GET /api/github/profiles/{userId}/skill-profile).
 *
 * Consumed by src/hooks/useGitHub.js (TanStack Query) — export names here
 * must match exactly what that hook imports: connectGithub, getGithubProfile,
 * getGithubRepositories, getRepositoryCommitStats, isNotConnectedError,
 * syncGithub.
 *
 * Endpoints used (all under /api/github; auth is the same httpOnly cookie
 * pattern as profileApi.js / authApi.js, read server-side, so no
 * Authorization header is sent here):
 *   POST /api/github/connect                                   GithubConnectRequestDto{accessToken} -> GithubProfileResponseDto
 *   POST /api/github/sync                                      (no body)                             -> SyncResultDto
 *   GET  /api/github/profile                                                                          -> GithubProfileResponseDto
 *   GET  /api/github/repositories                                                                     -> RepositoryResponseDto[]
 *   GET  /api/github/repositories/{repositoryId}/commit-stats                                         -> CommitStatResponseDto
 *
 * Why a pasted Personal Access Token, not another OAuth flow:
 *   GitHub *login* (see authApi.js's GITHUB_AUTH_URL) is a separate system --
 *   it authenticates the user in auth-service and never hands this frontend
 *   (or github-sync-service) a token to reuse. The clean long-term fix would
 *   be auth-service's own OAuth callback forwarding that token to
 *   github-sync-service server-to-server right after login, but that touches
 *   a backend file (the GitHub OAuth callback controller) not available
 *   here. A user-supplied PAT (github.com/settings/tokens, "repo" read
 *   scope) is the self-contained option that works today against the
 *   existing /connect endpoint.
 *
 * Error shape: same ApiResponse envelope as profileApi.js/authApi.js.
 * GithubProfileNotFoundException (for /profile and /repositories before a
 * user has connected) maps to a 404 -- see isNotConnectedError.
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
 * Connects (or reconnects) the signed-in user's GitHub account. This does
 * NOT pull repos by itself — call syncGithub() right after (useGithub()'s
 * connect + sync are separate mutations for exactly this reason).
 * @param {string} accessToken a GitHub Personal Access Token
 * @returns {Promise<object>} GithubProfileResponseDto
 */
export function connectGithub(accessToken) {
  return request('/api/github/connect', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });
}

/**
 * Pulls the connected account's repos, languages, topics and commit stats.
 * This is what makes GET /api/github/profiles/{userId}/skill-profile (and
 * therefore discovery-service's ML matching) return real data.
 * @returns {Promise<object>} SyncResultDto { repositoriesSynced, message }
 */
export function syncGithub() {
  return request('/api/github/sync', { method: 'POST' });
}

/**
 * The signed-in user's connected GitHub profile.
 * Rejects with a 404 GithubApiError (see isNotConnectedError) if nothing is
 * connected yet — the normal state before a user has ever submitted a token.
 * @returns {Promise<object>} GithubProfileResponseDto
 */
export function getGithubProfile() {
  return request('/api/github/profile');
}

/** @returns {Promise<Array>} RepositoryResponseDto[] */
export function getGithubRepositories() {
  return request('/api/github/repositories');
}

/**
 * @param {string} repositoryId
 * @returns {Promise<object>} CommitStatResponseDto { totalCommits, commitsLast30Days, commitsLast7Days, lastCommitAt }
 */
export function getRepositoryCommitStats(repositoryId) {
  return request(`/api/github/repositories/${repositoryId}/commit-stats`);
}

/** True when an error just means "not connected yet" (404), not a real failure. */
export function isNotConnectedError(error) {
  return error instanceof GithubApiError && error.status === 404;
}