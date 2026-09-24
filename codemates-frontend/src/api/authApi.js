/**
 * src/api/authApi.js
 *
 * The single auth network layer, calling the real Spring Boot AuthController
 * directly (no mock). Login, Register, Forgot Password and Reset Password all
 * go through here via useAuth(); there are no per-page API files.
 *
 * Matches AuthController exactly:
 *   POST /api/auth/register          RegisterRequest{email,password,username,fullName}
 *                                     → 201, ApiResponse<UserInfoResponse>
 *   POST /api/auth/login             LoginRequest{email,password}
 *                                     → 200, ApiResponse<UserInfoResponse>
 *   POST /api/auth/logout            (reads refresh_token cookie) → ApiResponse<Void>
 *   POST /api/auth/refresh           (reads refresh_token cookie) → ApiResponse<Void>,
 *                                     rotates both cookies. Used only by useAuth() to
 *                                     check "is the session still valid?" — see its comments.
 *   POST /api/auth/forgot-password   ForgotPasswordRequest{email} → ApiResponse<Void>,
 *                                     always succeeds; never reveals whether the email exists.
 *                                     Sending an actual email isn't implemented server-side yet —
 *                                     AuthService only logs the reset token (log.info), so right
 *                                     now the only way to get a real token to test with is to
 *                                     read it out of the backend's server console.
 *   POST /api/auth/reset-password    ResetPasswordRequest{token,newPassword} → ApiResponse<Void>,
 *                                     clears cookies (forces a fresh login).
 *
 * Not called here, on purpose:
 *   - GET /api/auth/health          not user-facing.
 *   - POST /api/auth/logout-all     no page asks for "log out everywhere" yet, and it
 *                                    needs an authenticated userId the way none of the
 *                                    calls here do (@AuthenticationPrincipal). Add it if
 *                                    that feature gets built.
 *   - a "who am I" call             GET /api/users/me or similar does not exist in the
 *                                    files I've been given. useAuth() works around this
 *                                    gap — see its comments for what that means and what
 *                                    file would let the workaround be removed.
 *
 * Auth is via httpOnly cookies (access_token, refresh_token) that JavaScript can
 * never read — AuthResponse's tokens never leave the server; only the
 * non-sensitive UserInfoResponse (userId, email, authProvider) comes back in the
 * body. Every call below sends credentials: 'include' so the browser attaches
 * and stores those cookies; without it, nothing here works.
 *
 * If the frontend and backend are on different origins (e.g. localhost:5173 vs
 * :8080), the backend's CORS config must allow that exact origin with
 * credentials enabled — "Access-Control-Allow-Origin: *" cannot be combined
 * with cookies, per the fetch/CORS spec. Set VITE_API_BASE_URL to the backend's
 * origin (e.g. http://localhost:8080); it defaults to '' (relative requests),
 * which only works same-origin or behind a proxy.
 *
 * Error shape: the API replies { success: false, message, data: null } with one
 * message string — there's no per-field detail. request() below turns that into
 * an Error with `.status` and `.message`, and makes a best-effort guess at which
 * field the message is about (see guessField) so Register/Reset Password can
 * still highlight the right input. That guess is inherently unreliable; a
 * backend change to return field-level codes would let it be removed.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const apiError = (message, status, fieldErrors) => Object.assign(new Error(message), { status, fieldErrors });

/**
 * Best-effort guess at which form field a single backend message is about.
 * Order matters: email/username/token are checked before password, since a
 * login failure message ("Invalid email or password") would otherwise match
 * both email and password — callers that show a banner only (Login) never
 * read `.fieldErrors`, so this ambiguity only affects Register/Reset Password,
 * whose messages are about one field at a time in practice.
 */
function guessField(message = '') {
  const m = message.toLowerCase();
  if (m.includes('email')) return 'email';
  if (m.includes('username')) return 'username';
  if (m.includes('token')) return 'token';
  if (m.includes('password')) return m.includes('confirm') ? 'confirmPassword' : 'password';
  return null;
}

/**
 * POSTs JSON to the backend and unwraps the ApiResponse envelope.
 * @param {string} path e.g. '/api/auth/login'
 * @param {{ body?: object, raw?: boolean }} [opts] `raw: true` resolves with
 *   the full envelope ({ success, message, data, timestamp }) instead of just
 *   `data`, for callers that want the server's own message (forgot/reset password).
 */
async function request(path, { body, raw = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
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
    const message = json?.message || `Request failed (${res.status}).`;
    const field = guessField(message);
    throw apiError(message, res.status, field ? { [field]: message } : undefined);
  }

  return raw ? json : json?.data ?? null;
}

/**
 * @param {{ email: string, password: string, username: string, fullName: string }} userData
 *   Only these four fields exist on RegisterRequest. Any profile data (bio,
 *   skills, availability, GitHub, LinkedIn) collected by the Register form is
 *   NOT sent — there's no endpoint for it in the files provided, so the page
 *   drops it for now rather than silently pretending to save it.
 * @returns {Promise<{userId: string, email: string, authProvider: string}>}
 */
export function register({ email, password, username, fullName }) {
  return request('/api/auth/register', { body: { email, password, username, fullName } });
}

/**
 * @param {{ email: string, password: string }} credentials
 *   LoginRequest has no "remember me" field, and cookie lifetimes are fixed
 *   server-side (jwt.expiration / jwt.refresh-expiration) — a "remember me"
 *   checkbox in the UI currently has nothing to change on the backend.
 * @returns {Promise<{userId: string, email: string, authProvider: string}>}
 */
export function login({ email, password }) {
  return request('/api/auth/login', { body: { email, password } });
}

/** @returns {Promise<null>} */
export async function logout() {
  await request('/api/auth/logout');
  return null;
}

/**
 * Confirms the refresh_token cookie is still valid and rotates both cookies.
 * Returns no user data (ApiResponse<Void>) — see useAuth() for how this is
 * used to restore a session after a page refresh.
 * @returns {Promise<null>}
 */
export function refreshSession() {
  return request('/api/auth/refresh');
}

/**
 * Always resolves — the backend never reveals whether the email is registered.
 * Sending an email isn't implemented yet; the reset token only reaches the
 * backend's server-side logs (see the header comment above).
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string, data: null}>} raw envelope,
 *   so the page can show the backend's own confirmation wording.
 */
export function forgotPassword(email) {
  return request('/api/auth/forgot-password', { body: { email }, raw: true });
}

/**
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<{success: boolean, message: string, data: null}>} raw envelope
 */
export function resetPassword(token, newPassword) {
  return request('/api/auth/reset-password', { body: { token, newPassword }, raw: true });
}