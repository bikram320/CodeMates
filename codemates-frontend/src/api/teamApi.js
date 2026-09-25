/**
 * teamApi — data access for the Project Team page.
 *
 * Right now every function runs against an in-memory "mock server" (bottom
 * of this file) with a small artificial delay. The exported functions are the
 * contract the rest of the app depends on; when the Spring Boot endpoints are
 * wired in, replace the *bodies* and delete the mock section — the hook and
 * page shouldn't need to change.
 *
 * ── Real backend mapping (project-service, gateway /api/projects/**) ─────────
 *
 *  getProjectTeam(projectId)
 *    GET    /api/projects/{projectId}/members            (public)
 *           → ProjectMemberResponseDto[] { id, projectId, userId, role, joinedAt, invitedByUserId }
 *    That DTO has NO name / username / avatar / skills, so each userId has to be
 *    hydrated with profile data before returning TeamMember objects.
 *    🚫 The docs only expose profiles by *username* (GET /api/users/{username}),
 *    not by userId — needs a backend addition (batch lookup by userIds, or
 *    profile fields embedded in the members response).
 *    Mapping into the TeamMember shape (see mock/teamMock.js):
 *      id           ← member.userId
 *      name         ← profile.fullName
 *      skills       ← profile.skills.map((s) => s.skillName)
 *      availability ← no direct field. Candidates: profile.isOpenToCollaborate,
 *                     profile.activityStatus (free-text!), or presence
 *                     (/topic/presence ONLINE/OFFLINE). Agree on a mapping
 *                     to AVAILABLE | BUSY | AWAY with the backend team.
 *      tasksCompleted ← contribution-service
 *      status       ← 'ACTIVE' for every row in /members
 *    🚫 Pending invites: the docs only list invitations addressed to the
 *    *caller* (GET /invitations/pending). There's no "invitations I sent for
 *    this project" endpoint, so PENDING entries need a new endpoint or must be
 *    tracked client-side.
 *
 *  inviteMember(projectId, memberId, role)
 *    POST   /api/projects/{projectId}/invitations        (LEADER only)
 *           body { invitedUserId: memberId, role }
 *           → ProjectInvitationResponseDto; 400 if already a member / already invited.
 *    The invite modal currently collects a username or email. The backend needs
 *    a userId, so resolve username → userId here (GET /api/users/{username}
 *    → ProfileResponse.userId). There is no email lookup in the API, and no
 *    "message" field on InviteMemberRequest.
 *
 *  removeMember(projectId, memberId)
 *    DELETE /api/projects/{projectId}/members/{memberId} (LEADER, or self to leave)
 *           → data: null. 400 if the target is the LEADER.
 *
 *  updateMemberRole(projectId, memberId, role)
 *    PUT    /api/projects/{projectId}/members/{memberId}/role   (LEADER only)
 *           body { role } → ProjectMemberResponseDto
 *
 * All real responses use the { success, message, data, timestamp } envelope —
 * unwrap `data` and throw TeamApiError(message, httpStatus) on failure so the
 * hook and page keep seeing the same error type.
 */



/* ── Public API ──────────────────────────────────────────────────────────── */

/** Error type thrown by every function here. `status` is the HTTP status. */
export class TeamApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'TeamApiError';
    this.status = status;
  }
}

/**
 * All people attached to a project: accepted members (status 'ACTIVE') and
 * invitees who haven't responded yet (status 'PENDING').
 * @returns {Promise<Array>} TeamMember[]
 */
export async function getProjectTeam(projectId) {
  await wait(MOCK_DELAY_MS.read);

  if (projectId === MOCK_FAILING_PROJECT_ID) {
    throw new TeamApiError(
      'Could not load the team right now. Try again shortly.',
      503
    );
  }
  return clone(getTeam(projectId));
}

/**
 * Invite a developer to the project.
 * @param memberId  The invitee's userId. In mock mode the invite modal passes
 *                  the raw username/email the user typed, and this accepts
 *                  either (see the mapping note above for the real version).
 * @param role      LEADER | CONTRIBUTOR | REVIEWER (backend default: CONTRIBUTOR)
 * @returns {Promise<object>} ProjectInvitationResponseDto
 */
