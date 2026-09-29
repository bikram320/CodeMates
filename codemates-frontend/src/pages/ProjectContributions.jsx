import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  GitCommit,
  ListChecks,
  MessageSquare,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { FaGithub as Github } from "react-icons/fa";

import ContributionHeader from "../components/contribution/ContributionHeader";
import ContributionChart from "../components/contribution/ContributionChart";
import ContributionList from "../components/contribution/ContributionList";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import useAuth from "../hooks/useAuth";
import { useProjectMembers } from "../hooks/useMyProjects";
import useGithub from "../hooks/useGitHub";
import { useProjectContributions, useContributorEvents } from "../hooks/useProjectContributions";

function aggregateEventsByDay(events) {
  const byDate = {};
  events.forEach((event) => {
    const date = event.createdAt.slice(0, 10);
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

// ⚠️ Same fallback used on the Analytics page — neither
// ContributionScoreResponse nor ContributionEventResponse carry a name.
function shortUserLabel(userId) {
  return `User ${userId?.slice(0, 8)}`;
}

// A repo this user has already linked to THIS project shouldn't be offered
// again (the backend 409s on a duplicate link) — RepositoryLinkResponse
// carries userId, so we can filter to "linked by me, here" specifically.
function reposAvailableToLink(repositories, repositoryLinks, currentUserId) {
  const linkedByMe = new Set(
      repositoryLinks.filter((l) => l.userId === currentUserId).map((l) => l.repositoryId)
  );
  return (repositories ?? []).filter((r) => !linkedByMe.has(r.id));
}

// Real fields per RepositoryResponseDto.java: id, repoName, repoFullName,
// repoUrl, primaryLanguage, starsCount, forksCount, isPrivate, isForked,
// lastPushedAt. Show the full "owner/repo" name plus language, since a repo
// picker with just "repo-name" repeated across multiple owners would be
// ambiguous otherwise.
function repoDisplayName(repo) {
  return repo.primaryLanguage
      ? `${repo.repoFullName} (${repo.primaryLanguage})`
      : repo.repoFullName ?? repo.repoName ?? repo.id;
}

export default function ProjectContributions() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [drilldownUserId, setDrilldownUserId] = useState(null);

  const { members } = useProjectMembers(projectId);
  const canManage = !!user && members.some((m) => m.userId === user.userId && m.role === "LEADER");

  const {
    isNotConnected: githubNotConnected,
    repositories,
    isLoadingRepositories,
  } = useGithub();

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
    predictSignificance,
    isPredicting,
    predictError,
  } = useProjectContributions(projectId);

  const {
    events: drilldownEvents,
    isLoading: isDrilldownLoading,
  } = useContributorEvents(projectId, drilldownUserId);

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
    significanceProbability: score.significanceProbability,
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
    if (!selectedRepoId) return;
    const repo = (repositories ?? []).find((r) => r.id === selectedRepoId);
    linkRepository({ repositoryId: selectedRepoId, repoFullName: repo?.repoFullName });
    setSelectedRepoId("");
  }

  return (
      <div className="project-contributions-page flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <ContributionHeader
              description="How the team has been contributing to this project."
              stats={headerStats}
              className="flex-1"
          />

          {canManage && (
              <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={Sparkles}
                  onClick={() => predictSignificance()}
                  disabled={isPredicting}
              >
                {isPredicting ? "Predicting..." : "Predict significance"}
              </Button>
          )}
        </div>
        {predictError && (
            <p className="text-xs text-[var(--cm-lavender)]">{predictError.message}</p>
        )}

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
                {repositoryLinks.map((link) => {
                  const matched = repositories?.find((r) => r.id === link.repositoryId);
                  return (
                      <li
                          key={link.id}
                          className="flex items-center justify-between rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2"
                      >
                  <span className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)]">
                    <Github size={14} />
                    {matched ? repoDisplayName(matched) : link.repositoryId}
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
                  );
                })}
              </ul>
          )}

          {/* Repo picker — sourced from the user's own synced GitHub repos
            (useGithub()), not free text. Linking scores THIS user's commits
            on the chosen repo toward this project (see RepositoryLinkService). */}
          {githubNotConnected ? (
              <p className="text-sm text-[var(--cm-muted)]">
                Connect your GitHub account on the GitHub Integration page to link a repository.
              </p>
          ) : (
              <form onSubmit={handleLinkRepo} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                      value={selectedRepoId}
                      onChange={(e) => setSelectedRepoId(e.target.value)}
                      disabled={isLoadingRepositories}
                      className="flex-1 rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] focus:border-[var(--cm-indigo)] focus:outline-none"
                  >
                    <option value="">
                      {isLoadingRepositories ? "Loading your repos..." : "Select a repository"}
                    </option>
                    {reposAvailableToLink(repositories, repositoryLinks, user?.userId).map((repo) => (
                        <option key={repo.id} value={repo.id}>
                          {repoDisplayName(repo)}
                        </option>
                    ))}
                  </select>
                  <Button type="submit" variant="secondary" size="sm" disabled={isLinking || !selectedRepoId}>
                    {isLinking ? "Linking..." : "Link"}
                  </Button>
                </div>
                {linkError && (
                    <p className="text-xs text-[var(--cm-lavender)]">{linkError.message}</p>
                )}
              </form>
          )}
        </Card>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
            Contribution Breakdown
          </h2>
          <ContributionList contributors={contributors} onSelect={setDrilldownUserId} />
        </div>

        {drilldownUserId && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setDrilldownUserId(null)}
            >
              <Card
                  onClick={(e) => e.stopPropagation()}
                  className="flex max-h-[70vh] w-full max-w-md flex-col gap-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--cm-text)]">
                    {shortUserLabel(drilldownUserId)} — activity
                  </h3>
                  <button type="button" onClick={() => setDrilldownUserId(null)}>
                    <X size={16} className="text-[var(--cm-muted)]" />
                  </button>
                </div>

                {isDrilldownLoading ? (
                    <Spinner size="md" />
                ) : drilldownEvents.length === 0 ? (
                    <p className="text-sm text-[var(--cm-muted)]">No events yet.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                      {drilldownEvents.map((e) => (
                          <li key={e.id} className="text-xs text-[var(--cm-text-dim)]">
                            {EVENT_TYPE_LABEL[e.eventType] ?? e.eventType.toLowerCase()} — {e.description}
                            <span className="ml-1 text-[var(--cm-muted)]">
                      ({new Date(e.createdAt).toLocaleDateString()})
                    </span>
                          </li>
                      ))}
                    </ul>
                )}
              </Card>
            </div>
        )}
      </div>
  );
}