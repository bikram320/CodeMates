/**
 * src/mock/taskMock.js
 *
 * In-memory mock store for project tasks and members.
 *
 * All functions are async and simulate realistic network delays so that
 * loading states and optimistic updates are testable in the browser.
 *
 * The mutable `_taskStore` persists changes within the browser session
 * (reset on page refresh), so create/update/delete all work correctly.
 *
 * Data shapes match the real Spring Boot API exactly:
 *   - TaskResponse         → /api/projects/{id}/tasks
 *   - CreateTaskRequest    → title, description, assignedToUserId, priority, dueDate
 *   - UpdateTaskRequest    → any subset of the above (no status — that's a separate endpoint)
 *   - ChangeTaskStatusRequest → status, position?
 *
 * When VITE_USE_MOCK=false these functions are never called.
 */

const FETCH_DELAY_MS  = 400;  // simulate GET latency
const MUTATE_DELAY_MS = 200;  // mutations should feel faster

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Static member data (doesn't change mid-session) ───────────────────────────

const _MEMBERS = [
  { id: 'member-1', userId: 'user-uuid-001', username: 'alexkim', fullName: 'Alex Kim',       initials: 'AK', avatarUrl: null, role: 'LEADER'      },
  { id: 'member-2', userId: 'user-uuid-010', username: 'priya_d', fullName: 'Priya Desai',    initials: 'PD', avatarUrl: null, role: 'CONTRIBUTOR'  },
  { id: 'member-3', userId: 'user-uuid-011', username: 'sam_r',   fullName: 'Sam Rodriguez',  initials: 'SR', avatarUrl: null, role: 'CONTRIBUTOR'  },
  { id: 'member-4', userId: 'user-uuid-012', username: 'ji_w',    fullName: 'Ji-ho Won',      initials: 'JW', avatarUrl: null, role: 'REVIEWER'     },
];

// ── Seed data (shape matches TaskResponse) ────────────────────────────────────

const SEED_TASKS = [
  // ── TODO ──────────────────────────────────────────────────────────────────
  {
    id: 'task-uuid-001', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-011',
    title: 'Add support for custom config files',
    description: 'Allow users to define a codemates.config.js in the project root to override defaults.',
    status: 'TODO', priority: 'MEDIUM',
    dueDate: '2026-09-28', completedAt: null, position: 0,
    createdAt: '2026-09-10T09:00:00Z', updatedAt: '2026-09-10T09:00:00Z',
  },
  {
    id: 'task-uuid-002', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: null,
    title: 'Implement plugin architecture',
    description: 'Design and implement a hook-based plugin system so third-party tools can extend deploy behaviour.',
    status: 'TODO', priority: 'HIGH',
    dueDate: '2026-10-05', completedAt: null, position: 1,
    createdAt: '2026-09-11T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z',
  },
  {
    id: 'task-uuid-003', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-010', assignedToUserId: null,
    title: 'Update documentation for v2.0 release',
    description: 'Rewrite the getting-started guide and add examples for the new flag syntax.',
    status: 'TODO', priority: 'LOW',
    dueDate: '2026-10-10', completedAt: null, position: 2,
    createdAt: '2026-09-12T08:00:00Z', updatedAt: '2026-09-12T08:00:00Z',
  },
  // ── IN_PROGRESS ────────────────────────────────────────────────────────────
  {
    id: 'task-uuid-004', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-001',
    title: 'Fix race condition in cache invalidation layer',
    description: 'Concurrent writes to the deploy cache occasionally produce stale artefacts. Needs a mutex.',
    status: 'IN_PROGRESS', priority: 'HIGH',
    dueDate: '2026-09-20', completedAt: null, position: 0,
    createdAt: '2026-09-13T11:00:00Z', updatedAt: '2026-09-17T14:22:00Z',
  },
  {
    id: 'task-uuid-005', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-010',
    title: 'Write unit tests for the deploy command',
    description: 'Coverage is currently at 42%. Target 80% before release. Focus on error paths.',
    status: 'IN_PROGRESS', priority: 'MEDIUM',
    dueDate: '2026-09-22', completedAt: null, position: 1,
    createdAt: '2026-09-13T12:00:00Z', updatedAt: '2026-09-16T09:00:00Z',
  },
  {
    id: 'task-uuid-006', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-010', assignedToUserId: 'user-uuid-001',
    title: 'Refactor CLI argument parsing module',
    description: 'Current arg parsing is a 400-line function. Split into focused subcommand handlers.',
    status: 'IN_PROGRESS', priority: 'MEDIUM',
    dueDate: '2026-09-25', completedAt: null, position: 2,
    createdAt: '2026-09-14T15:00:00Z', updatedAt: '2026-09-15T11:00:00Z',
  },
  // ── REVIEW ────────────────────────────────────────────────────────────────
  {
    id: 'task-uuid-007', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-001',
    title: 'Fix memory leak in --watch mode',
    description: 'File watchers are not properly cleaned up on SIGINT. Heap grows unbounded over long sessions.',
    status: 'REVIEW', priority: 'URGENT',
    dueDate: '2026-09-19', completedAt: null, position: 0,
    createdAt: '2026-09-09T16:00:00Z', updatedAt: '2026-09-18T10:00:00Z',
  },
  {
    id: 'task-uuid-008', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-012', assignedToUserId: 'user-uuid-012',
    title: 'Update README with new CLI flags documentation',
    description: 'Add examples for --dry-run, --skip-cache, and --verbose. Update the flags table.',
    status: 'REVIEW', priority: 'LOW',
    dueDate: '2026-09-21', completedAt: null, position: 1,
    createdAt: '2026-09-08T09:00:00Z', updatedAt: '2026-09-17T17:00:00Z',
  },
  // ── DONE ──────────────────────────────────────────────────────────────────
  {
    id: 'task-uuid-009', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-010',
    title: 'Set up GitHub Actions CI/CD pipeline',
    description: 'Build, lint, and test on every PR. Deploy to staging on merge to main.',
    status: 'DONE', priority: 'MEDIUM',
    dueDate: '2026-09-12', completedAt: '2026-09-12T14:30:00Z', position: 0,
    createdAt: '2026-09-05T08:00:00Z', updatedAt: '2026-09-12T14:30:00Z',
  },
  {
    id: 'task-uuid-010', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-001', assignedToUserId: 'user-uuid-001',
    title: 'Initial project scaffolding and repo setup',
    description: 'Create Rust workspace, configure Cargo.toml, set up directory structure.',
    status: 'DONE', priority: 'LOW',
    dueDate: '2026-09-06', completedAt: '2026-09-06T11:00:00Z', position: 1,
    createdAt: '2026-09-04T07:00:00Z', updatedAt: '2026-09-06T11:00:00Z',
  },
  {
    id: 'task-uuid-011', projectId: 'proj-uuid-001',
    createdByUserId: 'user-uuid-012', assignedToUserId: 'user-uuid-012',
    title: 'Configure Rustfmt and linting rules',
    description: 'Agree on formatting rules and enforce them in CI so PRs have consistent style.',
    status: 'DONE', priority: 'LOW',
    dueDate: '2026-09-08', completedAt: '2026-09-08T16:00:00Z', position: 2,
    createdAt: '2026-09-05T10:00:00Z', updatedAt: '2026-09-08T16:00:00Z',
  },
];

// ── Mutable in-memory store ───────────────────────────────────────────────────
// Deep-copied from seed so mutations don't corrupt the original constants.
let _taskStore = SEED_TASKS.map((t) => ({ ...t }));
let _idCounter = 100; // suffix for generated IDs so they're stable within a session

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Simulates GET /api/projects/{projectId}/tasks
 * Accepts an optional status filter to mirror the real API's ?status= query param.
 */
export async function getMockTasks(projectId, { status } = {}) {
  await delay(FETCH_DELAY_MS);
  return _taskStore
    .filter((t) => t.projectId === projectId)
    .filter((t) => !status || t.status === status)
    .map((t) => ({ ...t })); // return copies — callers shouldn't mutate store objects
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Simulates POST /api/projects/{projectId}/tasks
 *
 * IMPORTANT — real API rule: new tasks always start with status TODO.
 * The status field in `data` is ignored; the caller should not send it.
 */
export async function createTaskMock(projectId, data) {
  await delay(MUTATE_DELAY_MS);

  const now = new Date().toISOString();
  const newTask = {
    id:               `task-${++_idCounter}`,
    projectId,
    createdByUserId:  'user-uuid-001', // current user — replace with auth context later
    assignedToUserId: data.assignedToUserId ?? null,
    title:            data.title,
    description:      data.description ?? '',
    status:           'TODO',           // always TODO — API rule
    priority:         data.priority ?? 'MEDIUM',
    dueDate:          data.dueDate ?? null,
    completedAt:      null,
    position:         _taskStore.filter((t) => t.projectId === projectId && t.status === 'TODO').length,
    createdAt:        now,
    updatedAt:        now,
  };

  _taskStore.push(newTask);
  return { ...newTask };
}

// ── Update (fields) ───────────────────────────────────────────────────────────

/**
 * Simulates PUT /api/projects/{projectId}/tasks/{taskId}
 *
 * Accepts: title, description, dueDate, priority, assignedToUserId
 * Does NOT accept status — use changeTaskStatusMock() for that.
 */
export async function updateTaskMock(projectId, taskId, data) {
  await delay(MUTATE_DELAY_MS);

  const idx = _taskStore.findIndex((t) => t.id === taskId && t.projectId === projectId);
  if (idx === -1) {
    throw Object.assign(new Error(`Task ${taskId} not found`), { status: 404 });
  }

  // Only apply the fields that UpdateTaskRequest supports (mirror the real API)
  const { title, description, dueDate, priority, assignedToUserId } = data;
  const updated = {
    ..._taskStore[idx],
    ...(title             !== undefined && { title }),
    ...(description       !== undefined && { description }),
    ...(dueDate           !== undefined && { dueDate }),
    ...(priority          !== undefined && { priority }),
    ...(assignedToUserId  !== undefined && { assignedToUserId }),
    updatedAt: new Date().toISOString(),
  };

  _taskStore[idx] = updated;
  return { ...updated };
}

// ── Change status ─────────────────────────────────────────────────────────────

/**
 * Simulates PUT /api/projects/{projectId}/tasks/{taskId}/status
 *
 * This is a SEPARATE endpoint from updateTask in the real API.
 * completedAt is auto-managed: set when moving to DONE, cleared when moving away.
 */
export async function changeTaskStatusMock(projectId, taskId, { status, position }) {
  await delay(MUTATE_DELAY_MS);

  const idx = _taskStore.findIndex((t) => t.id === taskId && t.projectId === projectId);
  if (idx === -1) {
    throw Object.assign(new Error(`Task ${taskId} not found`), { status: 404 });
  }

  const now = new Date().toISOString();
  const updated = {
    ..._taskStore[idx],
    status,
    position:    position ?? _taskStore[idx].position,
    completedAt: status === 'DONE' ? (_taskStore[idx].completedAt ?? now) : null,
    updatedAt:   now,
  };

  _taskStore[idx] = updated;
  return { ...updated };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Simulates DELETE /api/projects/{projectId}/tasks/{taskId}
 * The real API is a soft delete; in the mock we remove from the store.
 */
export async function deleteTaskMock(projectId, taskId) {
  await delay(MUTATE_DELAY_MS);

  const idx = _taskStore.findIndex((t) => t.id === taskId && t.projectId === projectId);
  if (idx === -1) {
    throw Object.assign(new Error(`Task ${taskId} not found`), { status: 404 });
  }

  _taskStore.splice(idx, 1);
  return null; // 204 No Content
}

// ── Members (static) ──────────────────────────────────────────────────────────

/** Returns project members. In production: GET /api/projects/{projectId}/members */
export function getMockMembers() {
  return [..._MEMBERS];
}

/** Looks up a member by userId. Used by TaskCard for assignee display. */
export function getMemberById(members, userId) {
  return members.find((m) => m.userId === userId);
}