import apiClient from "./apiClient";

/**
 * Real contribution-service integration — endpoints match
 * ContributionController.java and RepositoryLinkController.java exactly
 * (provided directly, not inferred). No mock data backs this file.
 *
 * apiClient already unwraps the {success, message, data} envelope, so
 * every function below returns just the payload.
 */

/**
 * Leaderboard for a project. Matches
 * GET /api/contributions/projects/{projectId}/leaderboard — already
 * sorted by totalScore descending server-side
 * (findByProjectIdAndIsDeletedFalseOrderByTotalScoreDesc).
 *
 * @param {string} projectId
 * @returns {Promise<object[]>} ContributionScoreResponse[]
 */
export async function getProjectContributions(projectId) {
  return apiClient.get(`/api/contributions/projects/${projectId}/leaderboard`);
}

/**
 * One user's score for a project. Matches
 * GET /api/contributions/projects/{projectId}/users/{userId}. Returns an
 * all-zero ContributionScoreResponse if no score exists yet — the real
 * service does not 404 for a user with no contributions.
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<object>} ContributionScoreResponse
 */
export async function getUserContributionScore(projectId, userId) {
  return apiClient.get(`/api/contributions/projects/${projectId}/users/${userId}`);
}

/**
 * Project-wide aggregate stats (total score, tasks, commits, messages).
 *
 * No real endpoint returns this directly — ContributionController only
 * exposes a single user's score and the leaderboard array. Computed here
 * by summing the leaderboard response; this is the same data a "project
 * totals" view would need regardless of where the summing happens.
 *
 * @param {string} projectId
 * @returns {Promise<{ totalScore: number, tasksCompleted: number, commitsCount: number, messagesSent: number }>}
 */
export async function getContributionStats(projectId) {
  const scores = await getProjectContributions(projectId);
  return scores.reduce(
    (acc, s) => ({
      totalScore: acc.totalScore + Number(s.totalScore ?? 0),
      tasksCompleted: acc.tasksCompleted + (s.tasksCompleted ?? 0),
      commitsCount: acc.commitsCount + (s.commitsCount ?? 0),
      messagesSent: acc.messagesSent + (s.messagesSent ?? 0),
    }),
    { totalScore: 0, tasksCompleted: 0, commitsCount: 0, messagesSent: 0 }
  );
}

/**
 * One user's contribution event history for a project. Matches
 * GET /api/contributions/projects/{projectId}/users/{userId}/events —
 * already sorted newest-first server-side
 * (findByUserIdAndProjectIdAndIsDeletedFalseOrderByCreatedAtDesc).
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<object[]>} ContributionEventResponse[]
 */
export async function getUserContributionEvents(projectId, userId) {
  return apiClient.get(`/api/contributions/projects/${projectId}/users/${userId}/events`);
}

/**
 * "Recent activity" across the whole project.
 *
 * ⚠️ There is no project-wide activity endpoint — only per-user
 * (getUserContributionEvents above). This fetches events for every
 * userId currently on the leaderboard and merges them client-side,
 * newest first. Anyone with a contribution score is on the leaderboard,
 * so no separate member-list call is needed for this — but it does mean
 * one network round trip per contributor (fine for a small team, worth
 * revisiting if project sizes grow).
 *
 * @param {string} projectId
 * @returns {Promise<object[]>} ContributionEventResponse[]
 */
export async function getContributionActivity(projectId) {
  const scores = await getProjectContributions(projectId);
  const eventLists = await Promise.all(
    scores.map((s) => getUserContributionEvents(projectId, s.userId))
  );
  return eventLists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Link a GitHub repository to a project, enabling commit-based scoring
 * for it. Matches POST /api/contributions/projects/{projectId}/repository-links,
 * LinkRepositoryRequest { repositoryId }.
 *
 * @param {string} projectId
 * @param {string} repositoryId  a repository UUID
 * @returns {Promise<object>} RepositoryLinkResponse
 */
export async function linkRepository(projectId, repositoryId) {
  return apiClient.post(`/api/contributions/projects/${projectId}/repository-links`, {
    repositoryId,
  });
}

/**
 * Unlink a repository. Matches
 * DELETE /api/contributions/projects/{projectId}/repository-links/{repositoryId}.
 *
 * @param {string} projectId
 * @param {string} repositoryId
 * @returns {Promise<null>}
 */
export async function unlinkRepository(projectId, repositoryId) {
  return apiClient.delete(
    `/api/contributions/projects/${projectId}/repository-links/${repositoryId}`
  );
}

/**
 * List repositories linked to a project. Matches
 * GET /api/contributions/projects/{projectId}/repository-links.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>} RepositoryLinkResponse[]
 */
export async function getRepositoryLinks(projectId) {
  return apiClient.get(`/api/contributions/projects/${projectId}/repository-links`);
}