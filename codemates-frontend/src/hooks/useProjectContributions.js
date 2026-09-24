import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getContributionActivity,
  getContributionStats,
  getProjectContributions,
  getRepositoryLinks,
  linkRepository as linkRepositoryApi,
  unlinkRepository as unlinkRepositoryApi,
} from "../api/contributionsApi";

const EMPTY_STATS = { totalScore: 0, tasksCompleted: 0, commitsCount: 0, messagesSent: 0 };

/**
 * ProjectContributions.jsx -> useProjectContributions(projectId) ->
 * contributionsApi.js -> real contribution-service (via apiClient).
 *
 * No mock data anywhere in this chain — every query below hits the real
 * Gateway.
 *
 * @param {string} projectId
 */
export function useProjectContributions(projectId) {
  const queryClient = useQueryClient();

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

  const repoLinksQuery = useQuery({
    queryKey: ["contributions", "repoLinks", projectId],
    queryFn: () => getRepositoryLinks(projectId),
    enabled: !!projectId,
  });

  const isLoading =
    contributionsQuery.isLoading ||
    statsQuery.isLoading ||
    activityQuery.isLoading ||
    repoLinksQuery.isLoading;

  const isError =
    contributionsQuery.isError ||
    statsQuery.isError ||
    activityQuery.isError ||
    repoLinksQuery.isError;

  const error =
    contributionsQuery.error ?? statsQuery.error ?? activityQuery.error ?? repoLinksQuery.error;

  function invalidateRepoLinks() {
    queryClient.invalidateQueries({ queryKey: ["contributions", "repoLinks", projectId] });
  }

  const linkMutation = useMutation({
    mutationFn: (repositoryId) => linkRepositoryApi(projectId, repositoryId),
    onSuccess: invalidateRepoLinks,
  });

  const unlinkMutation = useMutation({
    mutationFn: (repositoryId) => unlinkRepositoryApi(projectId, repositoryId),
    onSuccess: invalidateRepoLinks,
  });

  return {
    scores: contributionsQuery.data ?? [],
    stats: statsQuery.data ?? EMPTY_STATS,
    events: activityQuery.data ?? [],
    repositoryLinks: repoLinksQuery.data ?? [],

    isLoading,
    isError,
    error,

    linkRepository: linkMutation.mutate,
    isLinking: linkMutation.isPending,
    linkError: linkMutation.error,

    unlinkRepository: unlinkMutation.mutate,
    isUnlinking: unlinkMutation.isPending,

    refetch: () => {
      contributionsQuery.refetch();
      statsQuery.refetch();
      activityQuery.refetch();
      repoLinksQuery.refetch();
    },
  };
}