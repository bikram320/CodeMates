/**
 * src/mock/authMock.js
 *
 * ⚠️ MOCK ONLY. A browser-side stand-in for auth-service. Only
 * src/api/authApi.js should import this file (plus DEMO_ACCOUNT for the demo
 * notes on the auth pages).
 *
 * What is persisted (in this browser only, so a refresh keeps you signed in):
 *   codemates.mock.auth.v1     localStorage    users (passwords stored as an
 *                                              unsalted SHA-256, only so they
 *                                              aren't plain text) and reset tokens
 *   codemates.mock.session.v1  local/session   { userId, createdAt, remember }
 *
 * There is no JWT and no token of any kind. The real backend authenticates
 * with httpOnly cookies that JavaScript can't read or store, so the session
 * entry above is only a stand-in for "the cookie is present". Delete this
 * storage code, not just the file, when real auth is connected.
 *
 * Every function resolves with plain data and rejects with an Error carrying:
 *   .status        HTTP-style status (400, 401, 409, 410, 503)
 *   .code          machine-readable reason, e.g. INVALID_CREDENTIALS
 *   .fieldErrors   optional { field: message } (mock only: the real backend
 *                  returns one message string, see authApi.js)
 *
 * Dev helpers:
 *   ?mockAuth=error in the URL → login/register/forgot/reset fail with a 503
 *   resetMockAuth()            → wipes mock users, tokens and session
 *
 * Password reset "emails" are never sent. forgotPassword() prints the reset
 * link to the browser console instead.
 */

/* ── Config ──────────────────────────────────────────────────────────────── */

const DB_KEY = 'codemates.mock.auth.v1';
const SESSION_KEY = 'codemates.mock.session.v1';

const SESSION_DELAY_MS = 300;
const ACTION_DELAY_MS = 900;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = ['admin', 'codemates', 'demo', 'support', 'root'];

export const DEMO_ACCOUNT = { email: 'demo@codemates.dev', password: 'password123' };

/* ── Seed users ──────────────────────────────────────────────────────────── */
// id "user-uuid-001" matches CURRENT_USER_ID in projectMock.js.

const SEED_USERS = [
  {
    id: 'user-uuid-001',
    email: DEMO_ACCOUNT.email,
    username: 'aarav_codes',
    fullName: 'Aarav Sharma',
    authProvider: 'LOCAL',
    password: DEMO_ACCOUNT.password,
    avatarUrl: null,
    createdAt: '2026-03-14T09:20:00.000Z',
    profile: {
      bio: 'Full-stack developer building developer tools with Spring Boot and React.',
      githubUsername: 'aarav-codes',
      linkedinUrl: 'https://www.linkedin.com/in/aarav-sharma',
      isOpenToCollaborate: true,
      skills: ['React', 'Spring Boot', 'PostgreSQL'],
    },
  },
  {
    id: 'user-uuid-002',
    email: 'priya@codemates.dev',
    username: 'priya_nair',
    fullName: 'Priya Nair',
    authProvider: 'LOCAL',
    password: 'Codemates123',
    avatarUrl: null,
    createdAt: '2026-04-02T14:05:00.000Z',
    profile: {
      bio: 'Frontend developer who cares about accessibility and design systems.',
      githubUsername: 'priyanair',
      linkedinUrl: null,
      isOpenToCollaborate: true,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
    },
  },
  {
    // Signs in through "Continue with GitHub"; has no password.
    id: 'user-uuid-003',
    email: 'rohan@codemates.dev',
    username: 'rohan_karki',
    fullName: 'Rohan Karki',
    authProvider: 'GITHUB',
    password: null,
    avatarUrl: null,
    createdAt: '2026-05-21T11:40:00.000Z',
    profile: {
      bio: 'Backend developer working mostly in Java and Go.',
      githubUsername: 'rohankarki',
      linkedinUrl: null,
      isOpenToCollaborate: false,
      skills: ['Java', 'Go', 'Kafka'],
    },
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 120));

const authError = (message, status, code, fieldErrors) =>
  Object.assign(new Error(message), { status, code, fieldErrors });

