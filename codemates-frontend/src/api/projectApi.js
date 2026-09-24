/**
 * src/api/projectApi.js
 *
 * All project-service API calls mapped directly to the Spring Boot controllers.
 *
 * Endpoints covered:
 *   ProjectController   → /api/projects
 *   (no task or comment endpoints here — those are in taskApi.js)
 *
 * Auth: httpOnly cookie sent automatically by client.js (credentials: 'include').
 * Envelope: client.js unwraps { success, message, data } — callers receive `data` only.
 *
 * Real endpoints (from ProjectController.java):
 *   GET    /api/projects/my
 *   GET    /api/projects/{id}
 *   POST   /api/projects
 *   PUT    /api/projects/{id}
 *   DELETE /api/projects/{id}
 *   GET    /api/projects/{id}/members
 *   GET    /api/projects/{id}/members/{userId}/check
 *   DELETE /api/projects/{id}/members/{memberUserId}
 *   PUT    /api/projects/{id}/members/{memberUserId}/role
 *   POST   /api/projects/{id}/invitations
 *   PUT    /api/projects/invitations/{invitationId}/accept
 *   PUT    /api/projects/invitations/{invitationId}/reject
 *   GET    /api/projects/invitations/pending
 */

import client from './client';

// ── Projects ──────────────────────────────────────────────────────────────────

/**
 * Returns all projects where the current user is a member (owned + joined).
 * Server-side: queries ProjectMember records for the auth cookie's userId.
 * @returns {Promise<ProjectResponse[]>}
 */
export const getMyProjects = () =>
  client.get('/api/projects/my');

/**
 * Returns a single project by ID.
 * @param {string} projectId  UUID
 * @returns {Promise<ProjectResponse>}
 */
export const getProject = (projectId) =>
  client.get(`/api/projects/${projectId}`);

/**
 * Create a new project.
 * Creator is automatically added as LEADER member (server-side).
 * @param {{ name, description?, githubRepoUrl?, visibility?, techStack?, maxMembers? }} data
 *   techStack must be a plain string e.g. "React, TypeScript, Tailwind"
 *   visibility defaults to "PRIVATE" on the server
 * @returns {Promise<ProjectResponse>}
 */
export const createProject = (data) =>
  client.post('/api/projects', data);

/**
 * Update a project. Caller must be LEADER.
 * Only the fields you send are updated (partial update semantics on the server).
 * @param {string} projectId
 * @param {{ name?, description?, githubRepoUrl?, status?, visibility?, techStack?, maxMembers? }} data
 *   status values: ACTIVE | COMPLETED | ARCHIVED
 * @returns {Promise<ProjectResponse>}
 */
export const updateProject = (projectId, data) =>
  client.put(`/api/projects/${projectId}`, data);

/**
 * Soft-delete a project. Caller must be LEADER.
 * @param {string} projectId
 * @returns {Promise<null>}
 */
export const deleteProject = (projectId) =>
  client.delete(`/api/projects/${projectId}`);

// ── Members ───────────────────────────────────────────────────────────────────

/**
 * List all active members of a project.
 * @param {string} projectId
 * @returns {Promise<ProjectMemberResponseDto[]>}
 *   Each member: { id, projectId, userId, role, joinedAt, invitedByUserId }
 *   Note: no display name/avatar — those come from user-service.
 */
export const getProjectMembers = (projectId) =>
  client.get(`/api/projects/${projectId}/members`);

/**
 * Lightweight membership check (used by messaging-service internally).
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<{ isMember: boolean, role: string|null }>}
 */
export const checkMembership = (projectId, userId) =>
  client.get(`/api/projects/${projectId}/members/${userId}/check`);

/**
 * Remove a member. Caller must be LEADER (or removing themselves).
 * Cannot remove the project LEADER.
 * @param {string} projectId
 * @param {string} memberUserId  UUID of the member to remove
 * @returns {Promise<null>}
 */
export const removeMember = (projectId, memberUserId) =>
  client.delete(`/api/projects/${projectId}/members/${memberUserId}`);

/**
 * Change a member's role. Caller must be LEADER.
 * @param {string} projectId
 * @param {string} memberUserId
 * @param {string} role  LEADER | CONTRIBUTOR | REVIEWER
 * @returns {Promise<ProjectMemberResponseDto>}
 */
export const changeMemberRole = (projectId, memberUserId, role) =>
  client.put(`/api/projects/${projectId}/members/${memberUserId}/role`, { role });

// ── Invitations ───────────────────────────────────────────────────────────────

/**
 * Invite a developer to join the project. Caller must be LEADER.
 * Invitation expires after 7 days (set server-side).
 * @param {string} projectId
 * @param {{ invitedUserId: string, role?: string }} data
 *   role defaults to CONTRIBUTOR on the server
 * @returns {Promise<ProjectInvitationResponseDto>}
 */
export const inviteMember = (projectId, data) =>
  client.post(`/api/projects/${projectId}/invitations`, data);

/**
 * Accept a pending invitation. Only the invited user can accept.
 * @param {string} invitationId
 * @returns {Promise<ProjectMemberResponseDto>}
 */
export const acceptInvitation = (invitationId) =>
  client.put(`/api/projects/invitations/${invitationId}/accept`, {});

/**
 * Reject a pending invitation. Only the invited user can reject.
 * @param {string} invitationId
 * @returns {Promise<ProjectInvitationResponseDto>}
 */
export const rejectInvitation = (invitationId) =>
  client.put(`/api/projects/invitations/${invitationId}/reject`, {});

/**
 * List all pending invitations for the current user (across all projects).
 * @returns {Promise<ProjectInvitationResponseDto[]>}
 */
export const getPendingInvitations = () =>
  client.get('/api/projects/invitations/pending');