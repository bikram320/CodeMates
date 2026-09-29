import { useParams } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";

import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import ProjectHealth from "../components/analytics/ProjectHealth";
import ProjectOverviewStats from "../components/analytics/ProjectOverviewStats";
import TaskAnalytics from "../components/analytics/TaskAnalytics";
import TeamActivity from "../components/analytics/TeamActivity";
import ContributionAnalytics from "../components/analytics/ContributionAnalytics";
import ActivityTimeline from "../components/analytics/ActivityTimeline";
import EmptyState from "../components/ui/EmptyState";

import useAuth from "../hooks/useAuth";
import useProjectAnalytics from "../hooks/useProjectAnalytics";

/**
 * Project Analytics page (/projects/:projectId/analytics).
 *
 * Real backend, no mock — there is no analytics-service, so this is a
 * computed view over project-service (project, tasks, members),
 * contribution-service (scores, activity events), and project-service's ML
 * health prediction. See hooks/useProjectAnalytics.js for exactly how each
 * section is derived and which fields (like a project "milestone") were
 * dropped because they don't exist on the real ProjectResponse.
 *
 * Project health is deliberately NOT gated behind the rest of the page's
 * loading/error state — GET .../health legitimately returns `data: null` as
 * a *success* (no prediction computed yet), which is the common case, not an
 * error, so it gets its own always-visible section with its own states.
 */

const secondaryButton =
    "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium " +
    "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const skeletonCard = "animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]";

function AnalyticsSkeleton() {
    return (
        <div role="status" aria-label="Loading analytics" className="flex flex-col gap-6">
            <div aria-hidden="true" className={`${skeletonCard} p-5`}>
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-[#1D1A40]" />
                        <div className="h-3 w-24 rounded bg-[#1D1A40]" />
                    </div>
                    <div className="h-8 w-14 rounded bg-[#1D1A40]" />
                </div>
                <div className="mt-5 h-2 rounded-full bg-[#1D1A40]" />
            </div>

            <div aria-hidden="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`${skeletonCard} h-[112px] p-4`}>
                        <div className="h-3 w-1/2 rounded bg-[#1D1A40]" />
                        <div className="mt-5 h-6 w-1/3 rounded bg-[#1D1A40]" />
                        <div className="mt-3 h-3 w-2/3 rounded bg-[#1D1A40]" />
                    </div>
                ))}
            </div>

            <div aria-hidden="true" className={`${skeletonCard} h-[260px]`} />

            <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className={`${skeletonCard} h-[380px]`} />
                <div className={`${skeletonCard} h-[380px]`} />
            </div>

            <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                <div className={`${skeletonCard} h-[340px]`} />
                <div className={`${skeletonCard} h-[340px]`} />
            </div>
        </div>
    );
}

export default function ProjectAnalytics() {
    const { projectId } = useParams();
    const { user } = useAuth();

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        health,
        isHealthLoading,
        isHealthError,
        healthError,
        syncHealth,
        isSyncingHealth,
        syncHealthError,
    } = useProjectAnalytics(projectId);

    // "Recalculate now" refreshes this project's health only — restricted to the project's LEADER.
    const myUserId = user?.userId ?? user?.id;
    const canSyncHealth = !!myUserId && !!data?.members?.some((m) => m.userId === myUserId && m.role === "LEADER");

    return (
        <div className="project-analytics-page">
            <div className="head-container">
                <AnalyticsHeader projectId={projectId} projectName={data?.project?.name} />
            </div>

            <div className="body-container mt-6 flex flex-col gap-6">
                <ProjectHealth
                    health={health}
                    isLoading={isHealthLoading}
                    isError={isHealthError}
                    error={healthError}
                    canSync={canSyncHealth}
                    onSync={syncHealth}
                    isSyncing={isSyncingHealth}
                    syncError={syncHealthError}
                />

                {isLoading ? (
                    <AnalyticsSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center">
                        <EmptyState
                            icon={AlertCircle}
                            title="Couldn't load analytics"
                            description={error?.message || "Something went wrong. Try again."}
                        />
                        <button type="button" onClick={() => refetch()} className={secondaryButton}>
                            <RefreshCw size={14} />
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        <ProjectOverviewStats tasks={data.tasks} milestone={null} />
                        <TaskAnalytics tasks={data.tasks} />

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <TeamActivity members={data.team} />
                            <ContributionAnalytics contributions={data.contributions} />
                        </div>

                        <ActivityTimeline trend={data.trend} activity={data.activity} />
                    </>
                )}
            </div>
        </div>
    );
}