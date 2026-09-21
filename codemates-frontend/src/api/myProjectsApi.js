/**
 * src/api/projectsApi.js
 *
 * Read API layer for My Projects.
 *
 * Intentionally separate from the existing projectApi.js, which handles
 * project-level mutations (invitations, member management, resource sharing).
 * This file is the list/detail read layer used by the My Projects page.
 *
 * Real Spring Boot endpoints:
 *   GET /api/projects/my          → ProjectResponse[]   (owned + member-of)
 *   GET /api/projects/{id}        → ProjectResponse     (single project detail)
 *
 * Both endpoints are protected by the auth cookie (credentials: 'include')
 * which the API client already sets on every request.
 *
 * ── Switching to the real backend ─────────────────────────────────────────────
 *   Set VITE_USE_MOCK=false in .env
 *   Set VITE_API_BASE_URL=http://localhost:8080
 *   Nothing in useMyProjects.js or MyProjects.jsx changes.
 */

import client from './client';
import { getMockProjects, getMockProjectById } from '../mock/projectsMock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetch all projects the authenticated user owns or has joined.
 *
 * The real endpoint filters server-side using the auth cookie; no userId
 * parameter is sent in the request.
 *
 * @returns {Promise<ProjectResponse[]>}
 */
export async function getMyProjects() {
  if (USE_MOCK) return getMockProjects();
  return client.get('/api/projects/my');
}

/**
 * Fetch a single project by ID.
 *
 * Used by the project detail page (ProjectDetails.jsx) and any component
 * that needs richer project data than what the list endpoint provides.
 *
 * @param {string} projectId
 * @returns {Promise<ProjectResponse>}
 */
export async function getProjectById(projectId) {
  if (USE_MOCK) return getMockProjectById(projectId);
  return client.get(`/api/projects/${projectId}`);
}

// ── Future mutations (forwarded to projectsMock / real endpoints) ─────────────
// Uncomment and expand when the Create Project and Archive flows are built.

// export async function createProject(data) {
//   if (USE_MOCK) return createProjectMock(data);
//   return client.post('/api/projects', data);
// }
//
// export async function archiveProject(projectId) {
//   if (USE_MOCK) return archiveProjectMock(projectId);
//   return client.delete(`/api/projects/${projectId}`);
// }