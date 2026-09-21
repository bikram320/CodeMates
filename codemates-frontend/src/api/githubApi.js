/**
 * githubApi — data access for the Project GitHub page.
 *
 * ⚠️ MOCK ONLY. No GitHub API calls and no OAuth. Every function runs against
 * an in-memory "mock server" (bottom of this file) with a small artificial
 * delay. The exported functions are the contract the hook depends on; when the
 * Spring Boot endpoints are wired in, replace the *bodies* and delete the mock
 * section.
 *
 * ── Real backend mapping ────────────────────────────────────────────────────
 *
 *  getProjectRepository(projectId)  → repository | null   (null = not connected)
 *    GET /api/contributions/projects/{projectId}/repository-links
 *        → RepositoryLinkResponse[] { id, projectId, userId, repositoryId, lastKnownTotalCommits }
 *    then GET /api/github/repositories → RepositoryResponseDto[] and pick the
 *    link's repositoryId. That list is the *caller's* synced repos, so a repo
 *    linked by a teammate may not appear — a lookup by repositoryId is needed.
 *    Available: repoName, repoFullName, repoUrl, primaryLanguage, starsCount,
 *    forksCount, isPrivate, lastPushedAt; lastSyncedAt from GET /api/github/profile.
 *    🚫 Not in the API: description, defaultBranch, isArchived, connectedBy
 *    (link.userId is an id, not a username), connectedAt.
 *
 *  getRepositoryStats(projectId)
 *    GET /api/github/repositories/{repositoryId}/commit-stats (public)
 *        → { totalCommits, commitsLast7Days, commitsLast30Days, lastCommitAt }
 *    🚫 branches, pullRequests and issues have no endpoint.
 *
 *  getCommitActivity(projectId)      🚫 no endpoint for a commit list or per-day counts.
 *  getRepositoryActivity(projectId)  🚫 no endpoint for PR / issue / branch / release events.
 *
 *  connectRepository(projectId)  (extra — keeps the Connect button working)
 *    POST /api/github/connect { accessToken }   ← a personal access token, not OAuth
 *    POST /api/github/sync
 *    POST /api/contributions/projects/{projectId}/repository-links { repositoryId }
 *
 *  disconnectRepository(projectId)  (extra — keeps the Disconnect button working)
 *    DELETE /api/contributions/projects/{projectId}/repository-links/{repositoryId}
 *
 * The real responses use the { success, message, data, timestamp } envelope —
 * unwrap `data` and throw GitHubApiError(message, httpStatus) on failure.
 *
 * ── Try the other states in the browser (mock only) ─────────────────────────
 *   /projects/error-test/github   load failure (503) → error state + retry
 *   /projects/no-repo/github      starts with no repository → empty state
 *   /projects/read-only/github    connected, but the viewer isn't a leader
 */

import { createMockGitHubData } from '../mock/githubMock';

/* ── Public API ──────────────────────────────────────────────────────────── */

/** Error type thrown by every function here. `status` is the HTTP status. */
export class GitHubApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

/**
 * The repository linked to the project, or null when none is connected.
 * @returns {Promise<object|null>}
 */
export async function getProjectRepository(projectId) {
  await wait(MOCK_DELAY_MS.read);
  failIfBroken(projectId);

  if (!isConnected(projectId)) return null;
  return clone(createMockGitHubData().repository);
}

/**
 * Headline numbers: commits, branches, pull requests, issues.
 * Throws 404 if no repository is connected.
 */
export async function getRepositoryStats(projectId) {
  await wait(MOCK_DELAY_MS.read);
  requireConnected(projectId);
  return clone(createMockGitHubData().stats);
}

/**
 * Commits per day (last 14 days) and the latest commits.
 * @returns {Promise<{ dailyCommits: Array, recentCommits: Array }>}
 */
export async function getCommitActivity(projectId) {
  await wait(MOCK_DELAY_MS.read);
  requireConnected(projectId);

  const { dailyCommits, recentCommits } = createMockGitHubData();
  return clone({ dailyCommits, recentCommits });
}

/**
 * Recent repository events (PRs, issues, branches, releases), newest first.
 * @returns {Promise<Array>}
 */
export async function getRepositoryActivity(projectId) {
  await wait(MOCK_DELAY_MS.read);
  requireConnected(projectId);
  return clone(createMockGitHubData().recentActivity);
}

/**
 * Link the sample repository to the project. No token or sign-in involved.
 * @returns {Promise<object>} the repository
 */
export async function connectRepository(projectId) {
  await wait(MOCK_DELAY_MS.write);
  assertCanManage(projectId);

  if (isConnected(projectId)) {
    throw new GitHubApiError('A repository is already connected to this project', 400);
  }
  connections.set(projectId, true);
  return clone(createMockGitHubData().repository);
}

/**
 * Unlink the repository from the project.
 * @returns {Promise<null>}
 */
export async function disconnectRepository(projectId) {
  await wait(MOCK_DELAY_MS.write);
  assertCanManage(projectId);

  if (!isConnected(projectId)) {
    throw new GitHubApiError('No repository is connected to this project', 404);
  }
  connections.set(projectId, false);
  return null;
}

/**
 * Can the viewer connect / disconnect a repository? Mock only — the real
 * answer is "is the caller the project LEADER" (GET /api/projects/{id}/members/{userId}/check).
 */
export function canManageRepository(projectId) {
  return projectId !== READ_ONLY_PROJECT_ID;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mock server — delete everything below when wiring the real backend.
 * ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = { read: 350, write: 300 };

export const MOCK_FAILING_PROJECT_ID = 'error-test';
export const MOCK_DISCONNECTED_PROJECT_ID = 'no-repo';
const READ_ONLY_PROJECT_ID = 'read-only';

// projectId → is a repository connected? Lives for the browser session, so a
// disconnect survives React Query refetches.
const connections = new Map();

function isConnected(projectId) {
  if (!connections.has(projectId)) {
    connections.set(projectId, projectId !== MOCK_DISCONNECTED_PROJECT_ID);
  }
  return connections.get(projectId);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

function failIfBroken(projectId) {
  if (projectId === MOCK_FAILING_PROJECT_ID) {
    throw new GitHubApiError(
      'Could not load GitHub data right now. Try again shortly.',
      503
    );
  }
}

function requireConnected(projectId) {
  failIfBroken(projectId);
  if (!isConnected(projectId)) {
    throw new GitHubApiError('No repository is connected to this project', 404);
  }
}

function assertCanManage(projectId) {
  if (!canManageRepository(projectId)) {
    throw new GitHubApiError('Only the project leader can do this', 403);
  }
}