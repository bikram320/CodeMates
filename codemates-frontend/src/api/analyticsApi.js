/**
 * src/api/analyticsApi.js
 *
 * The only module that knows where project-analytics data comes from.
 * Currently routed to the in-memory mock (src/mock/analyticsMock.js).
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 * The backend has no analytics endpoints (api docs). Each function below
 * therefore has to be built from existing services and reshaped here, so
 * useProjectAnalytics() and the UI keep receiving the same shapes:
 *
 *   getProjectAnalytics       GET /api/projects/{id}
 *                             `milestone` has no backend field yet, so it is
 *                             null until the project model gets one (the UI
 *                             hides it when null).
 *
 *   getTaskAnalytics          GET /api/projects/{id}/tasks
 *                             Count client-side by status and priority.
 *                             overdue = dueDate in the past and status != DONE.
 *
 *   getContributionAnalytics  GET /api/contributions/projects/{id}/leaderboard
 *                             + GET /api/projects/{id}/members for names
 *                             (the leaderboard returns userId only).
 *
 *   getTeamActivity           GET /api/projects/{id}/members
 *                             + GET /api/contributions/projects/{id}/users/{userId}/events
 *                             per member. Sum the last 7 days by event type.
 *
 *   getProjectActivity        Same per-user events, merged: bucket by day for
 *                             `trend`, newest first for `events`.
 *
 * Return the unwrapped `data` payload (not the { success, message, data,
 * timestamp } envelope), as the mock does.
 */

import {
  mockGetContributionAnalytics,
  mockGetProjectActivity,
  mockGetProjectAnalytics,
  mockGetTaskAnalytics,
  mockGetTeamActivity,
} from "../mock/projectAnalyticsMock";

/** @returns {Promise<{ projectId: string, milestone: { name: string, dueDate: string } | null }>} */
export const getProjectAnalytics = (projectId) => mockGetProjectAnalytics(projectId);

/**
 * @returns {Promise<{
 *   overdue: number,
 *   byStatus: { id: string, label: string, count: number }[],
 *   byPriority: { id: string, label: string, total: number, done: number }[],
 * }>}
 */
export const getTaskAnalytics = (projectId) => mockGetTaskAnalytics(projectId);

/**
 * Activity in the last 7 days per member.
 * @returns {Promise<{ members: { userId, name, role, lastActiveAt, weekly: { tasksCompleted, commits, messages } }[] }>}
 */
export const getTeamActivity = (projectId) => mockGetTeamActivity(projectId);

/**
 * All-time contribution scores (ContributionScoreResponse plus `name`).
 * @returns {Promise<{ contributions: { userId, name, tasksCompleted, commitsCount, messagesSent, totalScore }[] }>}
 */
export const getContributionAnalytics = (projectId) => mockGetContributionAnalytics(projectId);

/**
 * Daily counts for the last 14 days plus the most recent events, newest first.
 * @returns {Promise<{
 *   trend: { date: string, tasksCompleted: number, commits: number, messages: number }[],
 *   events: { id, type, actorName, message, createdAt }[],
 * }>}
 */
export const getProjectActivity = (projectId) => mockGetProjectActivity(projectId);