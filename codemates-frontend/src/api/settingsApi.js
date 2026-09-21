/**
 * settingsApi — data access for the Account Settings page.
 *
 * ⚠️ MOCK ONLY. No Spring Boot calls. Every function runs against an
 * in-memory "mock server" (bottom of this file) with a small artificial delay.
 * The exported functions are the contract the hook depends on; when the
 * backend is wired in, replace the *bodies* and delete the mock section.
 *
 * Password changes and account deletion are deliberately NOT part of this
 * module. updateAccount() rejects any password field.
 *
 * ── Real backend mapping ────────────────────────────────────────────────────
 *
 *  getSettings()  → settings | null   (null = the profile isn't ready yet)
 *    GET /api/users/me → ProfileResponse  → `profile` + `avatarUrl`
 *      availability ← activityStatus (free text in the API — agree on
 *                     AVAILABLE | BUSY | AWAY with the backend team)
 *      skills       ← skills[].skillName
 *    A 404 here just means the profile hasn't been created yet (it's built
 *    from the user.registered Kafka event moments after sign-up) → return null.
 *    🚫 email / authProvider: only in the login response ({ userId, email,
 *       authProvider }); there's no endpoint to read them later.
 *    🚫 emailVerified, passwordChangedAt, notification preferences and app
 *       preferences: not in the API docs. Preferences could live in
 *       localStorage until a backend endpoint exists.
 *
 *  updateProfile(profileData)
 *    PUT /api/users/me { username, fullName, bio, experienceLevel, portfolioUrl,
 *        linkedinUrl, githubUsername, isOpenToCollaborate, activityStatus }
 *    Skills are separate: POST /api/users/me/skills { skillName } and
 *    DELETE /api/users/me/skills/{skillId}. Diff the old and new lists — the
 *    delete needs each skill's id, so keep the ids from getSettings().
 *
 *  updateAccount(accountData)
 *    🚫 No endpoint for changing email. (Password: only the token-based
 *    POST /api/auth/forgot-password + /reset-password exist — no change-with-
 *    current-password endpoint.)
 *
 *  updateNotificationPreferences(preferences)   🚫 no endpoint
 *  updatePreferences(preferences)               🚫 no endpoint
 *
 * Real responses use the { success, message, data, timestamp } envelope —
 * unwrap `data` and throw SettingsApiError(message, httpStatus) on failure.
 *
 * ── Try the other states in the browser (mock only) ─────────────────────────
 *   /settings?mock=error   loading always fails (503) → error state + retry
 *   /settings?mock=empty   the first load returns "profile not ready yet";
 *                          pressing Refresh then loads normally
 */

import {
  MOCK_TAKEN_EMAILS,
  MOCK_TAKEN_USERNAMES,
  createMockSettings,
} from '../mock/settingsMock';

/* ── Public API ──────────────────────────────────────────────────────────── */

/** Error type thrown by every function here. `status` is the HTTP status. */
export class SettingsApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'SettingsApiError';
    this.status = status;
  }
}

/**
 * Everything the Settings page shows.
 * @returns {Promise<object|null>} { profile, avatarUrl, account, notifications, preferences },
 *                                 or null when the profile isn't ready yet
 */
export async function getSettings() {
  await wait(MOCK_DELAY_MS.read);

  const scenario = getScenario();
  if (scenario === 'error') {
    throw new SettingsApiError('Could not load your settings right now. Try again shortly.', 503);
  }
  if (scenario === 'empty' && !emptyServed) {
    emptyServed = true;
    return null;
  }

  return clone(getStore());
}

/**
 * Update the public profile.
 * @param profileData { fullName, username, bio, experienceLevel, isOpenToCollaborate,
 *                      availability, skills, githubUsername, linkedinUrl, portfolioUrl }
 * @returns {Promise<object>} the saved profile
 */
export async function updateProfile(profileData) {
  await wait(MOCK_DELAY_MS.write);

  const store = getStore();
  const next = normalizeProfile({ ...store.profile, ...profileData });
  validateProfile(next, store.profile.username);

  store.profile = next;
  return clone(store.profile);
}

/**
 * Update sign-in details. Only `email` is supported.
 * Passwords are rejected on purpose — this demo never changes a password.
 * @param accountData { email }
 * @returns {Promise<object>} the saved account
 */
export async function updateAccount(accountData = {}) {
  await wait(MOCK_DELAY_MS.write);

  const passwordFields = ['password', 'currentPassword', 'newPassword', 'confirmPassword'];
  if (passwordFields.some((field) => field in accountData)) {
    throw new SettingsApiError('Password changes aren’t available yet.', 501);
  }

  const store = getStore();
  if (typeof accountData.email === 'string') {
    const email = accountData.email.trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      throw new SettingsApiError('Enter a valid email address.', 400);
    }
    if (email !== store.account.email) {
      if (MOCK_TAKEN_EMAILS.includes(email)) {
        throw new SettingsApiError('That email address is already in use.', 409);
      }
      // A new address has to be confirmed before it counts as verified.
      store.account = { ...store.account, email, emailVerified: false };
    }
  }

  return clone(store.account);
}

/**
 * Replace the notification preferences.
 * @param preferences { categories: { [id]: { inApp, email } }, digest }
 * @returns {Promise<object>} the saved preferences
 */
export async function updateNotificationPreferences(preferences) {
  await wait(MOCK_DELAY_MS.write);

  const store = getStore();
  validateNotifications(preferences, Object.keys(store.notifications.categories));

  store.notifications = clone(preferences);
  return clone(store.notifications);
}

