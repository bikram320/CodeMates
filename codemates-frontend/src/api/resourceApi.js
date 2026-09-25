/**
 * src/api/resourceApi.js
 *
 * Project-resource API calls mapped directly to ProjectResourceController.
 *
 * Auth: httpOnly cookie sent automatically by client.js (credentials: 'include').
 * Envelope: client.js unwraps { success, message, data } — callers receive `data` only.
 *
 * Real endpoints (from ProjectResourceController.java):
 *   GET    /api/projects/{projectId}/resources
 *   POST   /api/projects/{projectId}/resources
 *   DELETE /api/projects/{projectId}/resources/{resourceId}
 *
 * Note: there is no update/edit endpoint on the backend. Resources can
 * only be added, listed, and (soft-)deleted — there is no "edit" flow
 * anywhere in this API layer or the pages/components that use it.
 */

import client from './client';

/**
 * List all active resources for a project, newest first.
 * @param {string} projectId  UUID
 * @returns {Promise<ResourceResponse[]>}
 *   Each resource: { id, projectId, uploadedByUserId, name, url, description, resourceType, createdAt }
 */
export const getProjectResources = (projectId) =>
  client.get(`/api/projects/${projectId}/resources`);

/**
 * Add a resource to a project. Caller must be an active project member.
 * @param {string} projectId  UUID
 * @param {{ name: string, url: string, description?: string, resourceType?: string }} data
 *   resourceType: LINK | DOCUMENT | DESIGN | OTHER — defaults to "LINK" on the server if omitted
 * @returns {Promise<ResourceResponse>}
 */
export const addResource = (projectId, data) =>
  client.post(`/api/projects/${projectId}/resources`, data);

/**
 * Soft-delete a resource. Caller must be the original uploader, or a
 * project LEADER (server enforces this — see ProjectResourceService#deleteResource).
 * @param {string} projectId   UUID
 * @param {string} resourceId  UUID
 * @returns {Promise<null>}
 */
export const deleteResource = (projectId, resourceId) =>
  client.delete(`/api/projects/${projectId}/resources/${resourceId}`);