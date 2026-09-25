/**
 * src/api/projectHealthApi.js
 *
 * ProjectHealthController → /api/projects/{projectId}/health (project-service).
 * A separate file from projectApi.js, mirroring how taskApi.js is split out
 * from it — same service, different controller class, distinct concern.
 *
 * Auth: httpOnly cookie sent automatically by client.js (credentials: 'include').
 * Envelope: client.js unwraps { success, message, data } — callers receive `data` only.
 *
 * Real endpoints (from ProjectHealthController.java):
 *   GET  /api/projects/{projectId}/health
 *   POST /api/projects/{projectId}/health/sync
 */

import client from './client';

/**
 * Cached ML abandonment-risk prediction for a project. Fast — reads a stored
 * row, never calls the ML service live.
 *
 * Resolves with `null` (not an error) when nothing has been computed yet —
 * expected for a new project, one with no linked GitHub repo, or one that
 * hasn't hit a scheduled sync cycle (runs once daily). Always design for this
 * case explicitly; it's the common state, not a bug.
 *
 * @param {string} projectId  UUID
 * @returns {Promise<{
 *   projectId: string,
 *   healthStatus: 'GREEN'|'YELLOW'|'RED',
 *   abandonProbability: number,  // 0–1. GREEN <0.35, YELLOW 0.35–0.65, RED >0.65
 *   computedAt: string,          // ISO — predictions refresh once a day; show this, don't imply real-time
 *   stale: boolean,              // reserved; currently always false
 * } | null>}
 */
export const getProjectHealth = (projectId) =>
  client.get(`/api/projects/${projectId}/health`);

/**
 * Manually triggers a health recalculation. No request body, no return data.
 *
 * ⚠️ Despite the URL containing {projectId}, this currently re-syncs every
 * active project with a linked repo, not just this one — a backend quirk,
 * not a frontend bug. Intended for an explicit "Recalculate now" action, not
 * something called automatically on page load.
 *
 * @param {string} projectId  UUID (present in the URL but doesn't scope the sync — see above)
 * @returns {Promise<null>}
 */
export const syncProjectHealth = (projectId) =>
  client.post(`/api/projects/${projectId}/health/sync`, {});