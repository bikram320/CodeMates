import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  GitCommit,
  ListChecks,
  MessageSquare,
  Trophy,
  X,
} from "lucide-react";
import {FaGithub as Github} from "react-icons/fa";

import ContributionHeader from "../components/contribution/ContributionHeader";
import ContributionChart from "../components/contribution/ContributionChart";
import ContributionList from "../components/contribution/ContributionList";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { useProjectContributions } from "../hooks/useProjectContributions";

function aggregateEventsByDay(events) {
  const byDate = {};
  events.forEach((event) => {
    const date = event.createdAt.slice(0, 10); // YYYY-MM-DD
    byDate[date] = (byDate[date] ?? 0) + Number(event.pointsAwarded ?? 0);
  });
  return Object.entries(byDate)
    .map(([date, points]) => ({ date, points }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const EVENT_TYPE_LABEL = {
  TASK_COMPLETED: "completed a task",
  COMMIT: "pushed commits",
  MESSAGE_SENT: "sent a message",
};

// ⚠️ Temporary display fallback. ContributionScoreResponse and
// ContributionEventResponse only ever carry a raw userId (UUID) — never
// a name or avatar. Resolving that into a real display name needs a
// project-service (member list) or user-profile-service response shape
// that hasn't been provided yet. Once that's available, replace this
// with a real lookup instead of a truncated ID.
function shortUserLabel(userId) {
  return `User ${userId?.slice(0, 8)}`;
}

/**
 * Project Contributions page (/projects/:projectId/contributions).
 *
 * Fully connected to the real backend — no mock data anywhere in this
 * chain. See hooks/useProjectContributions.js and api/contributionsApi.js
 * for exactly which pieces (project-wide stats, project-wide activity)
 * are computed client-side because no matching endpoint exists.
 */
export default function ProjectContributions() {
  const { projectId } = useParams();
  const [repoIdInput, setRepoIdInput] = useState("");

  const {
    scores,
    stats,
    events,
    repositoryLinks,
    isLoading,
    isError,
    error,
    linkRepository,
    isLinking,
    linkError,
    unlinkRepository,
  } = useProjectContributions(projectId);

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

  const contributors = scores.map((score) => ({
    userId: score.userId,
    name: shortUserLabel(score.userId),
    avatarUrl: undefined,
    role: undefined,
    tasksCompleted: score.tasksCompleted,
    commitsCount: score.commitsCount,
    messagesSent: score.messagesSent,
    totalScore: score.totalScore,
  }));

  const headerStats = [
    { label: "Total Contributions", value: stats.totalScore, icon: Trophy },
    { label: "Tasks Completed", value: stats.tasksCompleted, icon: ListChecks },
    {
      label: "GitHub Commits",
      value: stats.commitsCount,
      icon: GitCommit,
      note:
        repositoryLinks.length > 0
          ? `From ${repositoryLinks.length} linked repositor${
              repositoryLinks.length === 1 ? "y" : "ies"
            }.`
          : "No repositories linked yet.",
    },
    { label: "Messages Sent", value: stats.messagesSent, icon: MessageSquare },
  ];

  const chartData = aggregateEventsByDay(events);
  const enrichedEvents = events.slice(0, 8).map((event) => ({
    ...event,
    label: shortUserLabel(event.userId),
  }));

  function handleLinkRepo(e) {
    e.preventDefault();
    if (!repoIdInput.trim()) return;
    linkRepository(repoIdInput.trim());
    setRepoIdInput("");
  }

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
              <li key={event.id} className="text-sm text-[var(--cm-text-dim)]">
                <span className="font-medium text-[var(--cm-text)]">{event.label}</span>{" "}
                {EVENT_TYPE_LABEL[event.eventType] ?? event.eventType.toLowerCase()} —{" "}
                {event.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
          Linked Repositories
        </h2>

        {repositoryLinks.length === 0 ? (
          <p className="text-sm text-[var(--cm-muted)]">No repositories linked yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {repositoryLinks.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)]">
                  <Github size={14} />
                  {link.repositoryId}
                </span>
                <button
                  type="button"
                  onClick={() => unlinkRepository(link.repositoryId)}
                  aria-label="Unlink repository"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface-2)] hover:text-[var(--cm-text)]"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Minimal linking form — takes a repository UUID directly, since
            there's no GitHub-repo picker UI yet. Building one needs
            github-sync-service's GET /api/github/repositories, which
            wasn't part of this integration. */}
        <form onSubmit={handleLinkRepo} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={repoIdInput}
              onChange={(e) => setRepoIdInput(e.target.value)}
              placeholder="Repository ID"
              className="flex-1 rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] focus:border-[var(--cm-indigo)] focus:outline-none"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={isLinking}>
              {isLinking ? "Linking..." : "Link"}
            </Button>
          </div>
          {linkError && (
            <p className="text-xs text-[var(--cm-lavender)]">{linkError.message}</p>
          )}
        </form>
      </Card>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
          Contribution Breakdown
        </h2>
        <ContributionList contributors={contributors} />
      </div>
    </div>
  );
}