/**
 * src/api/authApi.js
 *
 * The single auth API layer. Login, Register, Forgot Password and Reset
 * Password all go through here (via useAuth()); there are no per-page API files.
 * Currently routed to the browser-side mock in src/mock/authMock.js.
 *
 * Contract (what useAuth() and the pages rely on)
 *   - Success: resolves with plain data. Anything that signs the user in
 *     (login, loginWithGithub, register) resolves with the AuthUser below.
 *     Everything else resolves with null.
 *   - Failure: rejects with an Error that has `.status`, `.code` and, where the
 *     server names the offending inputs, `.fieldErrors` ({ field: message }).
 *
 *   AuthUser = { id, email, username, fullName, authProvider ('LOCAL' | 'GITHUB'),
 *                avatarUrl, createdAt,
 *                profile: { bio, githubUsername, linkedinUrl, isOpenToCollaborate, skills[] } }
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 * The backend authenticates with httpOnly cookies. JavaScript never sees a
 * token, so there is nothing to store: make every call with credentials
 * ('include' / withCredentials) and delete the mock's session storage.
 *
 *   login(credentials)       POST /api/auth/login { email, password }
 *                            → { userId, email, authProvider }. The AuthUser
 *                            comes from a follow-up GET /api/users/me. `remember`
 *                            isn't sent (the backend has no such option).
 *   register(userData)       POST /api/auth/register { email, password, username, fullName }
 *                            then, with the new cookies, PUT /api/users/me
 *                            { bio, githubUsername, linkedinUrl, isOpenToCollaborate }
 *                            and POST /api/users/me/skills once per skill.
 *                            The profile is created asynchronously from the
 *                            `user.registered` event, so retry the first PUT briefly.
 *   loginWithGithub()        NOT a fetch. It is a full-page redirect to
 *                            GET /api/auth/github; the app comes back already
 *                            signed in, so call getCurrentUser() on return.
 *                            Failures come back as ?error=state_mismatch |
 *                            no_verified_email | oauth_failed.
 *   logout()                 POST /api/auth/logout (needs the refresh cookie)
 *   getCurrentUser()         GET /api/users/me. Map ProfileResponse to AuthUser.
 *                            A 401 means "not signed in" (try POST /api/auth/refresh first).
 *   forgotPassword(email)    POST /api/auth/forgot-password { email }. Always
 *                            succeeds, so the UI must never confirm an account exists.
 *   resetPassword(t, pw)     POST /api/auth/reset-password { token, newPassword }
 *                            Clears the cookies and forces a fresh login.
 *
 * Errors: the real API replies { success: false, message, data: null } with one
 * message string (validation failures are "<field>: <message>", first failing
 * field only). It has no `fieldErrors`, so map those messages onto fields here
 * (e.g. duplicate email / username on register) to keep the pages unchanged.
 */

import {
  mockGetCurrentUser,
  mockForgotPassword,
  mockLogin,
  mockLoginWithGithub,
  mockLogout,
  mockRegister,
  mockResetPassword,
} from '../mock/authMock';

/**
 * @param {{ email: string, password: string, remember?: boolean }} credentials
 * @returns {Promise<AuthUser>}
 */
export function login(credentials) {
  return mockLogin(credentials);
}

/**
 * Sign in with GitHub. The real version redirects the browser (see above).
 * @returns {Promise<AuthUser>}
 */
export function loginWithGithub() {
  return mockLoginWithGithub();
}

/**
 * @param {{ email: string, password: string, username: string, fullName: string,
 *           profile?: { bio?: string, githubUsername?: string|null, linkedinUrl?: string,
 *                       isOpenToCollaborate?: boolean, skills?: string[] } }} userData
 * @returns {Promise<AuthUser>} the new user, already signed in
 */
export function register(userData) {
  return mockRegister(userData);
}

/** @returns {Promise<null>} */
export function logout() {
  return mockLogout();
}

/**
 * Restores the signed-in user (e.g. after a page refresh).
 * Rejects with status 401 when nobody is signed in.
 * @returns {Promise<AuthUser>}
 */
export function getCurrentUser() {
  return mockGetCurrentUser();
}

/** @returns {Promise<null>} always succeeds, whether or not the email exists */
export function forgotPassword(email) {
  return mockForgotPassword(email);
}

/** @returns {Promise<null>} */
export function resetPassword(token, newPassword) {
  return mockResetPassword(token, newPassword);
}