export async function inviteMember(projectId, memberId, role = 'CONTRIBUTOR') {
  await wait(MOCK_DELAY_MS.write);

  const team = getTeam(projectId);
  assertCallerIsLeader(team);
  assertValidRole(role);

  const identifier = normalizeIdentifier(memberId);
  const existing = team.find(
    (m) => m.id === memberId || m.username.toLowerCase() === identifier
  );
  if (existing?.status === 'ACTIVE') {
    throw new TeamApiError('User is already a member of this project', 400);
  }
  if (existing?.status === 'PENDING') {
    throw new TeamApiError('User already has a pending invitation', 400);
  }

  const now = new Date();
  const invitee = buildPendingInvitee(identifier, role, now);
  team.push(invitee);

  return clone({
    id: newId(),
    projectId,
    invitedUserId: invitee.id,
    invitedByUserId: MOCK_CURRENT_USER_ID,
    role,
    status: 'PENDING',
    expiresAt: invitee.expiresAt,
    respondedAt: null,
    createdAt: now.toISOString(),
  });
}

/**
 * Remove a member (or cancel a pending invite).
 * @returns {Promise<null>}
 */
export async function removeMember(projectId, memberId) {
  await wait(MOCK_DELAY_MS.write);

  const team = getTeam(projectId);
  const target = team.find((m) => m.id === memberId);
  if (!target) {
    throw new TeamApiError(`Member not found: ${memberId}`, 404);
  }

  // Leaders can remove anyone; anyone can remove themselves (leave).
  if (memberId !== MOCK_CURRENT_USER_ID) assertCallerIsLeader(team);

  if (target.status === 'ACTIVE' && target.role === 'LEADER') {
    throw new TeamApiError(
      "The project leader can't be removed. Transfer leadership or delete the project first.",
      400
    );
  }

  team.splice(team.indexOf(target), 1);
  return null;
}

/**
 * Change an accepted member's role.
 * @returns {Promise<object>} ProjectMemberResponseDto
 */
export async function updateMemberRole(projectId, memberId, role) {
  await wait(MOCK_DELAY_MS.write);

  const team = getTeam(projectId);
  assertCallerIsLeader(team);
  assertValidRole(role);

  const target = team.find((m) => m.id === memberId && m.status === 'ACTIVE');
  if (!target) {
    throw new TeamApiError(`Member not found: ${memberId}`, 404);
  }

  target.role = role;

  return clone({
    id: `pm-${target.id}`,
    projectId,
    userId: target.id,
    role: target.role,
    joinedAt: target.joinedAt,
    invitedByUserId: null,
  });
}

/**
 * The signed-in user's id. Mock only — in the real app this comes from the
 * auth store / GET /api/users/me, not from team-api.
 */
export function getCurrentUserId() {
  return MOCK_CURRENT_USER_ID;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mock server — delete everything below when wiring the real backend.
 * ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = { read: 400, write: 300 };

/** Open /projects/error-test/team to see the page's error state. */
export const MOCK_FAILING_PROJECT_ID = 'error-test';

const VALID_ROLES = ['LEADER', 'CONTRIBUTOR', 'REVIEWER'];
const INVITE_TTL_DAYS = 7;

// projectId → TeamMember[]. Lives for the browser session, so changes made
// by mutations are still there after React Query refetches.
const teams = new Map();

function getTeam(projectId) {
  if (!teams.has(projectId)) teams.set(projectId, createMockTeam());
  return teams.get(projectId);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const normalizeIdentifier = (value) =>
  String(value).trim().replace(/^@/, '').toLowerCase();

function assertValidRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new TeamApiError(`Invalid role: ${role}`, 400);
  }
}

function assertCallerIsLeader(team) {
  const caller = team.find(
    (m) => m.id === MOCK_CURRENT_USER_ID && m.status === 'ACTIVE'
  );
  if (caller?.role !== 'LEADER') {
    throw new TeamApiError('Only the project leader can do this', 403);
  }
}

function toTitleCase(handle) {
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function buildPendingInvitee(identifier, role, now) {
  const username = identifier.includes('@')
    ? identifier.split('@')[0]
    : identifier;
  const expires = new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return {
    id: newId(),
    name: toTitleCase(username) || username,
    username,
    avatarUrl: null,
    role,
    skills: [],
    availability: 'AVAILABLE',
    status: 'PENDING',
    joinedAt: null,
    tasksCompleted: 0,
    invitedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}