/**
 * src/hooks/useDevelopers.js
 *
 * Data hook for Discover Developers.
 *
 *   DiscoverDevelopers.jsx → useDevelopers(filters) → discoveryApi.js → real backend
 *
 * `filters` maps straight onto GET /api/discovery/search's four params:
 * skills[], experienceLevel, interests[], openToCollaborate. There is
 * deliberately no `search` (free-text) filter here — the backend has no such
 * param, so DiscoverDevelopers.jsx applies any text search itself, client-side,
 * over whatever this hook returns (see that file for why, and its
 * matchesSearchText helper).
 *
 * `enabled` (default true) lets the caller decide WHEN this hook is actually
 * allowed to hit the network. DiscoverDevelopers.jsx passes `false` until the
 * user has either picked a filter or submitted a search — otherwise this
 * would fire on every mount with empty filters, which the backend happily
 * answers with "up to 50 developers" (DiscoveryService has no concept of
 * "no filters = no results"). That's what was causing everyone to show up
 * immediately on page load. When `enabled` is false, react-query simply never
 * runs queryFn: `developers` stays `[]`, `isLoading`/`isFetching` stay false,
 * so no spinner and no accidental request.
 *
 * `total` is just `developers.length`: discovery-service caps results at 50
 * server-side and returns no count beyond that cap, so this is "how many came
 * back," not a true total of everyone who'd match.
 */

import { useQuery } from '@tanstack/react-query';
import { searchDevelopers } from '../api/discoveryApi';

export function useDevelopers({
                                skills = [],
                                experienceLevel = null,
                                interests = [],
                                openToCollaborate = null,
                                enabled = true,
                              } = {}) {
  const query = useQuery({
    queryKey: ['discovery', 'developers', { skills, experienceLevel, interests, openToCollaborate }],
    queryFn: () => searchDevelopers({ skills, experienceLevel, interests, openToCollaborate }),
    enabled,
    retry: false,
  });

  const developers = query.data ?? [];

  return {
    developers,
    total: developers.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useDevelopers;