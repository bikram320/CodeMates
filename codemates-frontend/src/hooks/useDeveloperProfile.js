/**
 * useDeveloperProfile(username)
 *
 * Read-only lookup of another developer's public profile, for a profile-view
 * page (e.g. an existing or future DeveloperProfile.jsx) or any card/link
 * that needs to show someone else's profile by username.
 *
 * GET /api/users/{username} is public — no auth cookie required, so this
 * works whether or not the viewer is signed in.
 *
 * Returns { profile, isLoading, isNotFound, error, refetch }.
 */

import { useQuery } from '@tanstack/react-query';

import { getProfileByUsername, isNotFoundError } from '../api/profileApi';

export const developerProfileQueryKey = (username) => ['profile', 'byUsername', username];

const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

export function useDeveloperProfile(username) {
  const query = useQuery({
    queryKey: developerProfileQueryKey(username),
    queryFn: () => getProfileByUsername(username),
    enabled: Boolean(username),
    retry: (count, error) => !isNotFoundError(error) && retry(count, error),
  });

  const notFound = isNotFoundError(query.error);

  return {
    profile: query.data,
    isLoading: Boolean(username) && query.data === undefined && !notFound && !query.isError,
    isNotFound: notFound,
    error: !notFound && query.isError ? query.error : null,
    refetch: query.refetch,
  };
}

export default useDeveloperProfile;