function failIfServiceDown() {
  if (new URLSearchParams(window.location.search).get('mockAuth') === 'error') {
    throw authError('We couldn\'t reach CodeMates. Check your connection and try again.', 503, 'SERVICE_UNAVAILABLE');
  }
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `user-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Not real security: just keeps mock passwords out of plain text in storage. */
async function hashPassword(password) {
  if (!globalThis.crypto?.subtle) return `plain:${password}`; // insecure context (http on a LAN IP)
  const bytes = new TextEncoder().encode(`codemates-mock:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The user object handed to the app: never includes the password hash. */
const toPublicUser = ({ passwordHash, password, ...user }) => ({
  ...user,
  profile: { ...user.profile, skills: [...(user.profile?.skills ?? [])] },
});

/* ── Storage ─────────────────────────────────────────────────────────────── */

const store = (kind) => (kind === 'session' ? window.sessionStorage : window.localStorage);
const read = (kind, key) => {
  try {
    return JSON.parse(store(kind).getItem(key));
  } catch {
    return null;
  }
};
const write = (kind, key, value) => {
  try {
    store(kind).setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the mock keeps working in memory for this page load */
  }
};
const remove = (kind, key) => {
  try {
    store(kind).removeItem(key);
  } catch {
    /* ignore */
  }
};

let dbCache = null;

const saveDb = () => write('local', DB_KEY, dbCache);

async function loadDb() {
  if (dbCache) return dbCache;
  const stored = read('local', DB_KEY);
  if (stored?.users) {
    dbCache = stored;
    return dbCache;
  }
  const users = await Promise.all(
    SEED_USERS.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: password ? await hashPassword(password) : null,
    }))
  );
  dbCache = { users, resetTokens: {} };
  saveDb();
  return dbCache;
}

const findByEmail = (db, email) =>
  db.users.find((u) => u.email.toLowerCase() === String(email ?? '').trim().toLowerCase());

/* ── Session (stand-in for the httpOnly auth cookies) ────────────────────── */

const readSession = () => read('local', SESSION_KEY) ?? read('session', SESSION_KEY);

function clearSession() {
  remove('local', SESSION_KEY);
  remove('session', SESSION_KEY);
}

/** `remember` keeps the session across browser restarts; otherwise it ends with the tab. */
function startSession(userId, remember) {
  clearSession();
  write(remember ? 'local' : 'session', SESSION_KEY, { userId, createdAt: new Date().toISOString(), remember: !!remember });
}

/* ── Mock endpoints ──────────────────────────────────────────────────────── */

/** POST /api/auth/login */
export async function mockLogin({ email, password, remember = false } = {}) {
  await delay(ACTION_DELAY_MS);
  failIfServiceDown();

  const db = await loadDb();
  const user = findByEmail(db, email);
  const ok = !!user?.passwordHash && (await hashPassword(password ?? '')) === user.passwordHash;
  // Same message for an unknown email and a wrong password, so neither is revealed.
  if (!ok) throw authError('Incorrect email or password. Check your details and try again.', 401, 'INVALID_CREDENTIALS');

  startSession(user.id, remember);
  return toPublicUser(user);
}

/**
 * GET /api/auth/github (a browser redirect in the real app; see authApi.js).
 * The mock signs in the seeded GitHub user.
 */
export async function mockLoginWithGithub() {
  await delay(ACTION_DELAY_MS);
  failIfServiceDown();

  const db = await loadDb();
  const user = db.users.find((u) => u.authProvider === 'GITHUB');
  if (!user) throw authError('GitHub sign-in is unavailable.', 503, 'SERVICE_UNAVAILABLE');

  startSession(user.id, true);
  return toPublicUser(user);
}

