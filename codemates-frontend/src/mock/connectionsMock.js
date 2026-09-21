import { developers } from "./developerMock";

/**
 * Mock data for the Connections page. Reuses developerMock.js's
 * `developers` array as the directory of people, rather than inventing a
 * second one — connections are just other developers on the platform.
 *
 * Shaped to match connection-service's real contracts (see
 * codemates-api-docs.md, section 4):
 *
 * ConnectionSummaryDto (accepted connections):
 *   { connectionId, otherUserId, connectedSince }
 * ConnectionResponseDto (requests):
 *   { id, senderUserId, receiverUserId, status, respondedAt, createdAt }
 *
 * ⚠️ outgoingRequests below has no real backing endpoint. The real API's
 * GET /api/social/connections/pending only returns requests RECEIVED by
 * the caller — there's no way to fetch "requests I've sent that are
 * still pending." A real integration needs a new endpoint added to
 * connection-service (e.g. GET /api/social/connections/sent) before this
 * section can be backed by real data; it isn't a "point it at a real URL
 * later" situation.
 */

// Stands in for the authenticated user until real auth exists.
export const CURRENT_USER_ID = "me";

// developer.id -> professional title shown on connection cards. Kept
// here rather than added to developerMock.js — that file is already
// used by Discover Developers, and this field is specific to how the
// Connections page presents people.
const roleByDeveloperId = {
  1: "Frontend Engineer",
  2: "Backend Engineer",
  3: "ML Engineer",
  4: "Frontend Developer",
  5: "Backend Engineer",
  6: "Full-Stack Developer",
  7: "Data Engineer",
  8: "Frontend Developer",
};

/**
 * Look up a developer by id and attach their role for this page.
 * Returns null if no matching developer exists (defensive — mock ids
 * below are all valid, but a real API response might reference a user
 * that's since been deleted).
 */
export function findDeveloper(id) {
  const developer = developers.find((d) => d.id === id);
  if (!developer) return null;
  return { ...developer, role: roleByDeveloperId[id] ?? "Developer" };
}

export const acceptedConnections = [
  { connectionId: "conn-1", otherUserId: "2", connectedSince: "2026-07-14T10:00:00Z" },
  { connectionId: "conn-2", otherUserId: "6", connectedSince: "2026-08-02T09:30:00Z" },
  { connectionId: "conn-3", otherUserId: "7", connectedSince: "2026-08-20T15:45:00Z" },
];

// Received by me, still pending — matches the real /pending endpoint.
export const incomingRequests = [
  {
    id: "req-1",
    senderUserId: "3",
    receiverUserId: CURRENT_USER_ID,
    status: "PENDING",
    respondedAt: null,
    createdAt: "2026-09-17T12:00:00Z",
  },
  {
    id: "req-2",
    senderUserId: "8",
    receiverUserId: CURRENT_USER_ID,
    status: "PENDING",
    respondedAt: null,
    createdAt: "2026-09-18T09:20:00Z",
  },
];

// Sent by me, still pending — see the ⚠️ note above.
export const outgoingRequests = [
  {
    id: "req-3",
    senderUserId: CURRENT_USER_ID,
    receiverUserId: "1",
    status: "PENDING",
    respondedAt: null,
    createdAt: "2026-09-16T14:30:00Z",
  },
  {
    id: "req-4",
    senderUserId: CURRENT_USER_ID,
    receiverUserId: "5",
    status: "PENDING",
    respondedAt: null,
    createdAt: "2026-09-19T08:10:00Z",
  },
];