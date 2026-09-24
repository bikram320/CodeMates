/**
 * src/api/taskApi.js
 *
 * All task and task-comment API calls mapped directly to the Spring Boot controllers.
 *
 * IMPORTANT — two separate endpoints for task editing (from TaskController.java):
 *
 *   PUT /api/projects/{projectId}/tasks/{taskId}
 *     → UpdateTaskRequest: title, description, assignedToUserId, priority, dueDate
 *     → Does NOT accept status. Use changeTaskStatus() for status changes.
 *
 *   PUT /api/projects/{projectId}/tasks/{taskId}/status
 *     → ChangeTaskStatusRequest: status, position?
 *     → Only moves the task between Kanban columns.
 *
 * This split must be preserved in the frontend so each mutation calls the
 * correct endpoint. useTasks.js exposes them as two separate mutations.
 *
 * dueDate field:
 *   Backend type is Instant (ISO-8601). HTML <input type="date"> produces "YYYY-MM-DD".
 *   Convert with toInstant() before sending; use toDateInput() for display.
 */

import client from './client';

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Convert an ISO Instant string from the backend to "YYYY-MM-DD" for
 * an HTML date input value.
 * @param {string|null} instant  e.g. "2026-09-20T00:00:00Z"
 * @returns {string}             e.g. "2026-09-20"
 */
export function toDateInput(instant) {
  if (!instant) return '';
  return instant.split('T')[0];
}

/**
 * Convert an HTML date input value "YYYY-MM-DD" to an ISO string for the backend.
 * @param {string|null} dateStr  e.g. "2026-09-20"
 * @returns {string|null}        e.g. "2026-09-20T00:00:00.000Z"
 */
export function toInstant(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString();
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

/**
 * List all tasks for a project, optionally filtered by status column.
 * @param {string}  projectId
 * @param {{ status?: string }} options  status = TODO | IN_PROGRESS | REVIEW | DONE
 * @returns {Promise<TaskResponse[]>}
 */
export const getTasks = (projectId, { status } = {}) =>
  client.get(`/api/projects/${projectId}/tasks${status ? `?status=${status}` : ''}`);

/**
 * Fetch a single task.
 * @param {string} projectId
 * @param {string} taskId
 * @returns {Promise<TaskResponse>}
 */
export const getTask = (projectId, taskId) =>
  client.get(`/api/projects/${projectId}/tasks/${taskId}`);

/**
 * Create a task. Caller must be LEADER.
 *
 * ⚠ Do NOT include `status` — the backend ignores it and always sets TODO.
 *
 * @param {string} projectId
 * @param {{
 *   title: string,
 *   description?: string,
 *   assignedToUserId?: string,
 *   priority?: 'LOW'|'MEDIUM'|'HIGH'|'URGENT',
 *   dueDate?: string,   ← ISO string, use toInstant() to convert from date input
 *   position?: number
 * }} data
 * @returns {Promise<TaskResponse>}
 */
export const createTask = (projectId, data) =>
  client.post(`/api/projects/${projectId}/tasks`, data);

/**
 * Update task core fields. Caller must be LEADER.
 *
 * ⚠ Does NOT accept `status` — call changeTaskStatus() for that.
 *
 * Maps to UpdateTaskRequest:
 *   title, description, assignedToUserId, priority, dueDate
 *
 * @param {string} projectId
 * @param {string} taskId
 * @param {{
 *   title?: string,
 *   description?: string,
 *   assignedToUserId?: string|null,
 *   priority?: string,
 *   dueDate?: string|null
 * }} data
 * @returns {Promise<TaskResponse>}
 */
export const updateTask = (projectId, taskId, data) =>
  client.put(`/api/projects/${projectId}/tasks/${taskId}`, data);

/**
 * Change a task's Kanban status. Caller must be the assignee or LEADER.
 *
 * Maps to ChangeTaskStatusRequest: { status, position? }
 * completedAt is auto-managed by the backend:
 *   → set when status moves to DONE
 *   → cleared when moving away from DONE
 *
 * @param {string} projectId
 * @param {string} taskId
 * @param {{ status: 'TODO'|'IN_PROGRESS'|'REVIEW'|'DONE', position?: number }} data
 * @returns {Promise<TaskResponse>}
 */
export const changeTaskStatus = (projectId, taskId, data) =>
  client.put(`/api/projects/${projectId}/tasks/${taskId}/status`, data);

/**
 * Soft-delete a task. Caller must be LEADER.
 * @param {string} projectId
 * @param {string} taskId
 * @returns {Promise<null>}
 */
export const deleteTask = (projectId, taskId) =>
  client.delete(`/api/projects/${projectId}/tasks/${taskId}`);

/**
 * Get all tasks assigned to the current user, across every project.
 * @returns {Promise<TaskResponse[]>}
 */
export const getMyTasks = () =>
  client.get('/api/tasks/my');

// ── Task Comments ─────────────────────────────────────────────────────────────

/**
 * List all comments on a task, oldest first.
 * @param {string} projectId
 * @param {string} taskId
 * @returns {Promise<TaskCommentResponse[]>}
 */
export const getTaskComments = (projectId, taskId) =>
  client.get(`/api/projects/${projectId}/tasks/${taskId}/comments`);

/**
 * Add a comment. Any project member can comment.
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} content
 * @returns {Promise<TaskCommentResponse>}
 */
export const addComment = (projectId, taskId, content) =>
  client.post(`/api/projects/${projectId}/tasks/${taskId}/comments`, { content });

/**
 * Edit a comment. Only the comment author can edit.
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} commentId
 * @param {string} content
 * @returns {Promise<TaskCommentResponse>}
 */
export const updateComment = (projectId, taskId, commentId, content) =>
  client.put(
    `/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    { content }
  );

/**
 * Delete a comment. Author or project LEADER can delete.
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} commentId
 * @returns {Promise<null>}
 */
export const deleteComment = (projectId, taskId, commentId) =>
  client.delete(
    `/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
  );