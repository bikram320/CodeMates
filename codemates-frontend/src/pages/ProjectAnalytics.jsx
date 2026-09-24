import { useParams } from "react-router-dom";
import { AlertCircle, Info, RefreshCw } from "lucide-react";

import AnalyticsHeader from "../components/analytics/AnalyticsHeader";
import ProjectOverviewStats from "../components/analytics/ProjectOverviewStats";
import TaskAnalytics from "../components/analytics/TaskAnalytics";
import TeamActivity from "../components/analytics/TeamActivity";
import ContributionAnalytics from "../components/analytics/ContributionAnalytics";
import ActivityTimeline from "../components/analytics/ActivityTimeline";
import EmptyState from "../components/ui/EmptyState";

import { projectDetails, defaultProjectDetails } from "../mock/projectDetailsMock";
import useProjectAnalytics from "../hooks/useProjectAnalytics";

/**
 * Project Analytics page (/projects/:projectId/analytics).
 *
 * ⚠️ MOCK DATA ONLY. Nothing is read from tasks, GitHub or chat, and a
 * "sample data" note stays visible on the page.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 *   ProjectAnalytics.jsx
 *       ↓  calls
 *   useProjectAnalytics(projectId)   src/hooks/useProjectAnalytics.js
 *       ↓  calls
 *   analyticsApi.js                  src/api/analyticsApi.js
 *       ↓  currently routes to
 *   analyticsMock.js                 src/mock/analyticsMock.js
 *
 * Remove the "sample data" note when real data is connected.
 * Testing states: add ?mockAnalytics=empty or ?mockAnalytics=error to the URL.
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

      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className={`${skeletonCard} h-[380px]`} />
        <div className={`${skeletonCard} h-[380px]`} />
      </div>

      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className={`${skeletonCard} h-[340px]`} />
        <div className={`${skeletonCard} h-[340px]`} />
      </div>
    </div>
  );
}

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const project = projectDetails[projectId] ?? defaultProjectDetails;

  const { data, isLoading, isError, error, refetch } = useProjectAnalytics(projectId);

  return (
    <div className="project-analytics-page">
      <div className="head-container">
        <AnalyticsHeader projectId={projectId} projectName={project?.name} />
      </div>

      <div className="body-container mt-6 flex flex-col gap-6">
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
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-4 py-3"
            >
              <Info size={15} className="mt-0.5 shrink-0 text-[#C9A8FF]" />
              <p className="text-xs leading-relaxed text-[#A9A6C8]">
                <span className="font-medium text-[#F5F5F5]">Sample data.</span> These numbers are mock values for
                previewing the layout. Nothing here is calculated from your tasks, commits or messages yet.
              </p>
            </div>

            <ProjectOverviewStats tasks={data.tasks} milestone={data.milestone} />
            <TaskAnalytics tasks={data.tasks} />

            <TeamActivity members={data.team} />
            <ContributionAnalytics contributions={data.contributions} />
            <ActivityTimeline trend={data.trend} activity={data.activity} />
          </>
        )}
      </div>
    </div>
  );
}