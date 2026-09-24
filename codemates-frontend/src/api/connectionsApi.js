import apiClient from "./apiClient";

/**
 * Real social-service integration — endpoints match ConnectionController.java
 * and ConnectionService.java exactly. No mock data backs this file.
 *
 * Removed vs. the earlier mock version: getOutgoingRequests. Confirmed
 * definitively impossible against the real backend — GET /pending only
 * ever returns requests where the caller is the RECEIVER
 * (findByReceiverUserIdAndStatusAndIsDeletedFalse), and no endpoint
 * exists for "requests I sent that are still pending." This is a
 * permanent gap unless a new backend endpoint is added, not something
 * that can be worked around client-side — so it's removed rather than
 * kept as a stub that would always return nothing.
 *
 * Added vs. the earlier mock version: blockConnection and
 * getConnectionStatus — both real, neither existed before.
 *
 * Note on dates: respondedAt/createdAt/connectedSince are Java
 * LocalDateTime, not Instant — they serialize with no timezone offset
 * (e.g. "2026-09-21T14:30:00", no "Z"). `new Date(...)` on that string
 * is parsed as local time in the browser's own timezone, which is only
 * correct if the server's LocalDateTime values are meant to represent
 * that same timezone. Worth confirming server timezone config if
 * displayed dates ever look off by a few hours.
 */

/**
 * Accepted connections. Matches GET /api/social/connections ->
 * ConnectionSummaryDto[]. Path has no trailing slash — Spring Boot 3 (Spring 6)
 * doesn't match trailing slashes by default, unlike some earlier versions.
 *
 * @returns {Promise<object[]>}
 */
export async function getConnections() {
  return apiClient.get("/api/social/connections");
}

/**
 * Requests received by the current user, still pending. Matches
 * GET /api/social/connections/pending -> ConnectionResponseDto[].
 *
 * @returns {Promise<object[]>}
 */
export async function getIncomingRequests() {
  return apiClient.get("/api/social/connections/pending");
}

/**
 * Send a connection request. Matches
 * POST /api/social/connections/request { receiverUserId } ->
 * ConnectionResponseDto. Throws (400) if sending to yourself or if a
 * non-rejected connection already exists between the two users.
 *
 * @param {string} receiverUserId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function sendConnectionRequest(receiverUserId) {
  return apiClient.post("/api/social/connections/request", { receiverUserId });
}

/**
 * Accept an incoming request. Receiver-only, enforced server-side.
 * Matches PUT /api/social/connections/{id}/accept.
 *
 * @param {string} connectionId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function acceptConnectionRequest(connectionId) {
  return apiClient.put(`/api/social/connections/${connectionId}/accept`);
}

/**
 * Reject an incoming request. Receiver-only, enforced server-side.
 * Matches PUT /api/social/connections/{id}/reject.
 *
 * @param {string} connectionId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function rejectConnectionRequest(connectionId) {
  return apiClient.put(`/api/social/connections/${connectionId}/reject`);
}

/**
 * Block a user via an existing connection record. Either party may call
 * this. Matches PUT /api/social/connections/{id}/block.
 *
 * @param {string} connectionId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function blockConnection(connectionId) {
  return apiClient.put(`/api/social/connections/${connectionId}/block`);
}

/**
 * Remove a connection record — used both to remove an accepted
 * connection and, per the real DELETE semantics (which don't check
 * status), to withdraw a request you sent if you already have its id.
 * Matches DELETE /api/social/connections/{id}. Either party.
 *
 * @param {string} connectionId
 * @returns {Promise<null>}
 */
export async function removeConnection(connectionId) {
  return apiClient.delete(`/api/social/connections/${connectionId}`);
}

/**
 * Check the connection status with another user. Matches
 * GET /api/social/connections/status/{userId} ->
 * ConnectionStatusResponseDto { status: NONE|PENDING|ACCEPTED|REJECTED|BLOCKED }.
 *
 * Not consumed by the Connections page itself — this is what a developer
 * profile page's "Connect" button should call to show the right state.
 *
 * @param {string} userId
 * @returns {Promise<{ status: string }>}
 */
export async function getConnectionStatus(userId) {
  return apiClient.get(`/api/social/connections/status/${userId}`);
}