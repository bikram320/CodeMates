/**
 * src/hooks/useAuth.js
 *
 * The one hook the auth pages (and, later, route guards and the app shell) use.
 *
 * Data flow:
 *   Login / Register / ForgotPassword / ResetPassword
 *     → useAuth()
 *       → authApi.js
 *         → authMock.js        (mock for now)
 *
 * Session state lives in the React Query cache under ['auth', 'user']:
 *   - on mount it asks getCurrentUser() who is signed in (this is what
 *     restores the session after a page refresh); a 401 just means "nobody",
 *     so `user` is null rather than an error
 *   - login / loginWithGithub / register put the returned user in that cache
 *   - logout empties the whole cache so no data leaks to the next user
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 *   const user = await login({ email, password, remember });   // rejects on failure
 *
 * The action functions return promises and reject with an Error that has
 * `.status`, `.code` and optionally `.fieldErrors` (see authApi.js), so callers
 * keep their own try/catch and loading UI.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/authApi';

export const authKeys = {
  user: ['auth', 'user'],
};

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (err) {
        if (err.status === 401) return null; // not signed in
        throw err;
      }
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const setSignedIn = (user) => {
    queryClient.cancelQueries({ queryKey: authKeys.user }); // don't let a slower "who am I?" overwrite this
    queryClient.setQueryData(authKeys.user, user);
  };

  const loginMutation = useMutation({ mutationFn: authApi.login, onSuccess: setSignedIn });
  const githubMutation = useMutation({ mutationFn: authApi.loginWithGithub, onSuccess: setSignedIn });
  const registerMutation = useMutation({ mutationFn: authApi.register, onSuccess: setSignedIn });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
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
    loginWithGithub: githubMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: (token, newPassword) => resetPasswordMutation.mutateAsync({ token, newPassword }),
  };
}

export default useAuth;