/**
 * Replace the application preferences.
 * @param preferences { theme, language, timezone, timeFormat, startPage, compactCards, reduceMotion }
 * @returns {Promise<object>} the saved preferences
 */
export async function updatePreferences(preferences) {
  await wait(MOCK_DELAY_MS.write);

  validatePreferences(preferences);

  getStore().preferences = clone(preferences);
  return clone(getStore().preferences);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mock server — delete everything below when wiring the real backend.
 * ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = { read: 400, write: 300 };

// The single signed-in user's settings. Lives for the browser session, so
// saved changes survive React Query refetches.
let store = null;
let emptyServed = false;

function getStore() {
  if (!store) store = createMockSettings();
  return store;
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

/* ── Validation (mirrors the rules the UI already enforces) ──────────────── */

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/;
const GITHUB_RE = /^[a-z\d]+(?:-[a-z\d]+)*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED = {
  experienceLevel: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  availability: ['AVAILABLE', 'BUSY', 'AWAY'],
  digest: ['NEVER', 'DAILY', 'WEEKLY'],
  theme: ['DARK'], // light / system aren't available yet
  language: ['en-US', 'en-GB', 'es', 'de'],
  timezone: [
    'UTC',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
  ],
  timeFormat: ['12H', '24H'],
  startPage: ['DASHBOARD', 'DISCOVER_PROJECTS', 'DISCOVER_DEVELOPERS'],
};

function normalizeProfile(p) {
  return {
    ...p,
    fullName: String(p.fullName ?? '').trim(),
    username: String(p.username ?? '').trim().toLowerCase(),
    bio: String(p.bio ?? '').trim(),
    githubUsername: String(p.githubUsername ?? '').trim(),
    linkedinUrl: String(p.linkedinUrl ?? '').trim(),
    portfolioUrl: String(p.portfolioUrl ?? '').trim(),
    skills: Array.isArray(p.skills) ? p.skills.map((s) => String(s).trim()).filter(Boolean) : [],
  };
}

function isHttpUrl(value, requiredHost) {
  try {
    const url = new URL(value);
    const okProtocol = ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
    if (!requiredHost) return okProtocol;
    return okProtocol && (url.hostname === requiredHost || url.hostname.endsWith(`.${requiredHost}`));
  } catch {
    return false;
  }
}

function validateProfile(p, currentUsername) {
  const bad = (message, status = 400) => {
    throw new SettingsApiError(message, status);
  };

  if (!p.fullName) bad('Enter your name.');
  if (p.fullName.length > 60) bad('Keep your name under 60 characters.');
  if (!USERNAME_RE.test(p.username)) bad('That isn’t a valid username.');
  if (p.username !== currentUsername && MOCK_TAKEN_USERNAMES.includes(p.username)) {
    bad('That username is already taken.', 409);
  }
  if (p.bio.length > 280) bad('Keep your bio under 280 characters.');
  if (!ALLOWED.experienceLevel.includes(p.experienceLevel)) bad('Choose a valid experience level.');
  if (!ALLOWED.availability.includes(p.availability)) bad('Choose a valid availability status.');
  if (typeof p.isOpenToCollaborate !== 'boolean') bad('“Open to collaborate” must be on or off.');
  if (p.skills.length > 15) bad('You can list up to 15 skills.');
  if (p.githubUsername && (!GITHUB_RE.test(p.githubUsername) || p.githubUsername.length > 39)) {
    bad('That doesn’t look like a GitHub username.');
  }
  if (p.linkedinUrl && !isHttpUrl(p.linkedinUrl, 'linkedin.com')) bad('Enter a valid LinkedIn link.');
  if (p.portfolioUrl && !isHttpUrl(p.portfolioUrl)) bad('Enter a valid portfolio link.');
}

function validateNotifications(prefs, knownCategoryIds) {
  const bad = (message) => {
    throw new SettingsApiError(message, 400);
  };

  if (!prefs || typeof prefs !== 'object' || typeof prefs.categories !== 'object') {
    bad('Notification preferences are missing.');
  }
  if (!ALLOWED.digest.includes(prefs.digest)) bad('Choose a valid email digest option.');

  const ids = Object.keys(prefs.categories);
  const unknown = ids.find((id) => !knownCategoryIds.includes(id));
  if (unknown) bad(`Unknown notification category: ${unknown}`);
  const missing = knownCategoryIds.find((id) => !ids.includes(id));
  if (missing) bad(`Missing notification category: ${missing}`);

  for (const id of ids) {
    const c = prefs.categories[id];
    if (typeof c?.inApp !== 'boolean' || typeof c?.email !== 'boolean') {
      bad(`Invalid settings for ${id}.`);
    }
  }
}

function validatePreferences(prefs) {
  const bad = (message) => {
    throw new SettingsApiError(message, 400);
  };

  if (!prefs || typeof prefs !== 'object') bad('Preferences are missing.');

  if (prefs.theme !== 'DARK') bad('Only the dark theme is available right now.');
  for (const field of ['language', 'timezone', 'timeFormat', 'startPage']) {
    if (!ALLOWED[field].includes(prefs[field])) bad(`Invalid value for ${field}.`);
  }
  for (const field of ['compactCards', 'reduceMotion']) {
    if (typeof prefs[field] !== 'boolean') bad(`Invalid value for ${field}.`);
  }
}