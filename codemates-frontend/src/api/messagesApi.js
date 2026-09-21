/**
 * messagesApi — data access for the Direct Messages page.
 *
 * ⚠️ MOCK ONLY. No Spring Boot calls and no WebSocket. Every function runs
 * against an in-memory "mock server" (bottom of this file) with a small
 * artificial delay. The exported functions are the contract the hook depends
 * on; when the backend is wired in, replace the *bodies* and delete the mock
 * section. This module only deals with direct (one-to-one) conversations —
 * Project Chat is separate.
 *
 * ── Real backend mapping (messaging-service, gateway /api/conversations/**) ──
 *
 *  getConversations()
 *    GET /api/conversations/my → ConversationResponse[] (most recent first).
 *    Keep only `type === 'DIRECT'` — PROJECT conversations come back in the
 *    same list. Available: id, lastMessageAt, lastMessagePreview, and
 *    participants[{ userId, lastReadAt, isMuted }] (yours gives isMuted).
 *    🚫 Not in the API: the other person's name / username / avatar (only a
 *    userId — profiles are looked up by username, not id); unreadCount (derive
 *    from your lastReadAt, or ask for a field); lastMessageFromMe; presence
 *    is only the live /topic/presence stream (no initial "who's online" call
 *    and no last-seen time).
 *
 *  getMessages(conversationId)
 *    GET /api/conversations/{id}/messages?before=&limit= → { messages, hasMore }
 *    (limit ≤ 100, `before` is an ISO cursor). Unwrap `messages` and put them
 *    oldest → newest for the UI; load older pages with `before` if a
 *    "load earlier" control is added.
 *
 *  sendMessage(conversationId, { content, messageType? })
 *    🚫 No REST endpoint. Sending is a STOMP frame to
 *    /app/conversations/{id}/send { content, messageType?, fileUrl?, fileName? }
 *    with no direct reply: the saved message arrives as a MESSAGE_NEW event on
 *    /topic/conversations/{id}, and failures on /user/queue/errors. There's no
 *    client-generated id in the request, so matching your optimistic message to
 *    its echo needs a convention (or a backend field).
 *
 *  markConversationAsRead(conversationId)
 *    PUT /api/conversations/{id}/read → null
 *
 *  deleteMessage(messageId)
 *    DELETE /api/messages/{id} → null. Sender only (403 otherwise), soft delete;
 *    the other participant gets a MESSAGE_DELETED event.
 *
 *  setConversationMuted(conversationId, isMuted)   (extra — the header has a mute button)
 *    PUT /api/conversations/{id}/mute  or  /unmute → null
 *
 * Real responses use the { success, message, data, timestamp } envelope —
 * unwrap `data` and throw MessagesApiError(message, httpStatus) on failure.
 *
 * ── Try the other states in the browser (mock only) ─────────────────────────
 *   /messages?mock=error           conversations fail to load (503) → error state + retry
 *   /messages?mock=empty           no conversations → empty state
 *   /messages?mock=messages-error  a conversation's messages fail to load
 *   /messages?mock=send-error      sending a message fails (the text is put back)
 */

import { createMockMessagingData } from '../mock/messagesMock';

/* ── Public API ──────────────────────────────────────────────────────────── */

/** Error type thrown by every function here. `status` is the HTTP status. */
export class MessagesApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'MessagesApiError';
    this.status = status;
  }
}

/** Longest message the server accepts. */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * The signed-in user's direct conversations, most recent activity first.
 * @returns {Promise<Array>} [{ id, type, participant, isMuted, unreadCount,
 *                              lastMessageAt, lastMessagePreview, lastMessageFromMe }]
 */
export async function getConversations() {
  await wait(MOCK_DELAY_MS.read);

  const scenario = getScenario();
  if (scenario === 'error') {
    throw new MessagesApiError('Could not load your conversations right now. Try again shortly.', 503);
  }
  if (scenario === 'empty') return [];

  const { conversations, messages } = getData();
  return clone(
    conversations
      .map((c) => toConversationResponse(c, messages[c.id] ?? []))
      .sort(byRecentActivity)
  );
}

/**
 * The messages in one conversation, oldest → newest (deleted ones excluded).
 * @returns {Promise<Array>} [{ id, conversationId, senderUserId, content, messageType,
 *                              fileUrl, fileName, isEdited, editedAt, createdAt }]
 */
