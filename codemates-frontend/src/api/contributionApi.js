import {
  projectContributionScores as mockScores,
  defaultProjectContributionScores,
  projectContributionEvents as mockEvents,
  defaultProjectContributionEvents,
} from "../mock/contributionsMock";

const SIMULATED_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch per-member contribution scores for a project (the leaderboard).
 *
 * Matches GET /api/contributions/projects/{projectId}/leaderboard ->
 * ContributionScoreResponse[], sorted highest first.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function getProjectContributions(projectId) {
  await delay(SIMULATED_DELAY_MS);
  const scores = mockScores[projectId] ?? defaultProjectContributionScores;
  return [...scores].sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Fetch project-wide aggregate stats (total score, tasks completed,
 * commits, messages).
 *
 * ⚠️ Real API divergence: there is no project-wide aggregate/stats
 * endpoint in the real backend. It only exposes per-user scores (single,
 * or the leaderboard array) — "project totals" have to be computed
 * client-side by summing the leaderboard response, exactly like this
 * mock function does internally. If a real aggregate endpoint is added
 * later, only this function's body changes — its return shape can stay
 * the same either way, so callers wouldn't need to change.
 *
 * @param {string} projectId
 * @returns {Promise<{ totalScore: number, tasksCompleted: number, commitsCount: number, messagesSent: number }>}
 */
export async function getContributionStats(projectId) {
  await delay(SIMULATED_DELAY_MS);
  const scores = mockScores[projectId] ?? defaultProjectContributionScores;

  return scores.reduce(
    (acc, s) => ({
      totalScore: acc.totalScore + s.totalScore,
      tasksCompleted: acc.tasksCompleted + s.tasksCompleted,
      commitsCount: acc.commitsCount + s.commitsCount,
      messagesSent: acc.messagesSent + s.messagesSent,
    }),
    { totalScore: 0, tasksCompleted: 0, commitsCount: 0, messagesSent: 0 }
  );
}

/**
 * Fetch recent contribution activity (events) for the whole project.
 *
 * ⚠️ Real API divergence: the real endpoint is scoped per user —
 * GET /api/contributions/projects/{projectId}/users/{userId}/events —
 * there is no "all activity for this project" endpoint. A real
 * integration would need to fetch each member's events separately and
 * merge/sort them client-side, or a new project-wide activity endpoint
 * would need to be added to the backend. This mock returns a single
 * project-scoped list directly since it's development-only.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function getContributionActivity(projectId) {
  await delay(SIMULATED_DELAY_MS);
  const events = mockEvents[projectId] ?? defaultProjectContributionEvents;
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}