/**
 * projectSettingsApi — data access for the Project Settings page.
 *
 * ⚠️ MOCK ONLY. No Spring Boot calls. Every function runs against an
 * in-memory "mock server" (bottom of this file) with a small artificial
 * delay. The exported functions are the contract the hook depends on; when the
 * backend is wired in, replace the *bodies* and delete the mock section.
 *
 * Deleting a project here only removes it from the mock server's memory —
 * reload the page to bring the sample project back.
 *
 * ── Real backend mapping (project-service, gateway /api/projects/**) ────────
 *
 *  getProjectSettings(projectId)  → settings | null   (null = no such project)
 *    GET /api/projects/{id} (public) → ProjectResponse { name, description,
 *        githubRepoUrl, status, visibility, techStack, maxMembers, memberCount }
 *    Viewer's permission: GET /api/projects/{id}/members/{userId}/check
 *        → { isMember, role }   canManage = role === 'LEADER'
 *    A 404 → return null.
 *    🚫 Not in the API: projectType; every team rule except maxMembers
 *       (whoCanInvite, defaultRole, allowLeaving, invitationsEnabled,
 *       openToNewMembers); pendingInviteCount (only the *invitee's* pending
 *       list exists); repository isPrivate / lastSyncedAt / connectedBy
 *       (those come from github-sync-service and contribution-service).
 *
 *  updateProjectSettings(projectId, settings)
 *    PUT /api/projects/{id} { name, description, techStack, visibility }   LEADER only
 *
 *  updateRepositorySettings(projectId, { repoUrl })
 *    PUT /api/projects/{id} { githubRepoUrl }, plus repository-links in
 *    contribution-service (POST to link, DELETE .../repository-links/{repositoryId}
 *    to unlink). ⚠️ The update endpoint applies only non-null fields, so
 *    sending null can't clear githubRepoUrl — disconnecting needs an
 *    empty-string convention or a new endpoint.
 *
 *  updateTeamSettings(projectId, teamSettings)
 *    PUT /api/projects/{id} { maxMembers }. The other team settings have no
 *    endpoint yet. Only leaders may change it; whether the API rejects a limit
 *    below the current member count isn't documented (this mock does).
 *
 *  archiveProject(projectId) / unarchiveProject(projectId)
 *    PUT /api/projects/{id} { status: 'ARCHIVED' } / { status: 'ACTIVE' }
 *
 *  deleteProject(projectId)
 *    DELETE /api/projects/{id}   LEADER only, soft delete → data: null
 *
 * Real responses use the { success, message, data, timestamp } envelope —
 * unwrap `data` and throw ProjectSettingsApiError(message, httpStatus) on failure.
 *
 * ── Try the other states in the browser (mock only) ─────────────────────────
 *   /projects/error-test/settings   loading fails (503) → error state + retry
 *   /projects/not-found/settings    no such project → "Project not found"
 *   /projects/read-only/settings    viewer isn't a leader → read-only message
 * Any other project id gets the sample project.
 */

import {
  MOCK_CURRENT_USERNAME,
  MOCK_LINKED_REPOSITORIES,
  MOCK_TAKEN_PROJECT_NAMES,
  createMockProjectSettings,
} from '../mock/projectSettingsMock';

/* ── Public API ──────────────────────────────────────────────────────────── */

/** Error type thrown by every function here. `status` is the HTTP status. */
export class ProjectSettingsApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ProjectSettingsApiError';
    this.status = status;
  }
}

/**
 * Everything the Project Settings page shows.
 * @returns {Promise<object|null>} { project, general, repository, team, permissions },
 *                                 or null when the project doesn't exist
 */
export async function getProjectSettings(projectId) {
  await wait(MOCK_DELAY_MS.read);

  if (projectId === MOCK_FAILING_PROJECT_ID) {
    throw new ProjectSettingsApiError(
      'Could not load the project settings right now. Try again shortly.',
      503
    );
  }
  if (!projectExists(projectId)) return null;

  return clone({
    ...getStore(projectId),
    permissions: { canManage: isLeader(projectId) },
  });
}

