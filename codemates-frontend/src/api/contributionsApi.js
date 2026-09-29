/**
 * src/api/contributionsApi.js
 *
 * Real contribution-service integration — endpoints match
 * ContributionController.java and RepositoryLinkController.java exactly.
 *
 * Uses client.js (the shared gateway client — same one projectApi.js,
 * taskApi.js and projectHealthApi.js use), not apiClient.js.
 */

import client from './client';

/** Leaderboard for a project — already sorted by totalScore desc server-side. */
export async function getProjectContributions(projectId) {
  return client.get(`/api/contributions/projects/${projectId}/leaderboard`);
}

/** One user's score for a project. Never 404s — returns an all-zero row instead. */
export async function getUserContributionScore(projectId, userId) {
  return client.get(`/api/contributions/projects/${projectId}/users/${userId}`);
}

/**
 * Project-wide aggregate stats. No real endpoint returns this directly —
 * summed here from the leaderboard response.
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

/** One user's event history for a project — newest-first server-side. */
export async function getUserContributionEvents(projectId, userId) {
  return client.get(`/api/contributions/projects/${projectId}/users/${userId}/events`);
}

/**
 * "Recent activity" across the whole project. No project-wide endpoint
 * exists — fetches every leaderboard member's events and merges client-side.
 */
export async function getContributionActivity(projectId) {
  const scores = await getProjectContributions(projectId);
  const eventLists = await Promise.all(
      scores.map((s) => getUserContributionEvents(projectId, s.userId))
  );
  return eventLists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Link one of YOUR synced GitHub repos to this project (scores your commits on it). */
export async function linkRepository(projectId, repositoryId) {
  return client.post(`/api/contributions/projects/${projectId}/repository-links`, { repositoryId });
}

export async function unlinkRepository(projectId, repositoryId) {
  return client.delete(`/api/contributions/projects/${projectId}/repository-links/${repositoryId}`);
}

export async function getRepositoryLinks(projectId) {
  return client.get(`/api/contributions/projects/${projectId}/repository-links`);
}

/**
 * Triggers Model 3 (Contribution Intelligence) significance predictions for
 * every linked repo/member in the project. Leader-only in the UI, mirroring
 * Project Health's "Recalculate now". Matches
 * POST /api/contributions/projects/{projectId}/predict-significance.
 */
export async function predictSignificance(projectId) {
  return client.post(`/api/contributions/projects/${projectId}/predict-significance`, {});
}

/** Saves the repo URL on the project itself, so project-service's health sync can find it. Leader-only on the backend. */
export async function setProjectRepoUrl(projectId, repoFullName) {
    return client.put(`/api/projects/${projectId}`, {
        githubRepoUrl: `https://github.com/${repoFullName}`,
    });
}