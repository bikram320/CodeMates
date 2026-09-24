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
 *   1. reads a small, non-sensitive cache of the last UserInfoResponse
 *      (userId, email, authProvider — the same fields the backend already
 *      considers safe to send to the browser) from localStorage
 *   2. calls POST /api/auth/refresh to check the refresh_token cookie is still
 *      valid (and rotate it); any failure is treated as "the session is
 *      over" (see the queryFn below for why it isn't narrowed to just 401),
 *      so the cache is
 *      cleared and `user` is null
 * That means: after a fresh login/register in this browser, refreshing the
 * page correctly keeps the user signed in. But if someone clears localStorage
 * while a valid session cookie remains, or opens the app on a browser that has
 * the cookie but never cached a user here, `user` comes back null even though
 * the backend would still recognize them — there's no way to ask the backend
 * who that is without a real "current user" endpoint.
 * → Add GET /api/users/me (or point me to the file that already has it) and
 *   this whole cache workaround can be deleted in favor of calling it directly.
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *   const user = await login({ email, password });   // rejects on failure
 *
 * The action functions return promises and reject with an Error that has
 * `.status` and, best-effort, `.fieldErrors` (see authApi.js), so callers
 * keep their own try/catch and loading UI.
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

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      const cached = readCachedUser();
      if (!cached) return null; // nobody logged in via this browser before — see the note above

      try {
        await authApi.refreshSession(); // confirms the cookie is still valid
        return cached;
      } catch {
        // AuthService.refresh() throws the same InvalidTokenException for an
        // expired, revoked or unknown refresh token, and the exception handler
        // that maps it to an HTTP status wasn't in the files provided — so
        // rather than guess a status code, any failure here is treated as
        // "the session ended", not a real error. Worst case, a working
        // session that failed to restore for an unrelated reason (a network
        // blip) shows a logged-out state instead of a scary error; that's the
        // safer default since nothing yet reads an error out of this hook.
        clearCachedUser();
        return null;
      }
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

  return {
    user,
    isAuthenticated: !!user,
    isLoading: userQuery.isLoading, // true only while the session is first being restored

    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: (token, newPassword) => resetPasswordMutation.mutateAsync({ token, newPassword }),
  };
}

export default useAuth;