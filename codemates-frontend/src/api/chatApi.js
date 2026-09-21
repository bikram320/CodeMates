import {
  projectConversations as mockProjectConversations,
  directConversations as mockDirectConversations,
  conversationMessages as mockConversationMessages,
  CURRENT_USER_ID,
} from "../mock/chatMock";

const SIMULATED_DELAY_MS = 400;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deep-cloned, mutable in-memory copies so send/edit/delete persist for
// the lifetime of the page load (resets on refresh) — closer to how a
// real backend behaves than mutating the page's own local state.
const conversationStore = {
  projects: JSON.parse(JSON.stringify(mockProjectConversations)),
  direct: JSON.parse(JSON.stringify(mockDirectConversations)),
};
const messageStore = JSON.parse(JSON.stringify(mockConversationMessages));

let nextMessageSeq = 1000; // avoids colliding with the seeded mock ids

function findMessageLocation(messageId) {
  for (const [conversationId, messages] of Object.entries(messageStore)) {
    const index = messages.findIndex((m) => m.id === messageId);
    if (index !== -1) return { conversationId, index };
  }
  return null;
}

/**
 * Fetch the conversations relevant to a project: its own PROJECT-type
 * conversation, plus the current user's other conversations (so the
 * sidebar reflects a real inbox, not just this one project).
 *
 * Real API divergence: there is no per-project conversations endpoint.
 * The real equivalent is GET /api/conversations/my (Cookie-authenticated,
 * no projectId param) — it returns ALL of the user's conversations,
 * sorted by recent activity. Scoping down to "this project's
 * conversation" then happens client-side by filtering on `.projectId`,
 * exactly like the enrichment logic already in ProjectChat.jsx.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>} ConversationResponse[]
 */
export async function getConversations(projectId) {
  await delay(SIMULATED_DELAY_MS);
  const projectConversation =
    conversationStore.projects[projectId] ?? conversationStore.projects.p1;
  return [projectConversation, ...conversationStore.direct];
}

/**
 * Fetch message history for a conversation.
 *
 * Real API divergence: GET /api/conversations/{conversationId}/messages
 * takes no projectId, supports cursor pagination (`before`, `limit`,
 * default 50 / max 100), and returns MessagePageResponse. This mock
 * returns the full history with `hasMore` always false.
 *
 * @param {string} projectId   unused — kept only to match the requested signature
 * @param {string} conversationId
 * @returns {Promise<{ messages: object[], hasMore: boolean }>}
 */
export async function getMessages(projectId, conversationId) {
  await delay(SIMULATED_DELAY_MS);
  const messages = messageStore[conversationId] ?? [];
  return { messages, hasMore: false };
}

/**
 * Send a message.
 *
 * ⚠️ Real API divergence — structural, not just the URL: there is NO
 * REST "send message" endpoint in the real backend. Sending only happens
 * over the WebSocket frame /app/conversations/{conversationId}/send,
 * broadcast back over /topic/conversations/{conversationId}. When that's
 * wired in, this function isn't adapted — it's removed, and replaced by
 * a socket .send() call, likely in a separate websocket client module.
 *
 * @param {string} projectId   unused — kept only to match the requested signature
 * @param {string} conversationId
 * @param {{ content: string, messageType?: string, fileUrl?: string, fileName?: string }} message
 * @returns {Promise<object>} MessageResponse
 */
export async function sendMessage(projectId, conversationId, message) {
  await delay(SIMULATED_DELAY_MS);

  const newMessage = {
    id: `msg-${nextMessageSeq++}`,
    conversationId,
    senderUserId: CURRENT_USER_ID,
    content: message.content,
    messageType: message.messageType ?? "TEXT",
    fileUrl: message.fileUrl ?? null,
    fileName: message.fileName ?? null,
    isEdited: false,
    editedAt: null,
    createdAt: new Date().toISOString(),
  };

  messageStore[conversationId] = [...(messageStore[conversationId] ?? []), newMessage];

  // Keep the conversation's lastMessageAt/Preview in sync so the sidebar
  // preview updates too, same as a real backend would.
  const allConversations = [
    ...Object.values(conversationStore.projects),
    ...conversationStore.direct,
  ];
  const conversation = allConversations.find((c) => c.id === conversationId);
  if (conversation) {
    conversation.lastMessageAt = newMessage.createdAt;
    conversation.lastMessagePreview = newMessage.content;
  }

  return newMessage;
}

/**
 * Edit an existing message's content.
 *
 * Real API divergence: PUT /api/messages/{id} takes no projectId — the
 * message id alone identifies it, and the real endpoint enforces
 * sender-only edits server-side (this mock doesn't check that).
 *
 * @param {string} projectId   unused — kept only to match the requested signature
 * @param {string} messageId
 * @param {{ content: string }} message
 * @returns {Promise<object>} MessageResponse
 */
export async function editMessage(projectId, messageId, message) {
  await delay(SIMULATED_DELAY_MS);

  const location = findMessageLocation(messageId);
  if (!location) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const { conversationId, index } = location;
  const updated = {
    ...messageStore[conversationId][index],
    content: message.content,
    isEdited: true,
    editedAt: new Date().toISOString(),
  };
  messageStore[conversationId][index] = updated;
  return updated;
}

/**
 * Delete a message.
 *
 * Real API divergence: DELETE /api/messages/{id} takes no projectId, is
 * sender-only, and is documented as a soft delete server-side — the docs
 * don't specify whether the response then carries a "deleted" marker or
 * omits the message entirely, so verify that before wiring this up for
 * real. This mock removes it from the array outright, a simplification
 * worth revisiting once that's confirmed.
 *
 * @param {string} projectId   unused — kept only to match the requested signature
 * @param {string} messageId
 * @returns {Promise<null>}
 */
export async function deleteMessage(projectId, messageId) {
  await delay(SIMULATED_DELAY_MS);

  const location = findMessageLocation(messageId);
  if (!location) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const { conversationId, index } = location;
  messageStore[conversationId].splice(index, 1);
  return null;
}