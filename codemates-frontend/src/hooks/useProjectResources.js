import { projectResources as mockProjectResources } from "../mock/resourcesMock";
import { projectDetails, defaultProjectDetails } from "../mock/projectDetailsMock";

const SIMULATED_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deep-cloned, mutable in-memory store so add/update/delete persist for
// the lifetime of the page load (resets on refresh) — same approach as
// chatApi.js.
const resourceStore = JSON.parse(JSON.stringify(mockProjectResources));

let nextResourceSeq = 1000; // avoids colliding with the seeded mock ids

/**
 * Fetch all resources for a project.
 *
 * Matches the real endpoint: GET /api/projects/{projectId}/resources ->
 * ResourceResponse[], newest first (this store is seeded newest-first,
 * and new adds are unshifted to preserve that).
 *
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function getResources(projectId) {
  await delay(SIMULATED_DELAY_MS);
  return resourceStore[projectId] ?? [];
}

/**
 * Add a resource.
 *
 * Matches POST /api/projects/{projectId}/resources, CreateResourceRequest
 * { name, url, description?, resourceType? }. Note the real request body
 * has no uploadedByUserId — the backend derives it from the authenticated
 * user. This mock mirrors that: it doesn't take uploadedByUserId from the
 * caller, it resolves a stand-in "current user" (the project's first
 * member — there's no real auth yet) internally instead.
 *
 * @param {string} projectId
 * @param {{ name: string, url: string, description?: string, resourceType?: string }} resource
 * @returns {Promise<object>} ResourceResponse
 */
export async function addResource(projectId, resource) {
  await delay(SIMULATED_DELAY_MS);

  const project = projectDetails[projectId] ?? defaultProjectDetails;
  const mockCurrentUserId = project.members[0]?.id ?? null;

  const newResource = {
    id: `res-${nextResourceSeq++}`,
    projectId,
    uploadedByUserId: mockCurrentUserId,
    name: resource.name,
    url: resource.url,
    description: resource.description ?? "",
    resourceType: resource.resourceType ?? "LINK",
    createdAt: new Date().toISOString(),
  };

  resourceStore[projectId] = [newResource, ...(resourceStore[projectId] ?? [])];
  return newResource;
}

/**
 * Update a resource.
 *
 * ⚠️ Real API divergence: there is no edit endpoint in the real
 * resource-service at all (only create, delete, and list — see
 * codemates-api-docs.md). This stays mock/local-state only until that's
 * added to the backend — not a "swap the mock body for a fetch call"
 * situation once the real API exists.
 *
 * @param {string} projectId
 * @param {string} resourceId
 * @param {{ name?: string, url?: string, description?: string, resourceType?: string }} resource
 * @returns {Promise<object>} ResourceResponse
 */
export async function updateResource(projectId, resourceId, resource) {
  await delay(SIMULATED_DELAY_MS);

  const list = resourceStore[projectId] ?? [];
  const index = list.findIndex((r) => r.id === resourceId);
  if (index === -1) {
    throw new Error(`Resource not found: ${resourceId}`);
  }

  const updated = { ...list[index], ...resource };
  list[index] = updated;
  return updated;
}

/**
 * Delete a resource.
 *
 * Matches DELETE /api/projects/{projectId}/resources/{resourceId} -> null
 * (soft delete server-side; this mock removes it from the array outright).
 *
 * @param {string} projectId
 * @param {string} resourceId
 * @returns {Promise<null>}
 */
export async function deleteResource(projectId, resourceId) {
  await delay(SIMULATED_DELAY_MS);

  const list = resourceStore[projectId] ?? [];
  const index = list.findIndex((r) => r.id === resourceId);
  if (index === -1) {
    throw new Error(`Resource not found: ${resourceId}`);
  }

  list.splice(index, 1);
  return null;
}