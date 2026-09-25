// src/api/dashboardApi.js
//
// Dashboard data layer — hits the real API via src/api/client.js.
// client.js is shared across pages and is untouched by this file.
//
// Backend calls used:
//   GET /api/users/me
//   GET /api/notifications?limit=6
//   GET /api/notifications/unread-count
//   GET /api/social/connections
//   GET /api/social/connections/pending
//   GET /api/users/search?openToCollaborate=true
//
// NOT used, and why:
//   /api/projects/my, /api/projects/{id}/tasks  — no Project/Task controller
//   /api/discovery/match-scores/top             — MatchScoreResponseDto has only
//                                                  matchedUserId (UUID); no
//                                                  GET /api/users/{id} by UUID
//                                                  exists to resolve a name/avatar.
//                                                  Falls back to /api/users/search.
//
// TODO confirm once backend responds:
//   - NotificationPageResponse's list field name (guessed `notifications`)
//   - UnreadCountResponse's field name (guessed `unreadCount`)

import client from './client';

const SUGGESTED_LIMIT = 4;
const ACTIVITY_LIMIT = 6;

export async function getDashboard() {
  const [profile, notificationsPage, unread, connections, pending, suggested] =
    await Promise.all([
      client.get('/api/users/me'),
      client.get(`/api/notifications?limit=${ACTIVITY_LIMIT}`).catch(() => null),
      client.get('/api/notifications/unread-count').catch(() => null),
      client.get('/api/social/connections').catch(() => []),
      client.get('/api/social/connections/pending').catch(() => []),
      client.get('/api/users/search?openToCollaborate=true').catch(() => []),
    ]);

  return {
    user: normalizeProfile(profile),
    stats: {
      connections: connections?.length ?? 0,
      pendingRequests: pending?.length ?? 0,
      unreadNotifications: unread?.unreadCount ?? 0, // confirm field name
      skills: profile?.skills?.length ?? 0,
    },
    recentActivity: (notificationsPage?.notifications ?? []).map(normalizeNotification), // confirm field name
    suggestedDevelopers: (suggested ?? [])
      .filter((p) => p.userId !== profile.userId)
      .slice(0, SUGGESTED_LIMIT)
      .map(normalizeSuggestedDeveloper),
  };
}

export const sendConnectionRequest = (receiverUserId) =>
  client.post('/api/social/connections/request', { receiverUserId });

// ── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatRelative(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function normalizeProfile(p) {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.userId,
    username: p.username,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    experienceLevel: p.experienceLevel,
    initials: getInitials(p.fullName),
  };
}

function normalizeNotification(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    timestamp: formatRelative(n.createdAt),
  };
}

function normalizeSuggestedDeveloper(p) {
  return {
    id: p.id,
    userId: p.userId,
    name: p.fullName,
    username: p.username,
    initials: getInitials(p.fullName),
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    experienceLevel: p.experienceLevel,
    skills: p.skills ?? [],
  };
}