/**
 * Mock direct-message data for the Messages page.
 *
 * Only messagesApi.js should import this file, so it can be deleted when the
 * real endpoints are wired in.
 *
 * createMockMessagingData() returns a fresh object each call (timestamps are
 * relative to "now"):
 *
 * {
 *   currentUser: { id, name, username },
 *   conversations: [{
 *     id, type: 'DIRECT',
 *     participant: { userId, name, username, avatarUrl,
 *                    presence: 'ONLINE' | 'OFFLINE', lastSeenAt: ISO | null },
 *     isMuted, unreadCount
 *   }],
 *   messages: {
 *     [conversationId]: [{        oldest → newest
 *       id, conversationId, senderUserId, content,
 *       messageType: 'TEXT', fileUrl, fileName,
 *       isEdited, editedAt, createdAt
 *     }]
 *   }
 * }
 *
 * The last-message fields the UI shows (lastMessageAt, lastMessagePreview,
 * lastMessageFromMe) are NOT stored — messagesApi.js derives them from the
 * thread, so sending or deleting a message keeps the list consistent.
 */

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h) => minutesAgo(h * 60);
const daysAgo = (d) => hoursAgo(d * 24);

const avatar = (seed) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

/** The signed-in user (the leader from the Team page mock). */
export const MOCK_CURRENT_USER = {
  id: 'b7f3c1a2-4e5d-4a86-9c31-0d2e7a5f1b01',
  name: 'Aarav Sharma',
  username: 'aarav_dev',
};

const PEOPLE = {
  mia: { userId: '3d9a5e64-8b1c-4f27-a0d3-6c52e1f9a102', name: 'Mia Chen', username: 'miachen', avatarUrl: avatar('miachen') },
  diego: { userId: 'e21c7f08-5a36-4d9b-8e74-b0a3d6c8f203', name: 'Diego Alvarez', username: 'diego_codes', avatarUrl: null },
  priya: { userId: '5f8b2d91-c4e7-4a13-b6f0-92d1a7e35304', name: 'Priya Nair', username: 'priya_n', avatarUrl: avatar('priya_n') },
  tomas: { userId: 'a04e6c37-d9f2-4b85-9a1c-7e38b5d0c405', name: 'Tomás Novak', username: 'tnovak', avatarUrl: null },
  sara: { userId: 'c7d15a82-3e60-4f9c-b248-1a9f4e7d6506', name: 'Sara Okafor', username: 'sara_ok', avatarUrl: avatar('sara_ok') },
  liam: { userId: '19b3e4f6-7a58-4c21-8d0e-f5c2a9b17607', name: 'Liam Becker', username: 'liambecker', avatarUrl: null },
  kaito: { userId: '8e6f0b45-2c19-4d73-a5b8-3d7e91c4f808', name: 'Kaito Mori', username: 'kaito_ml', avatarUrl: avatar('kaito_ml') },
  nina: { userId: 'd52a7b19-6e04-4c38-b1f7-08a3c9e5d209', name: 'Nina Rossi', username: 'nina_codes', avatarUrl: null },
};

