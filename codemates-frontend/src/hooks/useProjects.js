import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projectApi";

/**
 * DiscoverProjects -> useProjects() -> projectApi.getProjects() -> mock data
 *
 * Pass the current filter state in; the query re-runs whenever any of
 * them change, because they're part of the query key.
 *
 *   const { projects, total, isLoading, isError, error } = useProjects({
 *     search, techStack, projectType, experience, availability,
 *   });
 *
 * @param {Object} filters
 * @param {string} [filters.search]
 * @param {string[]} [filters.techStack]
 * @param {string|null} [filters.projectType]
 * @param {string|null} [filters.experience]
 * @param {string|null} [filters.availability]
 */
export function useProjects(filters = {}) {
  const {
    search = "",
    techStack = [],
    projectType = null,
    experience = null,
    availability = null,
  } = filters;

  const query = useQuery({
    queryKey: [
      "projects",
      { search, techStack, projectType, experience, availability },
    ],
    queryFn: () =>
      getProjects({ search, techStack, projectType, experience, availability }),
  });

  return {
    projects: query.data?.projects ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}