/**
 * Update the general settings.
 * @param settings { name, description, projectType, techStack, visibility }
 * @returns {Promise<object>} the saved general settings
 */
export async function updateProjectSettings(projectId, settings) {
  await wait(MOCK_DELAY_MS.write);

  const project = requireLeaderOf(projectId);
  const next = normalizeGeneral({ ...project.general, ...settings });
  validateGeneral(next, project.general.name);

  project.general = next;
  return clone(project.general);
}

/**
 * Connect, change or disconnect the GitHub repository.
 * @param repositoryData { repoUrl }  an empty repoUrl disconnects
 * @returns {Promise<object>} the saved repository settings
 */
export async function updateRepositorySettings(projectId, repositoryData = {}) {
  await wait(MOCK_DELAY_MS.write);

  const project = requireLeaderOf(projectId);
  const repoUrl = String(repositoryData.repoUrl ?? '').trim();

  // Disconnect
  if (!repoUrl) {
    project.repository = {
      connected: false,
      repoUrl: '',
      isPrivate: false,
      lastSyncedAt: null,
      connectedBy: null,
    };
    return clone(project.repository);
  }

  const clean = repoUrl.replace(/\/$/, '').replace(/\.git$/i, '');
  const match = REPO_URL_RE.exec(clean);
  if (!match) {
    throw new ProjectSettingsApiError(
      'Use a link like https://github.com/owner/repository',
      400
    );
  }

  const fullName = `${match[1]}/${match[2]}`;
  if (MOCK_LINKED_REPOSITORIES.includes(fullName.toLowerCase())) {
    throw new ProjectSettingsApiError(
      'That repository is already connected to another project.',
      409
    );
  }

  if (project.repository.connected && project.repository.repoUrl === clean) {
    return clone(project.repository); // nothing to change
  }

  project.repository = {
    connected: true,
    repoUrl: clean,
    isPrivate: !/docs|website|public/i.test(match[2]),
    lastSyncedAt: new Date().toISOString(),
    connectedBy: MOCK_CURRENT_USERNAME,
  };
  return clone(project.repository);
}

/**
 * Update the team settings.
 * @param teamSettings { maxMembers, whoCanInvite, defaultRole, allowLeaving,
 *                       invitationsEnabled, openToNewMembers }
 * @returns {Promise<object>} the saved team settings
 */
export async function updateTeamSettings(projectId, teamSettings) {
  await wait(MOCK_DELAY_MS.write);

  const project = requireLeaderOf(projectId);
  const next = { ...project.team, ...teamSettings };
  validateTeam(next, project.project.memberCount);

  project.team = next;
  return clone(project.team);
}

/**
 * Archive the project (it becomes read-only for the team).
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function archiveProject(projectId) {
  await wait(MOCK_DELAY_MS.write);

  const project = requireLeaderOf(projectId);
  if (project.project.status === 'ARCHIVED') {
    throw new ProjectSettingsApiError('This project is already archived.', 400);
  }

  project.project.status = 'ARCHIVED';
  return { id: projectId, status: project.project.status };
}

/**
 * Bring an archived project back to ACTIVE. (Extra — the page has an
 * "Unarchive project" button.)
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function unarchiveProject(projectId) {
  await wait(MOCK_DELAY_MS.write);

  const project = requireLeaderOf(projectId);
  if (project.project.status !== 'ARCHIVED') {
    throw new ProjectSettingsApiError('This project isn’t archived.', 400);
  }

  project.project.status = 'ACTIVE';
  return { id: projectId, status: project.project.status };
}

/**
 * Delete the project. The UI asks for confirmation (typing the project name)
 * before calling this; the mock only forgets the project until the page reloads.
 * @returns {Promise<null>}
 */
