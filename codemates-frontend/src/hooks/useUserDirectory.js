/**
 * src/hooks/useUserDirectory.js
 *
 * Batch-resolves a list of raw userIds into real profile data
 * (fullName, username, avatarUrl, ...) via profileApi.getProfilesByIds,
 * which hits the real GET /api/users/by-ids endpoint.
 *
 * This exists because almost every project-service / contribution-service /
 * messaging-service DTO (ProjectMemberResponseDto, ContributionScoreResponse,
 * ChatMessage, etc.) only ever carries a raw userId — never a name or
 * avatar. Anywhere that used to show a truncated UUID as a stand-in
 * ("80914575…") should switch to this hook instead of inventing its own
 * lookup.
 *
 * Usage:
 *   const { directory, isLoading } = useUserDirectory(members.map(m => m.userId));
 *   const name = directory[member.userId]?.fullName ?? "Unknown member";
 *
 * Returns:
 *   directory   { [userId]: ProfileResponse }   only successfully-resolved ids are present
 *   isLoading   boolean
 *   isError     boolean
 */

import { useQuery } from '@tanstack/react-query';
import { getProfilesByIds } from '../api/profileApi';

export default function useUserDirectory(userIds = []) {
  // Dedupe + drop falsy ids, and sort so the query key is stable regardless
  // of the order the caller's list happens to be in (avoids refetching on
  // every render just because array order changed).
  const ids = [...new Set((userIds ?? []).filter(Boolean))].sort();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['userDirectory', ids],
    queryFn: () => getProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000, // profiles don't change often; avoid refetch spam
  });

  const directory = {};
  (data ?? []).forEach((profile) => {
    if (profile?.userId) directory[profile.userId] = profile;
  });

  return {
    directory,
    isLoading: ids.length > 0 && isLoading,
    isError,
  };
}
