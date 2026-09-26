/**
 * src/hooks/useAuth.js
 *
 * The one hook the auth pages (and, later, route guards and the app shell) use.
 *
 * Data flow:
 *   Login / Register / ForgotPassword / ResetPassword
 *     → useAuth()
 *       → authApi.js  →  the real backend (no mock)
 *
 * ── Session restore on page load: the gap this works around ──────────────────
 * The backend authenticates with httpOnly cookies, so JavaScript can never read
 * "who is logged in" directly, and there's no GET /api/users/me (or similar) in
 * the files I've been given to ask. So on load this hook:
 *   1. calls POST /api/auth/refresh to check whether a valid refresh_token
 *      cookie exists (and rotate it if so) — this runs unconditionally, not
 *      only when a cache exists (see point 3 for why that distinction matters)
 *   2. if that fails, the session is over: any local cache is cleared and
 *      user is null. Any failure is treated this way (see the queryFn for
 *      why it isn't narrowed to just 401)
 *   3. if it succeeds, a small non-sensitive cache of the last UserInfoResponse
 *      (userId, email, authProvider — the same fields the backend already
 *      considers safe to send to the browser) is read from localStorage. If
 *      one exists, that's user. If not — most notably right after a GitHub
 *      OAuth login, which is a full-page redirect that sets cookies directly
 *      and never hands this frontend a UserInfoResponse the way login()/
 *      register() below do — there is genuinely no way to learn who this is
 *      without a "current user" endpoint. Rather than wrongly report someone
 *      with a valid session as logged out, user becomes a placeholder
 *      ({ profileUnknown: true }, see UNKNOWN_USER) so isAuthenticated is at
 *      least correct; anything reading user.email/userId should check that
 *      flag and show a fallback rather than assume a name is always present.
 * → Add GET /api/users/me (or point me to the file that already has it) and
 *   this whole cache workaround — and the profileUnknown case — can be
 *   deleted in favor of calling it directly.
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *   const user = await login({ email, password });   // rejects on failure
 *
 * The action functions return promises and reject with an Error that has
 * .status and, best-effort, .fieldErrors (see authApi.js), so callers
 * keep their own try/catch and loading UI.
 *
 * refreshUser(): forces the session-restore query above to re-run right now,
 * rather than waiting on its staleTime: Infinity. Used by OAuthCallback.jsx —
 * a GitHub redirect sets cookies server-side with no fetch this app controls,
 * so nothing else would ever tell this hook to re-check "am I logged in?".
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/authApi';

export const authKeys = {
  user: ['auth', 'user'],
};

// Non-sensitive by design — the same fields UserInfoResponse already exposes
// to the browser. Never holds a token; tokens never leave the server as JSON.
const CACHE_KEY = 'codemates.auth.user.v1';

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}
function writeCachedUser(user) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable: session restore just won't survive a refresh this time */
  }
}
function clearCachedUser() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Returned when the session cookie is valid but no cached identity exists —
 * see the header comment. profileUnknown: true is the flag callers should
 * check before assuming user.email/userId/authProvider are usable.
 */
const UNKNOWN_USER = { userId: null, email: null, authProvider: null, profileUnknown: true };

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      try {
        await authApi.refreshSession(); // does a valid session cookie exist?
      } catch {
        // AuthService.refresh() throws the same InvalidTokenException for an
        // expired, revoked, missing or unknown refresh token, and the
        // exception handler that maps it to an HTTP status wasn't in the
        // files provided — so rather than guess a status code, any failure
        // here is treated as "no session", not a real error. Worst case, a
        // working session that failed to restore for an unrelated reason (a
        // network blip) shows a logged-out state instead of a scary error;
        // that's the safer default since nothing yet reads an error out of
        // this hook.
        clearCachedUser();
        return null;
      }
      // Cookie's valid. Use the cached identity if we have one (a prior
      // login/register in this browser); otherwise see UNKNOWN_USER above.
      return readCachedUser() ?? UNKNOWN_USER;
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const setSignedIn = (user) => {
    queryClient.cancelQueries({ queryKey: authKeys.user }); // don't let a slower restore overwrite this
    writeCachedUser(user);
    queryClient.setQueryData(authKeys.user, user);
  };

  const loginMutation = useMutation({ mutationFn: authApi.login, onSuccess: setSignedIn });
  const registerMutation = useMutation({ mutationFn: authApi.register, onSuccess: setSignedIn });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearCachedUser();
      queryClient.clear();
      queryClient.setQueryData(authKeys.user, null);
    },
  });

  const forgotPasswordMutation = useMutation({ mutationFn: authApi.forgotPassword });
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }) => authApi.resetPassword(token, newPassword),
  });

  const user = userQuery.data ?? null;

  // Forces the session-restore queryFn above to re-run immediately. Needed
  // after a GitHub OAuth redirect, where cookies were set outside any fetch
  // this app made, so nothing else would trigger a re-check.
  const refreshUser = () => queryClient.invalidateQueries({ queryKey: authKeys.user });

  return {
    user,
    isAuthenticated: !!user,
    isLoading: userQuery.isLoading, // true only while the session is first being restored

    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: (token, newPassword) => resetPasswordMutation.mutateAsync({ token, newPassword }),
    refreshUser,
  };
}

export default useAuth;