/**
 * profileApi — real calls to the user-profile / social service.
 *
 * Talks directly to the Spring Boot backend documented in ProfileController /
 * AddSkillRequest / AddInterestRequest / UpdateProfileRequest /
 * ProfileResponse / SkillResponse / InterestResponse / ApiResponse. There is
 * no mock layer for this module.
 *
 * Endpoints (all under /api/users; auth is an httpOnly `access_token` cookie
 * read server-side by ProfileController.extractUserId, so no Authorization
 * header is sent here):
 *   GET    /api/users/me                                       -> ProfileResponse
 *   GET    /api/users/search?skills=&experienceLevel=&interests=&openToCollaborate=
 *                                                                -> ProfileResponse[] (public, no auth)
 *   GET    /api/users/{username}                                -> ProfileResponse (public)
 *   PUT    /api/users/me                    UpdateProfileRequest -> ProfileResponse
 *   POST   /api/users/me/skills             AddSkillRequest      -> SkillResponse (201)
 *   DELETE /api/users/me/skills/{skillId}                        -> null
 *   POST   /api/users/me/interests          AddInterestRequest   -> InterestResponse (201)
 *   DELETE /api/users/me/interests/{interestId}                  -> null
 *
 * That's the full surface the backend exposes, so that's the full surface
 * here too — no avatar upload (avatarUrl is just a pasted URL string), no
 * bulk skills/interests update (each is its own add/remove call), no email or
 * password anywhere in this service (that's auth-service, not shown), and no
 * notification or app-preference endpoints.
 *
 * ⚠️ Assumptions — please confirm/adjust once more of the backend is shared:
 *  - Base URL: requests go to a relative `/api/users/...` path — only correct
 *    if the frontend is served through the same gateway/origin as the API
 *    (or a dev-server proxy rewrites it). Set VITE_API_BASE_URL if the
 *    gateway is on a different origin.
 *  - Auth: every request sends `credentials: 'include'` so the browser
 *    attaches the httpOnly `access_token` cookie ProfileController reads
 *    directly. If that cookie isn't set on this origin, or CORS doesn't
 *    allow credentialed requests, every /me call here 401s (the two public
 *    endpoints — search and get-by-username — don't need it).
 *  - Error shape: no global exception handler was included, so this assumes
 *    a failed call still comes back as the `ApiResponse` envelope
 *    (`success:false`, `message`), possibly alongside a non-2xx status.
 *    Concretely, that means:
 *      · ProfileNotFoundException (unknown username, or a brand-new account
 *        whose Kafka-created profile hasn't landed yet) → treated as a 404.
 *      · A taken username ("Username already taken: x") and a duplicate
 *        skill/interest ("Skill already exists: x") are both thrown as
 *        IllegalArgumentException — treated as a 400. If your exception
 *        handler maps these to different statuses (409 would fit better),
 *        tell me and I'll adjust `isNotFoundError` / the status checks.
 *  - Search: `skills`/`interests` are sent as repeated query params
 *    (`?skills=a&skills=b`), matching Spring's default binding for
 *    `@RequestParam List<String>`.
 *  - Skill/interest ids: SkillResponse/InterestResponse only return an `id`
 *    (no `skillName`/`interestName` echoed back beyond what was sent), which
 *    is fine since ProfileResponse.skills/interests already carry the full
 *    objects — the profile is always refetched after add/remove.
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? '';

/** Error type thrown by every function here. `status` is the HTTP status (0 = network error). */
export class ProfileApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ProfileApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new ProfileApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  const raw = await response.text();
  let body = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      // Non-JSON body (e.g. an HTML error page from a proxy) — fall through
      // to the status-based error below.
    }
  }

  if (!response.ok || body?.success === false) {
    throw new ProfileApiError(
      body?.message || `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return body?.data;
}

const toQueryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
    else search.append(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

/**
 * The signed-in user's own profile.
 * Rejects with a 404 ProfileApiError (see isNotFoundError) if it doesn't
 * exist yet — normal for a brand-new account before the Kafka-driven
 * profile-creation event has landed.
 * @returns {Promise<object>} ProfileResponse
 */
export function getMyProfile() {
  return request('/api/users/me');
}

/**
 * A developer's public profile by username.
 * Rejects with a 404 ProfileApiError if no such username exists.
 * @returns {Promise<object>} ProfileResponse
 */
export function getProfileByUsername(username) {
  return request(`/api/users/${encodeURIComponent(username)}`);
}

/**
 * Search developers. Every filter is optional and combinable; results are
 * capped at 50 by the backend (no pagination).
 * @param filters { skills?: string[], experienceLevel?: string,
 *                  interests?: string[], openToCollaborate?: boolean }
 * @returns {Promise<Array>} ProfileResponse[]
 */
export function searchProfiles(filters = {}) {
  return request(`/api/users/search${toQueryString(filters)}`);
}

/**
 * Update the signed-in user's own profile. Only send the keys you want
 * changed — omitted keys are left untouched (the backend only applies
 * fields that are present and non-null), so a section can PUT just its own
 * slice, e.g. updateProfile({ fullName, bio }).
 * @param partialData  a subset of UpdateProfileRequest's fields
 * @returns {Promise<object>} the full, updated ProfileResponse
 */
export function updateProfile(partialData) {
  return request('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(partialData),
  });
}

/**
 * Add a skill to the signed-in user's profile.
 * @param skill { skillName, proficiencyLevel?, yearsOfExperience? }
 * @returns {Promise<object>} SkillResponse
 */
export function addSkill(skill) {
  return request('/api/users/me/skills', {
    method: 'POST',
    body: JSON.stringify(skill),
  });
}

/** Remove a skill from the signed-in user's profile. */
export function removeSkill(skillId) {
  return request(`/api/users/me/skills/${skillId}`, { method: 'DELETE' });
}

/**
 * Add an interest to the signed-in user's profile.
 * @param interest { interestName }
 * @returns {Promise<object>} InterestResponse
 */
export function addInterest(interest) {
  return request('/api/users/me/interests', {
    method: 'POST',
    body: JSON.stringify(interest),
  });
}

/** Remove an interest from the signed-in user's profile. */
export function removeInterest(interestId) {
  return request(`/api/users/me/interests/${interestId}`, { method: 'DELETE' });
}

/** True when an error just means "no such profile" (404), not a real failure. */
export function isNotFoundError(error) {
  return error instanceof ProfileApiError && error.status === 404;
}