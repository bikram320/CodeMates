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
//   GET /api/projects/my                          (see projectsApi.js — real now)
//   GET /api/discovery/match-scores/top            (see discoveryApi.js — real now)
//
// ML integration (the part that used to be skipped):
//   MatchScoreResponseDto only has {matchedUserId, totalMatchScore, ...} —
//   no name/avatar/bio, and there's still no GET /api/users/{id} by UUID to
//   resolve one. So instead of adding a new backend endpoint, this file
//   cross-references two calls it already had to make anyway:
//     1. getTopMatches()            -> real ranking from the FastAPI model,
//                                       via MatchSyncService -> discovery-service
//     2. /api/users/search (pool)   -> the actual profile data (avatar, bio, skills)
//   suggestedDevelopers is the search-pool profiles, ordered by the ML
//   model's totalMatchScore wherever a match exists, then padded with any
//   remaining candidates (no score yet).
//
//   getTopMatches() only READS match_scores -- it never causes the FastAPI
//   model to actually run. That row only exists after someone calls
//   POST /api/discovery/match-scores/sync. Nothing was calling it, so the
//   model was never invoked and match_scores was empty (confirmed from the
//   Spring Boot / FastAPI logs: /top ran real SELECTs against an empty
//   table, FastAPI never received a request). Fixed by having this file
//   call syncMatches() itself the first time /top comes back empty for this
//   user, then re-reading /top -- see below.
//
// NOT used, and why:
//   /api/projects/{id}/tasks — no Task controller yet.
//
// TODO confirm once backend responds:
//   - NotificationPageResponse's list field name (guessed `notifications`)
//   - UnreadCountResponse's field name (guessed `unreadCount`)
//   - ProjectResponse's status field / values (guessed `status: 'ACTIVE'`)

import client from './client';
import { getTopMatches, syncMatches } from './discoveryApi';
import { getMyProjects } from './projectsApi';

const SUGGESTED_LIMIT = 4;
const ACTIVITY_LIMIT = 6;
// Pull more matches than we need since some ranked matches may not be in the
// openToCollaborate search pool we fetch below (private profile, filtered out,
// etc.) — extra headroom means we still fill 4 slots by ML rank where possible.
const MATCH_FETCH_LIMIT = SUGGESTED_LIMIT * 3;

export async function getDashboard() {
  const [profile, notificationsPage, unread, connections, pending, candidatePool, matchScores, myProjects] =
      await Promise.all([
        client.get('/api/users/me'),
        client.get(`/api/notifications?limit=${ACTIVITY_LIMIT}`).catch(() => null),
        client.get('/api/notifications/unread-count').catch(() => null),
        client.get('/api/social/connections').catch(() => []),
        client.get('/api/social/connections/pending').catch(() => []),
        client.get('/api/users/search?openToCollaborate=true').catch(() => []),
        getTopMatches(MATCH_FETCH_LIMIT).catch(() => []),
        getMyProjects().catch(() => []),
      ]);

  const otherUserIds = (candidatePool ?? [])
      .map((p) => p.userId)
      .filter((id) => id && id !== profile?.userId);

  // This is the piece that was actually missing: getTopMatches() only READS
  // match_scores, it never causes anything to be computed. If it came back
  // empty, this user has never had /sync run for them, so the FastAPI model
  // has genuinely never been called. Trigger it now, then re-read /top.
  // After the first successful run, match_scores has rows and every later
  // dashboard load skips straight to the fast path above -- this only adds
  // latency on a user's very first load (or until sync succeeds).
  let effectiveMatchScores = matchScores;
  if ((!matchScores || matchScores.length === 0) && otherUserIds.length > 0 && profile?.userId) {
    try {
      await syncMatches(profile.userId, otherUserIds);
      effectiveMatchScores = await getTopMatches(MATCH_FETCH_LIMIT);
    } catch {
      // No GitHub profile linked yet, ml-service unreachable, etc. -- fall
      // back to the plain candidate pool, same as before ML was wired in.
      effectiveMatchScores = [];
    }
  }

  return {
    user: normalizeProfile(profile),
    stats: {
      connections: connections?.length ?? 0,
      pendingRequests: pending?.length ?? 0,
      unreadNotifications: unread?.unreadCount ?? 0, // confirm field name
      activeProjects: (myProjects ?? []).filter((p) => p.status !== 'ARCHIVED').length,
    },
    recentActivity: (notificationsPage?.notifications ?? []).map(normalizeNotification), // confirm field name
    suggestedDevelopers: buildSuggestedDevelopers(candidatePool, effectiveMatchScores, profile?.userId),
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

/**
 * @param {number|null} matchScore MatchScoreResponseDto.totalMatchScore (0-100),
 *   or null when the ML model hasn't scored this user yet.
 */
function normalizeSuggestedDeveloper(p, matchScore = null) {
  return {
    id: p.id,
    userId: p.userId,
    fullName: p.fullName,
    username: p.username,
    initials: getInitials(p.fullName),
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    experienceLevel: p.experienceLevel,
    skills: p.skills ?? [],
    matchScore,
  };
}

/**
 * Orders the real candidate-pool profiles by the ML model's ranking
 * (matchScores, already sorted totalMatchScore DESC by the backend), then
 * pads out to SUGGESTED_LIMIT with any unscored candidates so the section
 * never looks empty just because sync hasn't run for everyone yet.
 */
function buildSuggestedDevelopers(candidatePool, matchScores, selfUserId) {
  const pool = (candidatePool ?? []).filter((p) => p.userId !== selfUserId);
  const profileById = new Map(pool.map((p) => [p.userId, p]));

  const result = [];
  const usedIds = new Set();

  for (const m of matchScores ?? []) {
    const p = profileById.get(m.matchedUserId);
    if (!p) continue; // ML scored them, but they're not in the fetched pool
    result.push(normalizeSuggestedDeveloper(p, m.totalMatchScore));
    usedIds.add(p.userId);
    if (result.length >= SUGGESTED_LIMIT) return result;
  }

  for (const p of pool) {
    if (usedIds.has(p.userId)) continue;
    result.push(normalizeSuggestedDeveloper(p, null));
    if (result.length >= SUGGESTED_LIMIT) break;
  }

  return result;
}