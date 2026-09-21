/**
 * src/mock/projectsMock.js
 *
 * Async mock layer for the My Projects data.
 *
 * Relationship to projectMock.js:
 *   projectMock.js  → static data records + display config maps (STATUS_CONFIG, etc.)
 *   projectsMock.js → async functions with simulated delay (this file)
 *
 * This file imports the seed records from projectMock.js and builds a mutable
 * in-memory store on top of them. The store pattern is in place for when
 * createProject / updateProject / archiveProject mutations are added.
 *
 * Data shapes mirror the real Spring Boot API:
 *   getMockProjects()       → GET /api/projects/my      (ProjectResponse[])
 *   getMockProjectById(id)  → GET /api/projects/{id}    (ProjectResponse)
 *   createProjectMock(data) → POST /api/projects        (ProjectResponse)
 *
 * When VITE_USE_MOCK=false these functions are never called.
 */

import { MOCK_MY_PROJECTS, CURRENT_USER_ID, TYPE_CONFIG, STATUS_CONFIG } from './projectMock';

const FETCH_DELAY_MS = 500;
const CREATE_DELAY_MS = 700;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── In-memory store ───────────────────────────────────────────────────────────
// Deep-copied from the seed so mutations don't touch the original constants.
// Changes persist for the lifetime of the browser session (reset on refresh).

let _store = MOCK_MY_PROJECTS.map((p) => ({ ...p }));

// ── Read: list ────────────────────────────────────────────────────────────────

/**
 * Simulates GET /api/projects/my
 *
 * Returns all projects where the given user is an owner or a member.
 * In the mock this is simply the whole store since every record is
 * pre-scoped to the current user.
 *
 * The real endpoint does the same filtering server-side using the
 * auth cookie, so the calling code never needs to pass a userId.
 *
 * @param {string} [userId]  - current user; ignored in real-API mode
 * @returns {Promise<ProjectResponse[]>}
 */
export async function getMockProjects(userId = CURRENT_USER_ID) {
  await delay(FETCH_DELAY_MS);
  // Every entry in the store already belongs to `userId` (either as owner
  // or member). Return copies so callers can't accidentally mutate the store.
  return _store.map((p) => ({ ...p }));
}

// ── Read: single ──────────────────────────────────────────────────────────────

/**
 * Simulates GET /api/projects/{projectId}
 *
 * Returns a single project record. Throws a 404-shaped error if the ID
 * is not found so the hook's error state can display a meaningful message.
 *
 * @param {string} projectId
 * @returns {Promise<ProjectResponse>}
 */
export async function getMockProjectById(projectId) {
  await delay(FETCH_DELAY_MS);
  const project = _store.find((p) => p.id === projectId);
  if (!project) {
    const err = new Error(`Project '${projectId}' not found`);
    err.status = 404;
    throw err;
  }
  return { ...project };
}

// ── Create ────────────────────────────────────────────────────────────────────

const GITHUB_REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/;
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const apiError = (message, status, fieldErrors) => Object.assign(new Error(message), { status, fieldErrors });

/** Dev helper: ?mockCreateProject=error in the URL makes every create fail with a 503. */
const shouldForceError = () => {
  try {
    return new URLSearchParams(window.location.search).get('mockCreateProject') === 'error';
  } catch {
    return false;
  }
};

/**
 * Server-side style validation. Returns { fieldName: message }, keyed by the
 * request's field names (so `maxMembers`, not the form's `teamSize`).
 * Type and status are checked against the same TYPE_CONFIG / STATUS_CONFIG the
 * My Projects cards render from, so a created project can never be a value
 * the UI doesn't know how to display.
 */
