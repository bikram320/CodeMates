/**
 * src/api/taskApi.js
 *
 * Task API layer.
 *
 * Real Spring Boot endpoints:
 *   GET    /api/projects/{projectId}/tasks          → TaskResponse[]
 *   POST   /api/projects/{projectId}/tasks          → TaskResponse   (always creates as TODO)
 *   PUT    /api/projects/{projectId}/tasks/{id}     → TaskResponse   (fields only — no status)
 *   PUT    /api/projects/{projectId}/tasks/{id}/status → TaskResponse (status + position only)
 *   DELETE /api/projects/{projectId}/tasks/{id}     → 204
 *
 * Important API constraints (enforced here and in the mock):
 *   - createTask: new tasks always start with status TODO; do not send `status` in the body.
 *   - updateTask: UpdateTaskRequest does NOT include `status`.
 *     Status is changed via a separate changeTaskStatus call.
 *
 * This split is abstracted away from useTasks.js and ProjectTasks.jsx.
 * `updateTask` internally calls both endpoints when a status change is included,
 * so the hook and page never need to know about the split.
 *
 * ── Switching to the real backend ────────────────────────────────────────────
 *   Set VITE_USE_MOCK=false in .env
 *   Set VITE_API_BASE_URL=http://localhost:8080
 *   Nothing in useTasks.js or ProjectTasks.jsx changes.
 */

import client from './client';
import {
  getMockTasks,
  createTaskMock,
  updateTaskMock,
  changeTaskStatusMock,
  deleteTaskMock,
} from '../mock/taskMock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all tasks for a project.
 * @param {string} projectId
 * @param {{ status?: string }} filters  - optional ?status= filter
 * @returns {Promise<TaskResponse[]>}
 */
export async function getTasks(projectId, filters = {}) {
  if (USE_MOCK) return getMockTasks(projectId, filters);

  const params = filters.status ? `?status=${filters.status}` : '';
  return client.get(`/api/projects/${projectId}/tasks${params}`);
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new task. Always created with status TODO (API rule).
 *
 * @param {string} projectId
 * @param {{ title, description?, assignedToUserId?, priority?, dueDate?, position? }} data
 * @returns {Promise<TaskResponse>}
 */
export async function createTask(projectId, data) {
  if (USE_MOCK) return createTaskMock(projectId, data);

  // Omit `status` — the real API ignores it and always sets TODO
  const { status: _ignored, ...body } = data;
  return client.post(`/api/projects/${projectId}/tasks`, body);
}

// ── Update (fields + optional status change) ──────────────────────────────────

/**
 * Update an existing task.
 *
 * Accepts all editable fields including `status`.
 * Internally routes to two endpoints when the status changes, because the real
 * Spring Boot API uses separate routes for field updates and status transitions:
 *
 *   PUT .../tasks/{id}          → UpdateTaskRequest (title, desc, priority, assignee, dueDate)
 *   PUT .../tasks/{id}/status   → ChangeTaskStatusRequest (status, position?)
 *
 * @param {string} projectId
 * @param {string} taskId
 * @param {{ title?, description?, priority?, assignedToUserId?, dueDate?, status?, position? }} data
 * @returns {Promise<TaskResponse>}
 */
export async function updateTask(projectId, taskId, data) {
  if (USE_MOCK) {
    // In mock mode we handle fields and status in one shot
    const { status, position, ...fields } = data;
    let result = await updateTaskMock(projectId, taskId, fields);
    if (status !== undefined) {
      result = await changeTaskStatusMock(projectId, taskId, { status, position });
    }
    return result;
  }

  // ── Real API: two calls if status is included ────────────────────────────
  const { status, position, ...fields } = data;

  // Always update the editable fields first
  let result = await client.put(
    `/api/projects/${projectId}/tasks/${taskId}`,
    fields
  );

  // Then change status if it was included in the update
  if (status !== undefined) {
    result = await client.put(
      `/api/projects/${projectId}/tasks/${taskId}/status`,
      { status, ...(position !== undefined && { position }) }
    );
  }

  return result;
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a task (soft delete on the real backend).
 *
 * @param {string} projectId
 * @param {string} taskId
 * @returns {Promise<null>}
 */
export async function deleteTask(projectId, taskId) {
  if (USE_MOCK) return deleteTaskMock(projectId, taskId);
  return client.delete(`/api/projects/${projectId}/tasks/${taskId}`);
}