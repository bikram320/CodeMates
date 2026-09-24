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
 * `total` is just `developers.length`: discovery-service caps results at 50
 * server-side and returns no count beyond that cap, so this is "how many came
 * back," not a true total of everyone who'd match.
 */

import { useQuery } from '@tanstack/react-query';
import { searchDevelopers } from '../api/discoveryApi';

export function useDevelopers({ skills = [], experienceLevel = null, interests = [], openToCollaborate = null } = {}) {
  const query = useQuery({
    queryKey: ['discovery', 'developers', { skills, experienceLevel, interests, openToCollaborate }],
    queryFn: () => searchDevelopers({ skills, experienceLevel, interests, openToCollaborate }),
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