function validateCreateProject(data = {}) {
  const errors = {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length < 3 || name.length > 60) {
    errors.name = 'Project name must be between 3 and 60 characters.';
  } else if (_store.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = `You already have a project called "${name}". Choose a different name.`;
  }

  const description = typeof data.description === 'string' ? data.description.trim() : '';
  if (description.length < 20 || description.length > 500) {
    errors.description = 'Description must be between 20 and 500 characters.';
  }

  if (!has(TYPE_CONFIG, data.projectType)) errors.projectType = 'Choose a valid project type.';

  const stack = Array.isArray(data.techStack) ? data.techStack : [];
  if (stack.length < 1 || stack.length > 12 || stack.some((t) => typeof t !== 'string' || !t.trim() || t.trim().length > 30)) {
    errors.techStack = 'Add 1 to 12 technologies, each up to 30 characters.';
  }

  if (!Number.isInteger(data.maxMembers) || data.maxMembers < 2 || data.maxMembers > 20) {
    errors.maxMembers = 'Team size must be a whole number from 2 to 20.';
  }

  if (!Array.isArray(data.rolesNeeded) || data.rolesNeeded.length === 0) {
    errors.rolesNeeded = 'Pick at least one role you are looking for.';
  }

  if (data.githubRepoUrl && !GITHUB_REPO_RE.test(String(data.githubRepoUrl).trim())) {
    errors.githubRepoUrl = 'GitHub repository URL must look like https://github.com/owner/repository.';
  }

  if (data.visibility !== 'PUBLIC' && data.visibility !== 'PRIVATE') {
    errors.visibility = 'Visibility must be PUBLIC or PRIVATE.';
  }

  if (data.status !== undefined && !has(STATUS_CONFIG, data.status)) {
    errors.status = 'Choose a valid project status.';
  }

  return errors;
}

/**
 * Simulates POST /api/projects
 *
 * Validates `data`, then adds the project to the same in-memory store that
 * getMockProjects() / getMockProjectById() read from, so it shows up in
 * My Projects and resolves at /projects/:id immediately.
 *
 * Request fields (see toCreateProjectPayload() in pages/CreateProject.jsx):
 *   name, description, githubRepoUrl, visibility, techStack, maxMembers,
 *   projectType, rolesNeeded, status
 *
 * Rejects with an Error carrying `.status` and, for validation failures,
 * `.fieldErrors` ({ fieldName: message }).
 *   422 → invalid data (or duplicate name)
 *   503 → forced via ?mockCreateProject=error
 *
 * Note: only My Projects is affected. Discover Projects reads its own static
 * list in projectMock.js, so a new project does not appear there.
 *
 * @param {object} data - CreateProjectRequest fields
 * @returns {Promise<ProjectResponse>} the created project
 */
export async function createProjectMock(data) {
  await delay(CREATE_DELAY_MS);

  if (shouldForceError()) {
    throw apiError("The project service isn't responding. Try again in a moment.", 503);
  }

  const fieldErrors = validateCreateProject(data);
  if (Object.keys(fieldErrors).length > 0) {
    throw apiError('Some project details are invalid.', 422, fieldErrors);
  }

  const project = {
    id:             `proj-${Date.now()}`,
    ownerUserId:    CURRENT_USER_ID,
    isOwner:        true,
    role:           'LEADER',
    name:           data.name.trim(),
    description:    data.description.trim(),
    type:           data.projectType,
    status:         data.status ?? 'ACTIVE',
    visibility:     data.visibility,
    techStack:      data.techStack.map((t) => t.trim()),
    requiredRoles:  [...data.rolesNeeded],
    maxMembers:     data.maxMembers,
    githubRepoUrl:  data.githubRepoUrl ? String(data.githubRepoUrl).trim() : null,
    memberCount:    1,
    taskCount:      0,
    tasksCompleted: 0,
    lastActivity:   'just now',
    createdAt:      new Date().toISOString(),
  };

  _store.unshift(project); // newest first
  return { ...project };
}

// ── Future mutations (stubs) ──────────────────────────────────────────────────
// These will mirror PUT/DELETE endpoints when the edit/archive flows are built.
// Stubbed here so the API layer has a place to route to immediately.

/**
 * Simulates DELETE /api/projects/{projectId}   (archive, not hard-delete)
 * @param {string} projectId
 */
export async function archiveProjectMock(projectId) {
  await delay(200);
  const idx = _store.findIndex((p) => p.id === projectId);
  if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });
  _store[idx] = { ..._store[idx], status: 'ARCHIVED' };
  return { ..._store[idx] };
}