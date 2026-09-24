/**
 * src/api/discoveryApi.js
 *
 * The single discovery network layer, calling the real Spring Boot
 * discovery-service directly (no mock). useDevelopers() is the only caller
 * right now; there is no per-page API file.
 *
 * Matches DiscoverySearchController and MatchScoreController exactly:
 *   GET /api/discovery/search
 *       ?skills=&experienceLevel=&interests=&openToCollaborate=
 *       → ApiResponse<List<ProfileSearchResult>>
 *     `skills` and `interests` are repeatable query params (skills=React&skills=Go),
 *     not comma-joined strings. There is NO free-text query param — the backend
 *     only filters on these four things. The result list is capped at 50 by
 *     discovery-service itself, with no pagination and no true total count
 *     beyond that cap.
 *   GET /api/discovery/search/history  → ApiResponse<List<SearchHistoryResponseDto>>
 *     The caller's own past searches. Not wired to any page yet — exposed here
 *     for a future "recent searches" feature.
 *   GET /api/discovery/match-scores/top?limit=      → ApiResponse<List<MatchScoreResponseDto>>
 *   GET /api/discovery/match-scores/{matchedUserId} → ApiResponse<MatchScoreResponseDto>
 *     Both real and read-only, but NOT wired to any page yet: MatchScoreService's
 *     own comments say the scoring model doesn't exist, so right now there is
 *     essentially nothing for these to return for a real user. Exposed here so
 *     they're ready once that's populated (Dashboard's "Suggested developers"
 *     looks like the natural home for /top, but Dashboard wasn't part of this
 *     task, so it hasn't been touched).
 *
 * Not called here, on purpose:
 *   - POST /api/discovery/match-scores — the controller's own comment says
 *     this is for the future ML engine to write arbitrary user-pair scores,
 *     not something a signed-in user's browser should ever call.
 *   - GET /api/discovery/health — not user-facing.
 *
 * There is nothing in the files I've been given that searches PROJECTS —
 * ProfileSearchResult is a developer profile, full stop. Discover Projects has
 * no backend to connect to here; see the note in DiscoverDevelopers.jsx's
 * sibling page for what that means.
 *
 * Auth: like notification-service, userId comes from the caller's cookie via
 * JwtCookieExtractor, not a request param — every call needs credentials: 'include'.
 * Same ApiResponse<T> envelope as the other services, so the same
 * unwrap-and-throw approach applies; VITE_API_BASE_URL works the same way as
 * in authApi.js/notificationsApi.js (same assumption: one origin/gateway for
 * every service — flag it if discovery-service actually lives elsewhere).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const apiError = (message, status) => Object.assign(new Error(message), { status });

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') url.searchParams.append(key, item);
      });
    } else {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

async function request(path, params) {
  let res;
  try {
    res = await fetch(buildUrl(path, params), { credentials: 'include' });
  } catch {
    throw apiError("Couldn't reach CodeMates. Check your connection and try again.", 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no/invalid body, e.g. some network-layer error pages */
  }

  if (!res.ok || json?.success === false) {
    throw apiError(json?.message || `Request failed (${res.status}).`, res.status);
  }
  return json?.data ?? null;
}

/**
 * @param {{ skills?: string[], experienceLevel?: string|null, interests?: string[], openToCollaborate?: boolean|null }} [filters]
 *   All four are optional; omitting all of them returns an unfiltered (still
 *   50-capped) list. `experienceLevel`'s valid values live in whatever enum
 *   user-profile-service defines — not in any file I've been given, so
 *   whatever DeveloperFilters.jsx already emits is passed straight through
 *   unchanged rather than guessed at here.
 * @returns {Promise<object[]>} ProfileSearchResult[] — see the type's own
 *   fields: userId, username, fullName, bio, avatarUrl, experienceLevel,
 *   githubUsername, isOpenToCollaborate, activityStatus, skills[] ({id,
 *   skillName, proficiencyLevel, yearsOfExperience}), interests[] ({id,
 *   interestName}), createdAt.
 */
export function searchDevelopers({ skills, experienceLevel, interests, openToCollaborate } = {}) {
  return request('/api/discovery/search', { skills, experienceLevel, interests, openToCollaborate });
}

/** @returns {Promise<object[]>} SearchHistoryResponseDto[], newest first */
export function getSearchHistory() {
  return request('/api/discovery/search/history');
}

/** @returns {Promise<object[]>} MatchScoreResponseDto[], highest totalMatchScore first */
export function getTopMatches(limit = 10) {
  return request('/api/discovery/match-scores/top', { limit });
}

/** @returns {Promise<object>} MatchScoreResponseDto — rejects (404-shaped) if no score exists yet for this pair */
export function getMatchScore(matchedUserId) {
  return request(`/api/discovery/match-scores/${matchedUserId}`);
}