export async function getMessages(conversationId) {
  await wait(MOCK_DELAY_MS.read);

  if (getScenario() === 'messages-error') {
    throw new MessagesApiError('Could not load this conversation right now. Try again shortly.', 503);
  }
  findConversation(conversationId);
  return clone(getData().messages[conversationId] ?? []);
}

/**
 * Send a message from the signed-in user.
 * @param message { content, messageType? }  only text is supported for now
 * @returns {Promise<object>} the saved message
 */
export async function sendMessage(conversationId, message = {}) {
  await wait(MOCK_DELAY_MS.write);

  if (getScenario() === 'send-error') {
    throw new MessagesApiError('Your message could not be sent. Try again.', 503);
  }
  findConversation(conversationId);

  const content = String(message.content ?? '').trim();
  if (!content) throw new MessagesApiError('Message cannot be empty.', 400);
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new MessagesApiError(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }
  if ((message.messageType ?? 'TEXT') !== 'TEXT') {
    throw new MessagesApiError('Only text messages are supported yet.', 400);
  }

  const data = getData();
  const saved = {
    id: `msg-srv-${(serverMessageCounter += 1)}`,
    conversationId,
    senderUserId: data.currentUser.id,
    content,
    messageType: 'TEXT',
    fileUrl: null,
    fileName: null,
    isEdited: false,
    editedAt: null,
    createdAt: new Date().toISOString(),
  };

  (data.messages[conversationId] ??= []).push(saved);
  return clone(saved);
}

/**
 * Mark everything in the conversation as read.
 * @returns {Promise<null>}
 */
export async function markConversationAsRead(conversationId) {
  await wait(MOCK_DELAY_MS.write);

  findConversation(conversationId).unreadCount = 0;
  return null;
}

/**
 * Delete one of your own messages. The UI asks for confirmation first.
 * @returns {Promise<null>}
 */
export async function deleteMessage(messageId) {
  await wait(MOCK_DELAY_MS.write);

  const data = getData();
  for (const thread of Object.values(data.messages)) {
    const index = thread.findIndex((m) => m.id === messageId);
    if (index === -1) continue;

    if (thread[index].senderUserId !== data.currentUser.id) {
      throw new MessagesApiError('Only the sender can delete this message.', 403);
    }
    thread.splice(index, 1);
    return null;
  }
  throw new MessagesApiError(`Message not found: ${messageId}`, 404);
}

/**
 * Mute or unmute a conversation's notifications.
 * @returns {Promise<{ id: string, isMuted: boolean }>}
 */
export async function setConversationMuted(conversationId, isMuted) {
  await wait(MOCK_DELAY_MS.write);

  const conversation = findConversation(conversationId);
  if (typeof isMuted !== 'boolean') {
    throw new MessagesApiError('isMuted must be true or false.', 400);
  }
  conversation.isMuted = isMuted;
  return { id: conversationId, isMuted };
}

/**
 * The signed-in user's id. Mock only — in the real app this comes from the
 * auth store, not from messaging-service.
 */
export function getCurrentUserId() {
  return getData().currentUser.id;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mock server — delete everything below when wiring the real backend.
 * ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = { read: 350, write: 250 };
const PREVIEW_LENGTH = 90;

// The signed-in user's conversations. Lives for the browser session, so
// changes survive React Query refetches.
let data = null;
let serverMessageCounter = 0;

function getData() {
  if (!data) data = createMockMessagingData();
  return data;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

function getScenario() {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('mock');
  } catch {
    return null;
  }
}

function findConversation(conversationId) {
  const conversation = getData().conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    throw new MessagesApiError(`Conversation not found: ${conversationId}`, 404);
  }
  return conversation;
}

/** The last-message fields are derived from the thread, never stored. */
function toConversationResponse(conversation, thread) {
  const last = thread[thread.length - 1];
  return {
    ...conversation,
    lastMessageAt: last ? last.createdAt : null,
    lastMessagePreview: last ? last.content.slice(0, PREVIEW_LENGTH) : null,
    lastMessageFromMe: last ? last.senderUserId === getData().currentUser.id : false,
  };
}

function byRecentActivity(a, b) {
  if (!a.lastMessageAt && !b.lastMessageAt) return a.participant.name.localeCompare(b.participant.name);
  if (!a.lastMessageAt) return 1;
  if (!b.lastMessageAt) return -1;
  return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
}