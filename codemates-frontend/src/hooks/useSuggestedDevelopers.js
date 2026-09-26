/**
 * src/hooks/useSuggestedDevelopers.js
 *
 * "Suggested developers" for the default (pre-search) state of Discover
 * Developers, backed by the real ML match-score feature:
 *
 *   GET /api/discovery/match-scores/top?limit=  → MatchScoreResponseDto[]
 *     (MatchScoreController.topMatches / MatchScoreService.getTopMatches,
 *     identity comes from the caller's JWT cookie — no userId param needed.)
 *
 * ── Why this also fetches searchDevelopers() ─────────────────────────────
 * MatchScoreResponseDto only has matchedUserId + score breakdown fields
 * (skillScore/experienceScore/activityScore/interestScore/totalMatchScore) —
 * no name, avatar, bio, or skills to actually render a DeveloperCard with.
 * There is no "get profile(s) by id" endpoint anywhere in discovery-service
 * as given, so this does a best-effort CLIENT-SIDE JOIN: it pulls the same
 * unfiltered profile pool /api/discovery/search already exposes (capped at
 * 50 by discovery-service) and matches suggestions against it by userId.
 *
 * LIMITATION: a matchedUserId that isn't in that first-50 profile pool gets
 * silently dropped from the suggestions list — there's no way to resolve it
 * without a real "profile by id" endpoint. If suggestions frequently come
 * back thinner than the raw match-score list, that's why; the fix at that
 * point is a backend endpoint, not more frontend logic.
 *
 * ── If nothing has ever synced scores for this user ──────────────────────
 * MatchSyncService.syncMatchesForUser is what actually computes scores, and
 * nothing in the given frontend calls it (its /sync endpoint takes a raw
 * `userId` query param rather than reading the JWT cookie, which reads as an
 * internal/service-triggered call, not something a user's own browser
 * should invoke). If it's never been run for a user, getTopMatches() simply
 * returns an empty list — handled gracefully here as "no suggestions yet",
 * not an error.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTopMatches, searchDevelopers } from '../api/discoveryApi';

export function useSuggestedDevelopers(limit = 6) {
  const matchesQuery = useQuery({
    queryKey: ['discovery', 'topMatches', limit],
    queryFn: () => getTopMatches(limit),
    retry: false,
  });

  const hasMatches = (matchesQuery.data?.length ?? 0) > 0;

  // Only fetch the profile pool once we know there are actual matches to
  // resolve against it — no point fetching 50 profiles for nothing.
  const profilesQuery = useQuery({
    queryKey: ['discovery', 'profilePoolForSuggestions'],
    queryFn: () => searchDevelopers({}),
    enabled: hasMatches,
    retry: false,
  });

  const suggestions = useMemo(() => {
    const matches = matchesQuery.data ?? [];
    const profiles = profilesQuery.data ?? [];
    if (matches.length === 0 || profiles.length === 0) return [];

    const profileById = new Map(profiles.map((p) => [p.userId, p]));

    return matches
      .map((m) => {
        const profile = profileById.get(m.matchedUserId);
        return profile ? { ...profile, matchScore: m.totalMatchScore } : null;
      })
      .filter(Boolean);
  }, [matchesQuery.data, profilesQuery.data]);

  return {
    suggestions,
    // Loading if we're still waiting on scores, or (once we know there are
    // scores to resolve) still waiting on the profile pool to join against.
    isLoading: matchesQuery.isLoading || (hasMatches && profilesQuery.isLoading),
    isError: matchesQuery.isError,
    error: matchesQuery.error,
  };
}

export default useSuggestedDevelopers;