export function createMockMessagingData() {
  let counter = 0;

  /** who: 'me' or a PEOPLE key */
  const msg = (conversationId, who, content, createdAt) => ({
    id: `msg-${(counter += 1)}`,
    conversationId,
    senderUserId: who === 'me' ? MOCK_CURRENT_USER.id : PEOPLE[who].userId,
    content,
    messageType: 'TEXT',
    fileUrl: null,
    fileName: null,
    isEdited: false,
    editedAt: null,
    createdAt,
  });

  const messages = {
    'conv-mia': [
      msg('conv-mia', 'mia', "Hey Aarav! Saw you're wiring the team page to the API hook 👀", hoursAgo(27)),
      msg('conv-mia', 'me', 'Yep, just finished `useProjectTeam`. Mock layer first, then we swap in the real endpoints.', hoursAgo(27)),
      msg('conv-mia', 'mia', 'Nice. One thing though: the role filter resets whenever the list refetches. Is that expected?', hoursAgo(26.9)),
      msg('conv-mia', 'me', "Good catch, it shouldn't. Filters live in the page state, so I suspect the `key` on the list. Checking now.", hoursAgo(26.8)),
      msg('conv-mia', 'me', 'Found it. I was remounting the list on every refetch. Fix is on `feature/team-api`.', hoursAgo(2.2)),
      msg('conv-mia', 'mia', 'Perfect, that was quick 🙌', minutesAgo(40)),
      msg('conv-mia', 'mia', 'Pushed the role filter fix on top of yours. Can you review when you get a sec?', minutesAgo(12)),
      msg('conv-mia', 'mia', 'Also added role counts to the filter pills.', minutesAgo(11)),
    ],
    'conv-diego': [
      msg('conv-diego', 'diego', 'Are we standardising on the `ApiResponse` envelope on the frontend too?', daysAgo(2)),
      msg('conv-diego', 'me', 'Yes. Unwrap `data` in one place in the API layer and throw on `success: false`.', daysAgo(2)),
      msg('conv-diego', 'diego', "Cool, I'll do the same in the chat client.", daysAgo(2)),
      msg('conv-diego', 'diego', "Heads up: the gateway's 401 body has no `timestamp` field, so don't rely on it.", hoursAgo(3)),
      msg('conv-diego', 'me', "Thanks, good to know. Sounds good, let's sync after standup.", hoursAgo(2)),
    ],
    'conv-priya': [
      msg('conv-priya', 'priya', 'Are you free to look at the contribution score lag this week?', daysAgo(1)),
      msg('conv-priya', 'me', 'Yep. Can you open an issue with repro steps?', daysAgo(1)),
      msg('conv-priya', 'priya', 'Opened #41.', hoursAgo(7)),
      msg('conv-priya', 'priya', 'Repro: it only happens after a second sync. The first one is fine.', hoursAgo(3)),
    ],
    'conv-sara': [
      msg('conv-sara', 'me', 'Fixed the focus rings on the modals. Can you double-check the contrast?', daysAgo(3)),
      msg('conv-sara', 'sara', 'Looking now.', daysAgo(3)),
      msg('conv-sara', 'sara', 'Ratio is 4.8:1 on the dark surface, that passes AA.', daysAgo(2)),
      msg('conv-sara', 'me', 'Great, closing #38.', daysAgo(2)),
      msg('conv-sara', 'sara', "Also, the invite modal doesn't return focus to the trigger on close.", hoursAgo(20)),
      msg('conv-sara', 'sara', "I'll open an issue for it.", hoursAgo(20)),
    ],
    'conv-tomas': [
      msg('conv-tomas', 'me', 'Did the node_modules cache help?', daysAgo(2)),
      msg('conv-tomas', 'tomas', 'Cache is working. CI went from about 4 min to 90s.', daysAgo(2)),
    ],
    'conv-kaito': [
      msg('conv-kaito', 'kaito', 'Hi Aarav! I got your invite to CodeMates as a reviewer 🙂', minutesAgo(50)),
      msg('conv-kaito', 'kaito', 'Before I accept: is the match score service part of the scope?', minutesAgo(48)),
      msg('conv-kaito', 'kaito', "I've been working on skill-similarity models and would love to help there.", minutesAgo(46)),
    ],
    'conv-nina': [],
    'conv-liam': [
      msg('conv-liam', 'me', 'Welcome to the team, Liam! Ping me if you need anything.', daysAgo(8)),
      msg('conv-liam', 'liam', 'Will do, thanks!', daysAgo(8)),
    ],
  };

  const conversation = (id, personKey, { presence = 'OFFLINE', lastSeenAt = null, unreadCount = 0, isMuted = false } = {}) => {
    const person = PEOPLE[personKey];
    return {
      id,
      type: 'DIRECT',
      participant: {
        userId: person.userId,
        name: person.name,
        username: person.username,
        avatarUrl: person.avatarUrl,
        presence,
        lastSeenAt,
      },
      isMuted,
      unreadCount,
    };
  };

  const conversations = [
    conversation('conv-mia', 'mia', { presence: 'ONLINE', unreadCount: 2 }),
    conversation('conv-diego', 'diego', { presence: 'ONLINE' }),
    conversation('conv-priya', 'priya', { lastSeenAt: hoursAgo(2), unreadCount: 1 }),
    conversation('conv-sara', 'sara', { lastSeenAt: hoursAgo(19), unreadCount: 2, isMuted: true }),
    conversation('conv-tomas', 'tomas', { lastSeenAt: daysAgo(2) }),
    conversation('conv-kaito', 'kaito', { presence: 'ONLINE', unreadCount: 3 }),
    conversation('conv-nina', 'nina', { lastSeenAt: daysAgo(5) }),
    conversation('conv-liam', 'liam', { lastSeenAt: daysAgo(8) }),
  ];

  return { currentUser: { ...MOCK_CURRENT_USER }, conversations, messages };
}