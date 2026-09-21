import { useQuery } from "@tanstack/react-query";
import {
  getContributionActivity,
  getContributionStats,
  getProjectContributions,
} from "../api/contributionApi";

const EMPTY_STATS = { totalScore: 0, tasksCompleted: 0, commitsCount: 0, messagesSent: 0 };

/**
 * ProjectContributions.jsx -> useProjectContributions(projectId) ->
 * contributionsApi.js -> contributionsMock.js
 *
 * Three independent queries (matching the three requested API functions)
 * rather than one combined call, since each maps to a different real
 * endpoint shape (or lack thereof — see contributionsApi.js's comments
 * on getContributionStats and getContributionActivity for where those
 * two diverge from the real API).
 *
 * @param {string} projectId
 */
export function useProjectContributions(projectId) {
  const contributionsQuery = useQuery({
    queryKey: ["contributions", "members", projectId],
    queryFn: () => getProjectContributions(projectId),
    enabled: !!projectId,
  });

  const statsQuery = useQuery({
    queryKey: ["contributions", "stats", projectId],
    queryFn: () => getContributionStats(projectId),
    enabled: !!projectId,
  });

  const activityQuery = useQuery({
    queryKey: ["contributions", "activity", projectId],
    queryFn: () => getContributionActivity(projectId),
    enabled: !!projectId,
  });

  const isLoading =
    contributionsQuery.isLoading || statsQuery.isLoading || activityQuery.isLoading;
  const isError = contributionsQuery.isError || statsQuery.isError || activityQuery.isError;
  const error = contributionsQuery.error ?? statsQuery.error ?? activityQuery.error;

  return {
    scores: contributionsQuery.data ?? [],
    stats: statsQuery.data ?? EMPTY_STATS,
    events: activityQuery.data ?? [],

    isLoading,
    isError,
    error,

    refetch: () => {
      contributionsQuery.refetch();
      statsQuery.refetch();
      activityQuery.refetch();
    },
  };
}