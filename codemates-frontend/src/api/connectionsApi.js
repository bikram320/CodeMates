import {
  acceptedConnections as mockAcceptedConnections,
  incomingRequests as mockIncomingRequests,
  outgoingRequests as mockOutgoingRequests,
  CURRENT_USER_ID,
} from "../mock/connectionsMock";

const SIMULATED_DELAY_MS = 450;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deep-cloned, mutable in-memory stores so send/accept/reject/remove
// persist for the lifetime of the page load (resets on refresh) — same
// approach as chatApi.js/resourcesApi.js/contributionsApi.js.
let connectionsStore = JSON.parse(JSON.stringify(mockAcceptedConnections));
let incomingStore = JSON.parse(JSON.stringify(mockIncomingRequests));
let outgoingStore = JSON.parse(JSON.stringify(mockOutgoingRequests));

let nextId = 1000;

/**
 * Fetch the current user's accepted connections.
 * Matches GET /api/social/connections -> ConnectionSummaryDto[].
 *
 * @returns {Promise<object[]>}
 */
export async function getConnections() {
  await delay(SIMULATED_DELAY_MS);
  return connectionsStore;
}

/**
 * Fetch requests received by the current user, still pending.
 * Matches GET /api/social/connections/pending -> ConnectionResponseDto[].
 *
 * @returns {Promise<object[]>}
 */
export async function getIncomingRequests() {
  await delay(SIMULATED_DELAY_MS);
  return incomingStore;
}

/**
 * Fetch requests sent by the current user, still pending.
 *
 * ⚠️ Real API divergence: no endpoint exists for this. The real
 * GET /api/social/connections/pending only returns requests RECEIVED by
 * the caller. A real integration needs a new backend endpoint (e.g.
 * GET /api/social/connections/sent) before this can return real data —
 * not a "point it at a real URL later" situation.
 *
 * @returns {Promise<object[]>}
 */
export async function getOutgoingRequests() {
  await delay(SIMULATED_DELAY_MS);
  return outgoingStore;
}

/**
 * Send a connection request.
 *
 * Matches POST /api/social/connections/request { receiverUserId } ->
 * ConnectionResponseDto. Mirrors the real validation rules: 400 if
 * sending to yourself, or if a connection/pending request already
 * exists with that user.
 *
 * @param {string} userId  the receiver's id
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function sendConnectionRequest(userId) {
  await delay(SIMULATED_DELAY_MS);

  if (userId === CURRENT_USER_ID) {
    throw new Error("Cannot send a connection request to yourself");
  }

  const alreadyConnected = connectionsStore.some((c) => c.otherUserId === userId);
  const alreadyPending = outgoingStore.some((r) => r.receiverUserId === userId);
  if (alreadyConnected || alreadyPending) {
    throw new Error("A connection or pending request already exists with this user");
  }

  const newRequest = {
    id: `req-${nextId++}`,
    senderUserId: CURRENT_USER_ID,
    receiverUserId: userId,
    status: "PENDING",
    respondedAt: null,
    createdAt: new Date().toISOString(),
  };
  outgoingStore = [newRequest, ...outgoingStore];
  return newRequest;
}

/**
 * Accept an incoming request.
 *
 * Matches PUT /api/social/connections/{id}/accept -> ConnectionResponseDto
 * (receiver-only server-side; not enforced in this mock, since there's
 * no real auth yet to check against).
 *
 * @param {string} requestId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function acceptConnectionRequest(requestId) {
  await delay(SIMULATED_DELAY_MS);

  const request = incomingStore.find((r) => r.id === requestId);
  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  incomingStore = incomingStore.filter((r) => r.id !== requestId);
  connectionsStore = [
    {
      connectionId: `conn-${nextId++}`,
      otherUserId: request.senderUserId,
      connectedSince: new Date().toISOString(),
    },
    ...connectionsStore,
  ];

  return { ...request, status: "ACCEPTED", respondedAt: new Date().toISOString() };
}

/**
 * Reject an incoming request.
 * Matches PUT /api/social/connections/{id}/reject -> ConnectionResponseDto.
 *
 * @param {string} requestId
 * @returns {Promise<object>} ConnectionResponseDto
 */
export async function rejectConnectionRequest(requestId) {
  await delay(SIMULATED_DELAY_MS);

  const request = incomingStore.find((r) => r.id === requestId);
  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  incomingStore = incomingStore.filter((r) => r.id !== requestId);
  return { ...request, status: "REJECTED", respondedAt: new Date().toISOString() };
}

/**
 * Remove a connection record — used both to remove an accepted
 * connection AND to cancel an outgoing pending request.
 *
 * Matches DELETE /api/social/connections/{id} -> null (soft delete;
 * either party; works on a connection record regardless of its status).
 * That's the real reason this one function covers both UI actions: an
 * accepted connection and a still-pending outgoing request are the same
 * underlying entity at different lifecycle stages, and the real endpoint
 * doesn't distinguish between them either.
 *
 * Note: the id passed in is the same underlying value as
 * ConnectionSummaryDto's `connectionId` field — the two response DTOs
 * just name it differently depending on which endpoint returned it.
 *
 * @param {string} connectionId  a connectionId (accepted) or request id (outgoing)
 * @returns {Promise<null>}
 */
export async function removeConnection(connectionId) {
  await delay(SIMULATED_DELAY_MS);

  const wasConnection = connectionsStore.some((c) => c.connectionId === connectionId);
  if (wasConnection) {
    connectionsStore = connectionsStore.filter((c) => c.connectionId !== connectionId);
    return null;
  }

  const wasOutgoing = outgoingStore.some((r) => r.id === connectionId);
  if (wasOutgoing) {
    outgoingStore = outgoingStore.filter((r) => r.id !== connectionId);
    return null;
  }

  throw new Error(`Connection not found: ${connectionId}`);
}