import { useParams } from "react-router-dom";
import { AlertTriangle, GitCommit, ListChecks, MessageSquare, Trophy } from "lucide-react";

import ContributionHeader from "../components/contribution/ContributionHeader";
import ContributionChart from "../components/contribution/ContributionChart";
import ContributionList from "../components/contribution/ContributionList";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { projectDetails, defaultProjectDetails } from "../mock/projectDetailsMock";
import { useProjectContributions } from "../hooks/useProjectContributions";

// Groups events by calendar day and sums pointsAwarded — the same
// approach a real integration would use to build a timeline, since
// there's no dedicated timeline endpoint (see contributionsApi.js).
function aggregateEventsByDay(events) {
  const byDate = {};
  events.forEach((event) => {
    const date = event.createdAt.slice(0, 10); // YYYY-MM-DD
    byDate[date] = (byDate[date] ?? 0) + event.pointsAwarded;
  });
  return Object.entries(byDate)
    .map(([date, points]) => ({ date, points }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const EVENT_TYPE_LABEL = {
  TASK_COMPLETED: "completed a task",
  COMMIT_PUSHED: "pushed commits",
  MESSAGE_SENT: "sent a message",
};

/**
 * Project Contributions page (/projects/:projectId/contributions).
 *
 * Data flow: this page -> useProjectContributions(projectId) ->
 * contributionsApi.js -> contributionsMock.js (see hooks and api files
 * for exactly where getContributionStats/getContributionActivity
 * diverge from the real contribution-service API).
 *
 * projectDetailsMock is still imported directly here (not through the
 * hook) — `project.members` is reference data needed to resolve each
 * score/event's userId into a display name/avatar, not something being
 * fetched as its own resource.
 */
export default function ProjectContributions() {
  const { projectId } = useParams();

  const project = projectDetails[projectId] ?? defaultProjectDetails;

  const { scores, stats, events, isLoading, isError, error } =
    useProjectContributions(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load contributions"
        description={error?.message || "Please try again."}
      />
    );
  }

  // Resolve each score's userId into a displayable member — scores only
  // carry the id, same "resolve from project data" pattern used
  // everywhere else (tasks, resources, chat).
  const contributors = scores.map((score) => {
    const member = project.members.find((m) => m.id === score.userId);
    return {
      userId: score.userId,
      name: member?.name ?? "Unknown",
      avatarUrl: member?.avatarUrl,
      role: member?.role,
      tasksCompleted: score.tasksCompleted,
      commitsCount: score.commitsCount,
      messagesSent: score.messagesSent,
      totalScore: score.totalScore,
    };
  });
  // Already sorted highest-first by the API, no need to re-sort here.

  const headerStats = [
    { label: "Total Contributions", value: stats.totalScore, icon: Trophy },
    { label: "Tasks Completed", value: stats.tasksCompleted, icon: ListChecks },
    {
      label: "GitHub Commits",
      value: stats.commitsCount,
      icon: GitCommit,
      note: "Simulated — GitHub sync isn't connected yet.",
    },
    { label: "Messages Sent", value: stats.messagesSent, icon: MessageSquare },
  ];

  const chartData = aggregateEventsByDay(events);

  const enrichedEvents = events.slice(0, 8).map((event) => ({
    ...event,
    member: project.members.find((m) => m.id === event.userId),
  }));

  return (
    <div className="project-contributions-page flex flex-col gap-6">
      <ContributionHeader
        description="How the team has been contributing to this project."
        stats={headerStats}
      />

      <ContributionChart data={chartData} />

      <div className="rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
          Recent Activity
        </h2>

        {enrichedEvents.length === 0 ? (
          <p className="text-sm text-[var(--cm-muted)]">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {enrichedEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 text-sm">
                {event.member?.avatarUrl && (
                  <img
                    src={event.member.avatarUrl}
                    alt={event.member.name}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                )}
                <span className="text-[var(--cm-text-dim)]">
                  <span className="font-medium text-[var(--cm-text)]">
                    {event.member?.name ?? "Someone"}
                  </span>{" "}
                  {EVENT_TYPE_LABEL[event.eventType] ?? "did something"} —{" "}
                  {event.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
          Contribution Breakdown
        </h2>
        <ContributionList contributors={contributors} />
      </div>
    </div>
  );
}