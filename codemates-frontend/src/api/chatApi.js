import apiClient from "./apiClient";

/**
 * Real messaging-service REST integration — endpoints match
 * ConversationController.java and MessageController.java exactly. No
 * mock data backs this file.
 *
 * Deliberately NOT here: sendMessage, typing, presence. Confirmed by
 * MessageService.sendMessage() being called from a STOMP path only —
 * MessageController has no POST endpoint for it at all. Those three
 * live in a separate WebSocket client module once one exists; putting a
 * fake sendMessage() here would be exactly the "unnecessary API call"
 * this refactor is supposed to remove.
 */

/**
 * All of the current user's conversations (DIRECT and PROJECT mixed).
 * Matches GET /api/conversations/my. There's no per-project filter on
 * the backend — narrow to "this project's conversation" client-side by
 * checking `.type === "PROJECT" && .projectId === projectId`.
 *
 * @returns {Promise<object[]>} ConversationResponse[]
 */
export async function getConversations() {
  return apiClient.get("/api/conversations/my");
}

/**
 * A single conversation by id. Matches GET /api/conversations/{id}.
 *
 * @param {string} conversationId
 * @returns {Promise<object>} ConversationResponse
 */
export async function getConversation(conversationId) {
  return apiClient.get(`/api/conversations/${conversationId}`);
}

/**
 * Start (or fetch the existing) direct conversation with another user.
 * Matches POST /api/conversations/direct { targetUserId }.
 *
 * @param {string} targetUserId
 * @returns {Promise<object>} ConversationResponse
 */
export async function startDirectConversation(targetUserId) {
  return apiClient.post("/api/conversations/direct", { targetUserId });
}

/**
 * Message history for a conversation, cursor-paginated newest-first
 * server-side then re-sorted ascending for display by MessageService.
 * Matches GET /api/conversations/{conversationId}/messages?before=&limit=
 * (server default page size 50, max 100).
 *
 * @param {string} conversationId
 * @param {{ before?: string, limit?: number }} [options]  before is an ISO instant
 * @returns {Promise<{ messages: object[], hasMore: boolean }>}
 */
export async function getMessages(conversationId, { before, limit } = {}) {
  return apiClient.get(`/api/conversations/${conversationId}/messages`, {
    params: { before, limit },
  });
}

/**
 * Edit a message. Sender-only — enforced server-side
 * (UnauthorizedMessageActionException for anyone else, surfaces as an
 * ApiError here). Matches PUT /api/messages/{id} { content }.
 *
 * @param {string} messageId
 * @param {string} content
 * @returns {Promise<object>} MessageResponse
 */
export async function editMessage(messageId, content) {
  return apiClient.put(`/api/messages/${messageId}`, { content });
}

/**
 * Delete a message (soft delete). Sender-only, enforced server-side.
 * Matches DELETE /api/messages/{id}.
 *
 * @param {string} messageId
 * @returns {Promise<null>}
 */
export async function deleteMessage(messageId) {
  return apiClient.delete(`/api/messages/${messageId}`);
}

/**
 * Mark a conversation as read (updates the caller's own participant
 * row). Matches PUT /api/conversations/{id}/read.
 *
 * @param {string} conversationId
 * @returns {Promise<null>}
 */
export async function markConversationRead(conversationId) {
  return apiClient.put(`/api/conversations/${conversationId}/read`);
}

/**
 * Mute or unmute a conversation. Matches
 * PUT /api/conversations/{id}/mute and PUT /api/conversations/{id}/unmute.
 *
 * @param {string} conversationId
 * @param {boolean} muted
 * @returns {Promise<null>}
 */
export async function setConversationMuted(conversationId, muted) {
  return apiClient.put(`/api/conversations/${conversationId}/${muted ? "mute" : "unmute"}`);
}