/** POST /api/auth/register (+ the profile calls that follow it in the real flow) */
export async function mockRegister(userData) {
  const { email, password, username, fullName, profile = {} } = userData ?? {};
  await delay(ACTION_DELAY_MS + 200);
  failIfServiceDown();

  const invalid = {};
  if (!String(fullName ?? '').trim()) invalid.fullName = 'Full name is required.';
  if (!EMAIL_RE.test(String(email ?? '').trim())) invalid.email = 'Enter a valid email address.';
  if (!USERNAME_RE.test(username ?? '')) invalid.username = 'Username must be 3 to 20 letters, numbers or underscores.';
  if (typeof password !== 'string' || password.length < 8) invalid.password = 'Password must be at least 8 characters.';
  if (Object.keys(invalid).length) throw authError('Some details are invalid.', 400, 'VALIDATION_ERROR', invalid);

  const db = await loadDb();
  const taken = {};
  if (findByEmail(db, email)) taken.email = 'An account with this email already exists. Try logging in instead.';
  const name = username.toLowerCase();
  if (RESERVED_USERNAMES.includes(name) || db.users.some((u) => u.username.toLowerCase() === name)) {
    taken.username = 'That username is already taken. Try another.';
  }
  if (Object.keys(taken).length) throw authError('Some details need attention.', 409, 'ACCOUNT_EXISTS', taken);

  const user = {
    id: newId(),
    email: email.trim(),
    username,
    fullName: fullName.trim(),
    authProvider: 'LOCAL',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    profile: {
      bio: profile.bio || '',
      githubUsername: profile.githubUsername || null,
      linkedinUrl: profile.linkedinUrl || null,
      isOpenToCollaborate: profile.isOpenToCollaborate ?? true,
      skills: profile.skills ?? [],
    },
    passwordHash: await hashPassword(password),
  };
  db.users.push(user);
  saveDb();

  startSession(user.id, true); // registering signs the user in, like the real endpoint
  return toPublicUser(user);
}

/** POST /api/auth/logout */
export async function mockLogout() {
  await delay(200);
  clearSession();
  return null;
}

/** GET /api/users/me, restoring whoever the session says is signed in. */
export async function mockGetCurrentUser() {
  await delay(SESSION_DELAY_MS);

  const session = readSession();
  if (!session) throw authError('Not authenticated.', 401, 'NOT_AUTHENTICATED');

  const db = await loadDb();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    clearSession();
    throw authError('Not authenticated.', 401, 'NOT_AUTHENTICATED');
  }
  return toPublicUser(user);
}

/**
 * POST /api/auth/forgot-password
 * Like the real endpoint it always succeeds, whether or not the email exists.
 * For a real password account the reset link is printed to the console.
 */
export async function mockForgotPassword(email) {
  await delay(ACTION_DELAY_MS);
  failIfServiceDown();

  const db = await loadDb();
  const user = findByEmail(db, email);
  if (user?.authProvider === 'LOCAL') {
    const token = newId();
    db.resetTokens[token] = { userId: user.id, expiresAt: Date.now() + RESET_TOKEN_TTL_MS };
    saveDb();
    console.info(`[CodeMates mock] Password reset link for ${user.email}: ${window.location.origin}/reset-password?token=${token}`);
  }
  return null;
}

/**
 * POST /api/auth/reset-password
 *   token "expired"        → 410 TOKEN_EXPIRED
 *   token "invalid"        → 400 TOKEN_INVALID
 *   a token from the console link → really changes that user's mock password
 *   any other token        → accepted with no change, so the page can be tried
 *                            with a hand-typed ?token=abc
 */
export async function mockResetPassword(token, newPassword) {
  await delay(ACTION_DELAY_MS);
  failIfServiceDown();

  if (token === 'expired') throw authError('This reset link has expired. Request a new one to continue.', 410, 'TOKEN_EXPIRED');
  if (!token || token === 'invalid') throw authError('This reset link isn\'t valid. Request a new one to continue.', 400, 'TOKEN_INVALID');
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw authError('Password must be at least 8 characters.', 400, 'VALIDATION_ERROR', { newPassword: 'Too short.' });
  }

  const db = await loadDb();
  const issued = db.resetTokens[token];
  if (issued) {
    delete db.resetTokens[token];
    if (issued.expiresAt < Date.now()) {
      saveDb();
      throw authError('This reset link has expired. Request a new one to continue.', 410, 'TOKEN_EXPIRED');
    }
    const user = db.users.find((u) => u.id === issued.userId);
    if (user) user.passwordHash = await hashPassword(newPassword);
    saveDb();
  }

  clearSession(); // the real endpoint clears the cookies and forces a fresh login
  return null;
}

/** Dev helper: wipe all mock auth data (users, reset tokens, session). */
export function resetMockAuth() {
  dbCache = null;
  remove('local', DB_KEY);
  clearSession();
}