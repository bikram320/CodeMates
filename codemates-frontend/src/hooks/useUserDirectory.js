/**
 * src/hooks/useUserDirectory.js
 *
 * Batch-resolves raw userIds into profile data (fullName, username, avatarUrl, ...)
 * via getProfilesByIds (GET /api/users/by-ids).
 *
 * Returns:
 *   directory   { [userId]: ProfileResponse }   only resolved ids are present
 *   isLoading   boolean
 *   isError     boolean
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfilesByIds } from '../api/profileApi';

export default function useUserDirectory(userIds = []) {
  // Dedupe + drop falsy ids + sort so the query key is stable.
  const ids = [...new Set((userIds ?? []).filter(Boolean))].sort();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['userDirectory', ids],
    queryFn: () => getProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Memoized so consumers can safely use `directory` in dependency arrays.
  const directory = useMemo(() => {
    const map = {};
    (data ?? []).forEach((profile) => {
      if (profile?.userId) map[profile.userId] = profile;
    });
    return map;
  }, [data]);

  return {
    directory,
    isLoading: ids.length > 0 && isLoading,
    isError,
  };
}