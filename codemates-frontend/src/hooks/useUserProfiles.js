/**
 * useUserProfiles(userIds)
 *
 * Batch-resolves a list of raw user IDs (e.g. otherUserId/senderUserId from
 * connectionsApi.js) into real profiles via GET /api/users/by-ids, and
 * hands back a Map keyed by userId for O(1) lookup while rendering.
 *
 * IDs are de-duped and sorted before being used as the query key, so
 * re-renders that produce the same set of ids (just reordered) don't
 * trigger a refetch.
 */
import { useQuery } from '@tanstack/react-query';
import { getProfilesByIds } from '../api/profileApi';

export function useUserProfiles(userIds = []) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))].sort();

    const query = useQuery({
        queryKey: ['profiles', 'byIds', uniqueIds],
        queryFn: () => getProfilesByIds(uniqueIds),
        enabled: uniqueIds.length > 0,
        staleTime: 60_000,
    });

    const profileMap = new Map((query.data ?? []).map((p) => [p.userId, p]));

    return {
        profileMap,
        isLoading: uniqueIds.length > 0 && query.isLoading,
        isError: query.isError,
        error: query.error,
    };
}

export default useUserProfiles;