export async function deleteProject(projectId) {
  await wait(MOCK_DELAY_MS.write);

  requireLeaderOf(projectId);
  stores.delete(projectId);
  deletedProjects.add(projectId);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mock server — delete everything below when wiring the real backend.
 * ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = { read: 400, write: 300 };

export const MOCK_FAILING_PROJECT_ID = 'error-test';
export const MOCK_MISSING_PROJECT_ID = 'not-found';
export const MOCK_NON_LEADER_PROJECT_ID = 'read-only';

// projectId → settings. Lives for the browser session, so saved changes
// survive React Query refetches.
const stores = new Map();
const deletedProjects = new Set();

function projectExists(projectId) {
  return projectId !== MOCK_MISSING_PROJECT_ID && !deletedProjects.has(projectId);
}

function getStore(projectId) {
  if (!stores.has(projectId)) stores.set(projectId, createMockProjectSettings(projectId));
  return stores.get(projectId);
}

const isLeader = (projectId) => projectId !== MOCK_NON_LEADER_PROJECT_ID;

/** 404 if the project is gone, 403 unless the viewer is a leader. */
function requireLeaderOf(projectId) {
  if (!projectExists(projectId)) {
    throw new ProjectSettingsApiError('Project not found.', 404);
  }
  if (!isLeader(projectId)) {
    throw new ProjectSettingsApiError('Only the project leader can do this.', 403);
  }
  return getStore(projectId);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

/* ── Validation (mirrors the rules the UI already enforces) ──────────────── */

const REPO_URL_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)$/i;
const MAX_TEAM_SIZE = 50;

const ALLOWED = {
  projectType: ['OPEN_SOURCE', 'STARTUP', 'HACKATHON', 'ACADEMIC', 'PERSONAL'],
  visibility: ['PUBLIC', 'PRIVATE'],
  whoCanInvite: ['LEADERS', 'LEADERS_REVIEWERS'],
  defaultRole: ['CONTRIBUTOR', 'REVIEWER'],
};

const bad = (message, status = 400) => {
  throw new ProjectSettingsApiError(message, status);
};

function normalizeGeneral(g) {
  return {
    ...g,
    name: String(g.name ?? '').trim(),
    description: String(g.description ?? '').trim(),
    techStack: Array.isArray(g.techStack)
      ? g.techStack.map((t) => String(t).trim()).filter(Boolean)
      : [],
  };
}

function validateGeneral(g, currentName) {
  if (g.name.length < 2) bad('Give your project a name (at least 2 characters).');
  if (g.name.length > 60) bad('Keep the name under 60 characters.');
  if (
    g.name.toLowerCase() !== currentName.toLowerCase() &&
    MOCK_TAKEN_PROJECT_NAMES.some((n) => n.toLowerCase() === g.name.toLowerCase())
  ) {
    bad('A project with that name already exists.', 409);
  }
  if (g.description.length > 2000) bad('Keep the description under 2000 characters.');
  if (!ALLOWED.projectType.includes(g.projectType)) bad('Choose a valid project type.');
  if (!ALLOWED.visibility.includes(g.visibility)) bad('Choose a valid visibility.');
  if (g.techStack.length > 15) bad('You can add up to 15 technologies.');
  if (g.techStack.some((t) => t.length > 30)) bad('Technology names can be up to 30 characters.');
}

function validateTeam(t, memberCount) {
  if (!Number.isInteger(t.maxMembers)) bad('The team size must be a whole number.');
  if (t.maxMembers < memberCount) {
    bad(`The limit can’t be lower than your current ${memberCount} members.`);
  }
  if (t.maxMembers > MAX_TEAM_SIZE) bad(`Teams can have up to ${MAX_TEAM_SIZE} members.`);
  if (!ALLOWED.whoCanInvite.includes(t.whoCanInvite)) bad('Choose who can invite members.');
  if (!ALLOWED.defaultRole.includes(t.defaultRole)) bad('Choose a valid default role.');
  for (const field of ['allowLeaving', 'invitationsEnabled', 'openToNewMembers']) {
    if (typeof t[field] !== 'boolean') bad(`Invalid value for ${field}.`);
  }
}