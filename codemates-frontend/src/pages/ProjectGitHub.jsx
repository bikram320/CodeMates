import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  GitBranch,
  Info,
  Link2,
  RefreshCw,
  X,
} from "lucide-react";

import GitHubHeader from "../components/github/GitHubHeader";
import RepositoryCard from "../components/github/RepositoryCard";
import GitHubStats from "../components/github/GitHubStats";
import CommitActivity from "../components/github/CommitActivity";
import RepositoryActivity from "../components/github/RepositoryActivity";
import EmptyState from "../components/ui/EmptyState";

import useProjectGitHub from "../hooks/useProjectGitHub";
import {
  projectDetails,
  defaultProjectDetails,
} from "../mock/projectDetailsMock";

/**
 * Project GitHub page (/projects/:projectId/github).
 *
 * ⚠️ MOCK DATA ONLY. Data comes from useProjectGitHub(projectId) → githubApi →
 * mock data. There are no GitHub API calls and no OAuth; "Connect" just links
 * the sample repository. Every card that shows these numbers carries a
 * "sample data" badge.
 */

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#0A0918] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium " +
  "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

/* ── Loading + error + empty states ──────────────────────────────────────── */

function GitHubSkeleton() {
  return (
    <div role="status" aria-label="Loading GitHub data" className="flex flex-col gap-6">
      {/* Repository card */}
      <div
        aria-hidden="true"
        className="animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5"
      >
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-[#1D1A40]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-[#1D1A40]" />
            <div className="h-3 w-24 rounded bg-[#1D1A40]" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-[#1D1A40]" />
          <div className="h-3 w-4/5 rounded bg-[#1D1A40]" />
        </div>
        <div className="mt-4 h-10 rounded-lg bg-[#1D1A40]/50" />
      </div>

      {/* Stat tiles */}
      <div aria-hidden="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[112px] animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918] p-4"
          >
            <div className="h-3 w-1/2 rounded bg-[#1D1A40]" />
            <div className="mt-5 h-6 w-1/3 rounded bg-[#1D1A40]" />
            <div className="mt-3 h-3 w-2/3 rounded bg-[#1D1A40]" />
          </div>
        ))}
      </div>

      {/* Commits + activity */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-[420px] animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]" />
        <div className="h-[420px] animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]" />
      </div>
    </div>
  );
}

function GitHubError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load GitHub data"
        description={getErrorMessage(error)}
      />
      <button type="button" onClick={onRetry} className={secondaryButton}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

function NotConnected({ canManage, busy, onConnect }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={GitBranch}
        title="No repository connected"
        description={
          canManage
            ? "Connect a GitHub repository to see commits, pull requests and issues next to your tasks."
            : "A project leader can connect a GitHub repository to show its activity here."
        }
      />
      {canManage && (
        <>
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            aria-busy={busy}
            className={primaryButton}
          >
            <Link2 size={15} />
            {busy ? "Connecting…" : "Connect repository"}
          </button>
          <p className="mt-3 max-w-sm text-center text-xs text-[#6B6890]">
            Demo only: this loads sample data. GitHub sign-in isn&apos;t set up yet.
          </p>
        </>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ProjectGitHub() {
  const { projectId } = useParams();
  const project = projectDetails[projectId] ?? defaultProjectDetails;

  const {
    repository,
    stats,
    dailyCommits,
    recentCommits,
    recentActivity,
    connected,
    canManage,
    isLoading,
    isError,
    error,
    refetch,
    connectRepository,
    disconnectRepository,
    isConnecting,
  } = useProjectGitHub(projectId);

  // Error from a connect / disconnect attempt (load errors use <GitHubError />).
  const [actionError, setActionError] = useState(null);

  const handleConnect = async () => {
    setActionError(null);
    try {
      await connectRepository();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDisconnect = async () => {
    setActionError(null);
    try {
      await disconnectRepository();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  return (
    <div className="project-github-page">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="head-container">
        <GitHubHeader
          projectId={projectId}
          projectName={project?.name}
          connected={connected}
          status={isLoading ? "loading" : isError ? "error" : undefined}
          repoUrl={repository?.repoUrl}
          repoFullName={repository?.repoFullName}
          lastSyncedAt={repository?.lastSyncedAt}
          canManage={canManage}
          onDisconnect={handleDisconnect}
        />
      </div>

      <div className="body-container mt-6 flex flex-col gap-6">
        {actionError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-300" />
            <p className="flex-1 text-xs leading-relaxed text-red-200">
              {actionError}
            </p>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss"
              className="shrink-0 rounded text-red-300 transition-colors hover:text-red-100
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isLoading ? (
          <GitHubSkeleton />
        ) : isError ? (
          <GitHubError error={error} onRetry={() => refetch()} />
        ) : connected ? (
          <>
            {/* Always-visible reminder that nothing here is live */}
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-4 py-3"
            >
              <Info size={15} className="mt-0.5 shrink-0 text-[#C9A8FF]" />
              <p className="text-xs leading-relaxed text-[#A9A6C8]">
                <span className="font-medium text-[#F5F5F5]">Sample data.</span>{" "}
                These numbers are mock values. Live GitHub sync isn&apos;t
                connected yet, so nothing on this page comes from GitHub.
              </p>
            </div>

            <RepositoryCard repository={repository} />

            <GitHubStats
              stats={stats}
              defaultBranch={repository.defaultBranch}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
              <div className="main-container">
                <CommitActivity
                  dailyCommits={dailyCommits}
                  commits={recentCommits}
                  repoUrl={repository.repoUrl}
                />
              </div>

              <div className="sidebar-container">
                <RepositoryActivity events={recentActivity} />
              </div>
            </div>
          </>
        ) : (
          <NotConnected
            canManage={canManage}
            busy={isConnecting}
            onConnect={handleConnect}
          />
        )}
      </div>
    </div>
  );
}