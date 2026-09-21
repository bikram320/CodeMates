/**
 * useSettings()
 *
 * Data layer for the Account Settings page (TanStack Query):
 *   Settings.jsx → useSettings → settingsApi.js → settingsMock.js (for now)
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * Returns
 *   profile, avatarUrl, account, notifications, preferences
 *                     undefined until loaded
 *   isLoading         first load in flight
 *   isEmpty           loaded, but the profile isn't ready yet (brand-new account)
 *   isError / error   loading failed and there's nothing to show
 *   refetch           () => Promise
 *   updateProfile(profileData)                      → Promise (rejects with SettingsApiError)
 *   updateAccount(accountData)                      → Promise
 *   updateNotificationPreferences(preferences)      → Promise
 *   updatePreferences(preferences)                  → Promise
 *
 * Saves are optimistic: the cached value changes immediately (so the form
 * isn't left "dirty" while the request is in flight) and only that section is
 * rolled back if the request fails. The page's own form keeps what the user
 * typed, so they can fix it and try again.
 *
 * Password changes and account deletion aren't handled here on purpose.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getSettings,
  updateAccount as updateAccountApi,
  updateNotificationPreferences as updateNotificationPreferencesApi,
  updatePreferences as updatePreferencesApi,
  updateProfile as updateProfileApi,
} from '../api/settingsApi';

export const settingsQueryKey = ['settings'];

// Don't retry 4xx; retry a flaky 5xx once.
const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

/**
 * A mutation that updates one slice of the cached settings optimistically.
 * `optimistic(currentSlice, variables)` returns the slice as it should look
 * once the save succeeds.
 */
function useSliceMutation(queryClient, { slice, mutationFn, optimistic }) {
  const patchSlice = (updater) =>
    queryClient.setQueryData(settingsQueryKey, (current) =>
      current ? { ...current, [slice]: updater(current[slice]) } : current
    );

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKey });
      const previous = queryClient.getQueryData(settingsQueryKey)?.[slice];
      patchSlice((current) => optimistic(current, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) patchSlice(() => context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
  });
}

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsQueryKey,
    queryFn: getSettings,
    retry,
  });

  const profileMutation = useSliceMutation(queryClient, {
    slice: 'profile',
    mutationFn: updateProfileApi,
    optimistic: (current, data) => ({ ...current, ...data }),
  });

  const accountMutation = useSliceMutation(queryClient, {
    slice: 'account',
    mutationFn: updateAccountApi,
    // Mirrors the server: a new address starts out unverified.
    optimistic: (current, data) =>
      typeof data?.email === 'string' && data.email.trim().toLowerCase() !== current.email
        ? { ...current, email: data.email.trim().toLowerCase(), emailVerified: false }
        : current,
  });

  const notificationsMutation = useSliceMutation(queryClient, {
    slice: 'notifications',
    mutationFn: updateNotificationPreferencesApi,
    optimistic: (_current, preferences) => preferences,
  });

  const preferencesMutation = useSliceMutation(queryClient, {
    slice: 'preferences',
    mutationFn: updatePreferencesApi,
    optimistic: (_current, preferences) => preferences,
  });

  const data = query.data; // undefined = loading, null = profile not ready, object = loaded

  return {
    profile: data?.profile,
    avatarUrl: data?.avatarUrl,
    account: data?.account,
    notifications: data?.notifications,
    preferences: data?.preferences,

    isLoading: data === undefined && !query.isError,
    isEmpty: data === null,
    isError: query.isError && data === undefined,
    error: query.error ?? null,
    refetch: query.refetch,

    updateProfile: (profileData) => profileMutation.mutateAsync(profileData),
    updateAccount: (accountData) => accountMutation.mutateAsync(accountData),
    updateNotificationPreferences: (preferences) => notificationsMutation.mutateAsync(preferences),
    updatePreferences: (preferences) => preferencesMutation.mutateAsync(preferences),
  };
}

export default useSettings;