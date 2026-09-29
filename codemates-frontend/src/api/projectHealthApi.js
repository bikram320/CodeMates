/**
 * src/api/projectHealthApi.js
 *
 * project-service ProjectHealthController:
 *   GET  /api/projects/{projectId}/health        -> ApiResponse<ProjectHealthResponse | null>
 *   POST /api/projects/{projectId}/health/sync   -> ApiResponse<Void>
 *
 * `client` unwraps the ApiResponse envelope, same as contributionsApi.js.
 * GET legitimately returns null (no prediction computed yet) — that is a
 * success, not an error.
 */

import client from './client';

export async function getProjectHealth(projectId) {
  const data = await client.get(`/api/projects/${projectId}/health`);
  return data ?? null;
}

export async function syncProjectHealth(projectId) {
  return client.post(`/api/projects/${projectId}/health/sync`, {});
}
