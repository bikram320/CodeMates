/**
 * Mock chat data, shaped to match messaging-service's real response
 * contracts (see codemates-api-docs.md, section 9).
 *
 * Fixed from the previous version: message ids are now globally unique
 * ("c1-m1" instead of "m1" reused in every conversation) — the old
 * scheme collided across conversations, which breaks any lookup-by-id
 * operation (editMessage/deleteMessage).
 *
 * Key things this mirrors on purpose:
 * - ConversationResponse has NO `name` field (for PROJECT or DIRECT) —
 *   display names are resolved client-side, not stored on the conversation.
 * - MessageResponse has NO sender name/avatar — only `senderUserId`.
 * - Sending/editing/deleting here are mock REST functions for development
 *   convenience only — see chatApi.js for exactly where each one diverges
 *   from the real API (sendMessage especially: no REST equivalent exists
 *   for it at all in the real backend).
 */

export const chatUsers = {
  u1: { name: "Aria Chen", avatarUrl: "https://i.pravatar.cc/150?img=47" },
  u2: { name: "Sam Osei", avatarUrl: "https://i.pravatar.cc/150?img=15" },
  u3: { name: "Jonas Berg", avatarUrl: "https://i.pravatar.cc/150?img=51" },
  u4: { name: "Devon Marsh", avatarUrl: "https://i.pravatar.cc/150?img=12" },
  u5: { name: "Mika Tanaka", avatarUrl: "https://i.pravatar.cc/150?img=25" },
};

// Stands in for the authenticated user until real auth/session exists.
export const CURRENT_USER_ID = "u2";

// Mirrors PresenceBroadcast { userId, status }.
export const presence = {
  u1: "ONLINE",
  u2: "ONLINE",
  u3: "OFFLINE",
  u4: "ONLINE",
  u5: "OFFLINE",
};

export const projectConversations = {
  p1: {
    id: "c1",
    type: "PROJECT",
    projectId: "p1",
    createdByUserId: "u1",
    lastMessageAt: "2026-09-19T14:32:00Z",
    lastMessagePreview: "Sounds good, I'll push that today.",
    participants: [
      { userId: "u1", lastReadAt: "2026-09-19T14:00:00Z", isMuted: false },
      { userId: "u2", lastReadAt: "2026-09-19T14:32:00Z", isMuted: false },
      { userId: "u3", lastReadAt: "2026-09-19T13:10:00Z", isMuted: false },
    ],
    createdAt: "2026-09-01T09:00:00Z",
  },
  p2: {
    id: "c2",
    type: "PROJECT",
    projectId: "p2",
    createdByUserId: "u4",
    lastMessageAt: "2026-09-18T11:05:00Z",
    lastMessagePreview: "Pushed the OTLP branch, PTAL.",
    participants: [
      { userId: "u4", lastReadAt: "2026-09-18T11:05:00Z", isMuted: false },
      { userId: "u5", lastReadAt: "2026-09-18T10:50:00Z", isMuted: false },
    ],
    createdAt: "2026-08-20T09:00:00Z",
  },
};

export const directConversations = [
  {
    id: "c3",
    type: "DIRECT",
    projectId: null,
    createdByUserId: "u2",
    lastMessageAt: "2026-09-17T16:00:00Z",
    lastMessagePreview: "Thanks for the review!",
    participants: [
      { userId: "u2", lastReadAt: "2026-09-17T16:00:00Z", isMuted: false },
      { userId: "u5", lastReadAt: null, isMuted: false },
    ],
    createdAt: "2026-09-10T09:00:00Z",
  },
];

export const conversationMessages = {
  c1: [
    {
      id: "c1-m1",
      conversationId: "c1",
      senderUserId: "u1",
      content: "Morning team — let's sync on the WebSocket sync work today.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-19T09:02:00Z",
    },
    {
      id: "c1-m2",
      conversationId: "c1",
      senderUserId: "u2",
      content: "On it, should have a draft PR up by this afternoon.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-19T09:05:00Z",
    },
    {
      id: "c1-m3",
      conversationId: "c1",
      senderUserId: "u3",
      content: "I'll start on the accessibility audit once that lands.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-19T09:07:00Z",
    },
    {
      id: "c1-m4",
      conversationId: "c1",
      senderUserId: "u1",
      content: "Perfect. Ping me if you hit any blockers.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-19T09:08:00Z",
    },
    {
      id: "c1-m5",
      conversationId: "c1",
      senderUserId: "u2",
      content: "Sounds good, I'll push that today.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-19T14:32:00Z",
    },
  ],

  c2: [
    {
      id: "c2-m1",
      conversationId: "c2",
      senderUserId: "u4",
      content: "Started on the OpenTelemetry exporter.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-18T10:40:00Z",
    },
    {
      id: "c2-m2",
      conversationId: "c2",
      senderUserId: "u5",
      content: "Nice, let me know when there's something to review.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-18T10:50:00Z",
    },
    {
      id: "c2-m3",
      conversationId: "c2",
      senderUserId: "u4",
      content: "Pushed the OTLP branch, PTAL.",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-18T11:05:00Z",
    },
  ],

  c3: [
    {
      id: "c3-m1",
      conversationId: "c3",
      senderUserId: "u5",
      content: "Hey, thanks for reviewing my PR!",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-17T15:55:00Z",
    },
    {
      id: "c3-m2",
      conversationId: "c3",
      senderUserId: "u2",
      content: "Of course, looked solid!",
      messageType: "TEXT",
      fileUrl: null,
      fileName: null,
      isEdited: false,
      editedAt: null,
      createdAt: "2026-09-17T16:00:00Z",
    },
  ],
};