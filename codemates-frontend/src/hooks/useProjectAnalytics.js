/**
 * src/hooks/useProjectAnalytics.js
 *
 * Data hook for the Project Analytics page.
 *
 *   ProjectAnalytics.jsx → useProjectAnalytics(projectId)
 *       → analyticsApi.js → analyticsMock.js (later: the real services)
 *
 * Runs the five slice requests in parallel (each cached under its own key) and
 * merges them into the single object the page renders:
 *
 *   { milestone, tasks, team, contributions, trend, activity }
 *
 * The page shows one loading state and one error state, so `data` stays null
 * until every slice has loaded, and any failed slice counts as an error.
 * Because slices are cached separately, they can later be refetched or shown
 * independently without changing the API layer.
 */

import { useQueries } from "@tanstack/react-query";

import {
  getContributionAnalytics,
  getProjectActivity,
  getProjectAnalytics,
  getTaskAnalytics,
  getTeamActivity,
} from "../api/analyticsApi";

export const analyticsKeys = {
  all: (projectId) => ["projectAnalytics", projectId],
  overview: (projectId) => ["projectAnalytics", projectId, "overview"],
  tasks: (projectId) => ["projectAnalytics", projectId, "tasks"],
  team: (projectId) => ["projectAnalytics", projectId, "team"],
  contributions: (projectId) => ["projectAnalytics", projectId, "contributions"],
  activity: (projectId) => ["projectAnalytics", projectId, "activity"],
};

// retry: false so mock errors show immediately — raise to 1–2 once the real API is wired.
const options = { retry: false, staleTime: 30_000 };

export function useProjectAnalytics(projectId) {
  const results = useQueries({
    queries: [
      { queryKey: analyticsKeys.overview(projectId), queryFn: () => getProjectAnalytics(projectId), ...options },
      { queryKey: analyticsKeys.tasks(projectId), queryFn: () => getTaskAnalytics(projectId), ...options },
      { queryKey: analyticsKeys.team(projectId), queryFn: () => getTeamActivity(projectId), ...options },
      { queryKey: analyticsKeys.contributions(projectId), queryFn: () => getContributionAnalytics(projectId), ...options },
      { queryKey: analyticsKeys.activity(projectId), queryFn: () => getProjectActivity(projectId), ...options },
    ],
  });

  const [overview, tasks, team, contributions, activity] = results;
  const failed = results.find((r) => r.isError);
  const ready = results.every((r) => r.isSuccess);

  const data = ready
    ? {
        milestone: overview.data.milestone,
        tasks: tasks.data,
        team: team.data.members,
        contributions: contributions.data.contributions,
        trend: activity.data.trend,
        activity: activity.data.events,
      }
    : null;

  return {
    data,
    isLoading: !failed && !ready,
    isError: !!failed,
    error: failed?.error ?? null,
    // Retry only the failed slices; if nothing failed, refresh everything.
    refetch: () => Promise.all((failed ? results.filter((r) => r.isError) : results).map((r) => r.refetch())),
  };
}

export default useProjectAnalytics;