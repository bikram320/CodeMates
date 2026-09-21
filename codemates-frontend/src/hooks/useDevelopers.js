import { useQuery } from "@tanstack/react-query";
import { getDevelopers } from "../api/developerApi";

/**
 * DiscoverDevelopers -> useDevelopers() -> developerApi.getDevelopers() -> mock data
 *
 * Pass the current filter state in; the query re-runs whenever any of
 * them change, because they're part of the query key.
 *
 *   const { developers, total, isLoading, isError, error } = useDevelopers({
 *     search, skills, experience, availability,
 *   });
 *
 * @param {Object} filters
 * @param {string} [filters.search]
 * @param {string[]} [filters.skills]
 * @param {string|null} [filters.experience]
 * @param {string|null} [filters.availability]
 */
export function useDevelopers(filters = {}) {
  const { search = "", skills = [], experience = null, availability = null } = filters;

  const query = useQuery({
    queryKey: ["developers", { search, skills, experience, availability }],
    queryFn: () => getDevelopers({ search, skills, experience, availability }),
  });

  return {
    developers: query.data?.developers ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}