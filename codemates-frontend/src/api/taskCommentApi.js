/**
 * src/api/taskCommentApi.js
 *
 * Matches TaskCommentController.java exactly:
 *   POST   /api/projects/{projectId}/tasks/{taskId}/comments
 *   PUT    /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}
 *   DELETE /api/projects/{projectId}/tasks/{taskId}/comments/{commentId}
 *   GET    /api/projects/{projectId}/tasks/{taskId}/comments
 *
 * Server-side rules (from TaskCommentService.java), enforced there, not
 * here — this file just calls the endpoints:
 *   - add: any accepted project member (any role)
 *   - update: comment author only ("Only the comment author can edit
 *     this comment")
 *   - delete: comment author OR the project's LEADER
 *
 * TaskCommentResponse only carries authorUserId, never a name — resolve
 * display names via useUserDirectory, same as everywhere else in this
 * codebase.
 *
 * Uses `client` (not `apiClient`) to match projectApi.js / taskApi.js,
 * since this is the same project-service domain.
 */

import client from './client';

/**
 * List all (non-deleted) comments for a task, oldest first — the backend
 * already orders by createdAt ascending.
 * @returns {Promise<TaskCommentResponse[]>}
 */
export const getTaskComments = (projectId, taskId) =>
  client.get(`/api/projects/${projectId}/tasks/${taskId}/comments`);

/**
 * Add a comment. Caller must be a member of the project (any role).
 * @returns {Promise<TaskCommentResponse>}
 */
export const addTaskComment = (projectId, taskId, content) =>
  client.post(`/api/projects/${projectId}/tasks/${taskId}/comments`, { content });

/**
 * Edit a comment. Author-only — server throws if the caller isn't the
 * comment's author, regardless of project role.
 * @returns {Promise<TaskCommentResponse>}
 */
export const updateTaskComment = (projectId, taskId, commentId, content) =>
  client.put(`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { content });

/**
 * Delete a comment. Author or the project's LEADER.
 * @returns {Promise<null>}
 */
export const deleteTaskComment = (projectId, taskId, commentId) =>
  client.delete(`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
