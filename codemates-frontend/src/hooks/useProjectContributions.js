import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getContributionActivity,
  getContributionStats,
  getProjectContributions,
  getRepositoryLinks,
  getUserContributionEvents,
  linkRepository as linkRepositoryApi,
  predictSignificance as predictSignificanceApi, setProjectRepoUrl,
  unlinkRepository as unlinkRepositoryApi,
} from "../api/contributionsApi";

const EMPTY_STATS = { totalScore: 0, tasksCompleted: 0, commitsCount: 0, messagesSent: 0 };

/**
 * ProjectContributions.jsx -> useProjectContributions(projectId) ->
 * contributionsApi.js -> real contribution-service (via client.js).
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
    mutationFn: async ({ repositoryId, repoFullName }) => {
      const link = await linkRepositoryApi(projectId, repositoryId);
      if (repoFullName) {
        try {
          await setProjectRepoUrl(projectId, repoFullName);
        } catch (e) {
          // only the LEADER can update the project; never fail the link because of this
          console.warn("Could not save repo URL on project", e);
        }
      }
      return link;
    },
    onSuccess: () => {
      invalidateRepoLinks();
      // the backend now backfills commits on link, so refresh the numbers too
      ["members", "stats", "activity"].forEach((k) =>
          queryClient.invalidateQueries({ queryKey: ["contributions", k, projectId] })
      );
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", projectId] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (repositoryId) => unlinkRepositoryApi(projectId, repositoryId),
    onSuccess: invalidateRepoLinks,
  });

  // Model 3 (Contribution Intelligence) — mirrors Health's "Recalculate now".
  // On success, re-fetch the leaderboard so the new significanceProbability
  // values show up (ContributionScoreResponse carries them per-member).
  const predictMutation = useMutation({
    mutationFn: () => predictSignificanceApi(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contributions", "members", projectId] }),
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

    predictSignificance: predictMutation.mutate,
    isPredicting: predictMutation.isPending,
    predictError: predictMutation.error,

    refetch: () => {
      contributionsQuery.refetch();
      statsQuery.refetch();
      activityQuery.refetch();
      repoLinksQuery.refetch();
    },
  };
}

/**
 * One contributor's event history, fetched lazily (only while a card's
 * drilldown is open) rather than eagerly for every member on page load.
 */
export function useContributorEvents(projectId, userId) {
  const query = useQuery({
    queryKey: ["contributions", "events", projectId, userId],
    queryFn: () => getUserContributionEvents(projectId, userId),
    enabled: !!projectId && !!userId,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}