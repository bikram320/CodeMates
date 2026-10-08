/**
 * src/api/projectsApi.js
 *
 * Read API layer for My Projects, plus project creation.
 *
 * Wired directly to the real Spring Boot endpoints — no mock. (The
 * previous version of this file called createProjectMock/getMockProjects/
 * getMockProjectById without ever importing them, which threw
 * "createProjectMock is not defined" the moment Create Project was
 * submitted. Since the real backend is confirmed working — see
 * ProjectController / ProjectService / CreateProjectRequest — the mock
 * branch has been removed rather than fixed, so there's nothing left to
 * silently fall back to.)
 *
 * Real Spring Boot endpoints:
 *   GET  /api/projects/my         → ProjectResponse[]   (owned + member-of)
 *   GET  /api/projects/{id}       → ProjectResponse     (single project detail)
 *   POST /api/projects            → ProjectResponse     (create a project)
 *
 * All endpoints are protected by the auth cookie (credentials: 'include')
 * which the API client already sets on every request.
 */

import client from './client';

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
  return client.get(`/api/projects/${projectId}`);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create a project. The authenticated user becomes its Leader.
 *
 * Rejects with an Error that has `.status` and, for validation failures,
 * `.fieldErrors` ({ fieldName: message }) so the form can show messages
 * next to the right inputs.
 *
 * Request fields must match CreateProjectRequest exactly:
 *   name, description, githubRepoUrl, visibility, techStack (string,
 *   comma-separated), maxMembers (number)
 *
 * Note: projectType, rolesNeeded and status are NOT accepted by the
 * backend today — there's no field for the first two anywhere in
 * project-service, and status is hardcoded to "ACTIVE" on create
 * regardless of what's sent. Don't include them in projectData.
 *
 * @param {object} projectData
 * @returns {Promise<ProjectResponse>} the created project (includes its `id`)
 */
export async function createProject(projectData) {
  return client.post('/api/projects', projectData);
}

// ── Future mutations ─────────────────────────────────────────────────────────
// Uncomment and expand when the Archive flow is built.

// export async function archiveProject(projectId) {
//   return client.delete(`/api/projects/${projectId}`);
// }