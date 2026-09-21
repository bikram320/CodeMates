/**
 * src/mock/notificationsMock.js
 *
 * In-memory stand-in for notification-service (api docs §8). Only
 * src/api/notificationsApi.js should import this file.
 *
 * Shapes mirror the real API exactly:
 *   NotificationResponse
 *     { id, recipientUserId, senderUserId, type, title, body,
 *       referenceId, referenceType, isRead, readAt, createdAt }
 *   NotificationPageResponse  { notifications, nextCursor, hasMore }
 *
 * `type` uses the real backend NotificationType constants, except
 * CONNECTION_REQUEST, which is UI-only until social-service publishes events.
 *
 * State lives in module memory, so read/delete changes survive React Query
 * refetches but reset on a full page reload.
 *
 * ── Dev scenarios (reads only) ────────────────────────────────────────────────
 *   ?mockNotifications=empty   → GET returns no notifications
 *   ?mockNotifications=error   → GET fails with a 503
 *   (or set VITE_MOCK_NOTIFICATIONS=empty|error in .env)
 */

const ME = "u-me-0001";
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

const seed = (id, type, refType, minutes, isRead, title, body) => ({
  id: `n-${id}`,
  recipientUserId: ME,
  senderUserId: `u-${id}`,
  type,
  title,
  body,
  referenceId: `ref-${id}`,
  referenceType: refType,
  isRead,
  readAt: isRead ? minutesAgo(Math.max(minutes - 20, 1)) : null,
  createdAt: minutesAgo(minutes),
});

const buildSeed = () => [
  seed("01", "PROJECT_INVITATION", "INVITATION", 12, false, "Project invitation",
    "Aarav Sharma invited you to join DevPulse as a Contributor. The invitation expires in 7 days."),
  seed("02", "CONNECTION_REQUEST", "USER", 38, false, "New connection request",
    "Priya Nair (React, Node.js) wants to connect with you."),
  seed("03", "MESSAGE_RECEIVED", "CONVERSATION", 65, false, "New message in DevPulse",
    "Rohan Karki: Pushed the auth fix to the develop branch. Can someone review it before standup?"),
  seed("04", "TASK_ASSIGNED", "TASK", 120, false, "Task assigned to you",
    "Sita Gurung assigned you \"Add JWT refresh interceptor\" in DevPulse. Due Sep 24."),
  seed("05", "GITHUB_SYNC_COMPLETED", "PROJECT", 185, false, "GitHub sync completed",
    "12 repositories synced. 8 new commits were counted toward your contribution score."),
  seed("06", "PROJECT_MEMBER_JOINED", "PROJECT", 260, false, "Invitation accepted",
    "Bikash Thapa accepted your invitation and joined CodeMates Mobile as a Reviewer."),
  seed("07", "TASK_STATUS_CHANGED", "TASK", 1560, true, "Task moved to Review",
    "Rohan Karki moved \"Kanban drag-and-drop\" from In Progress to Review."),
  seed("08", "TASK_COMPLETED", "TASK", 1740, true, "Task completed",
    "Anita Rai marked \"Design contribution score card\" as Done in CodeMates Mobile."),
  seed("09", "PROJECT_CREATED", "PROJECT", 1900, true, "Project created",
    "OpenTrail is ready. Invite developers to start building with your team."),
  seed("10", "MESSAGE_RECEIVED", "CONVERSATION", 4300, true, "New message in OpenTrail",
    "Kiran Adhikari: Shared the Figma link for the trail map screens in Resources."),
  seed("11", "PROJECT_MEMBER_REMOVED", "PROJECT", 5800, true, "Removed from project",
    "You were removed from ML Study Group by the project leader."),
  seed("12", "TASK_ASSIGNED", "TASK", 8600, true, "Task assigned to you",
    "Aarav Sharma assigned you \"Write API docs for /projects\" in DevPulse. Due Sep 15."),
  seed("13", "WELCOME", "USER", 14400, true, "Welcome to CodeMates",
    "Complete your profile with skills and a GitHub link so teammates can find you."),
];

let store = buildSeed();

/* ── helpers ─────────────────────────────────────────────────────────────── */

const wait = (base) => new Promise((r) => setTimeout(r, base + Math.random() * 150));

const apiError = (message, status) => Object.assign(new Error(message), { status });

function getScenario() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("mockNotifications");
    return fromUrl || import.meta.env?.VITE_MOCK_NOTIFICATIONS || "default";
  } catch {
    return "default";
  }
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

/* ── mock endpoints ──────────────────────────────────────────────────────── */

/** GET /api/notifications?before=&limit=&unreadOnly= → NotificationPageResponse */
export async function mockGetNotifications({ before, limit = 20, unreadOnly = false } = {}) {
  await wait(550);

  const scenario = getScenario();
  if (scenario === "error") {
    throw apiError("Couldn't reach the notification service. Try again in a moment.", 503);
  }

  const cap = Math.min(Math.max(limit, 1), 100); // server clamps 1–100
  let rows = scenario === "empty" ? [] : [...store].sort(byNewest);
  if (unreadOnly) rows = rows.filter((n) => !n.isRead);
  if (before) rows = rows.filter((n) => new Date(n.createdAt) < new Date(before));

  const page = rows.slice(0, cap);
  const hasMore = rows.length > cap;
  return {
    notifications: page.map((n) => ({ ...n })),
    nextCursor: hasMore ? page[page.length - 1].createdAt : null,
    hasMore,
  };
}

/** PATCH /api/notifications/{id}/read → NotificationResponse */
export async function mockMarkNotificationAsRead(id) {
  await wait(200);
  const target = store.find((n) => n.id === id);
  if (!target) throw apiError("Notification not found.", 404);
  if (!target.isRead) {
    target.isRead = true;
    target.readAt = new Date().toISOString();
  }
  return { ...target };
}

/** PATCH /api/notifications/read-all → { updatedCount } */
export async function mockMarkAllNotificationsAsRead() {
  await wait(250);
  const readAt = new Date().toISOString();
  let updatedCount = 0;
  store.forEach((n) => {
    if (!n.isRead) {
      n.isRead = true;
      n.readAt = readAt;
      updatedCount += 1;
    }
  });
  return { updatedCount };
}

/** DELETE /api/notifications/{id} → null (soft delete on the real backend) */
export async function mockDeleteNotification(id) {
  await wait(200);
  if (!store.some((n) => n.id === id)) throw apiError("Notification not found.", 404);
  store = store.filter((n) => n.id !== id);
  return null;
}

/** Dev/test helper: restore the original seed data. */
export function resetMockNotifications() {
  store = buildSeed();
}