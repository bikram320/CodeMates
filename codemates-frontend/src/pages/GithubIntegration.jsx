import { useEffect, useState } from "react";
import { AlertCircle, Check, RefreshCw } from "lucide-react";

import GithubConnectPanel from "../components/github/GitHubConnectPanel";
import GithubProfileCard from "../components/github/GitHubProfileCard";
import RepositoryList from "../components/github/RepositoryList";
import EmptyState from "../components/ui/EmptyState";

import useGithub from "../hooks/useGitHub";

/**
 * GitHub Integration page (/github).
 *
 * Connects the signed-in user's own GitHub account (github-sync-service) and
 * shows their synced repositories and per-repository commit stats.
 *
 * This is account-level, not project-level: the real backend
 * (GithubSyncController) only exposes connect / sync / profile /
 * repositories / commit-stats for the signed-in user, with no endpoint for
 * linking a specific repository to a specific project. If per-project
 * linking is needed, it likely lives in contribution-service's
 * repository-links, which hasn't been shared yet — see the note at the top
 * of src/api/githubApi.js.
 *
 * Talks directly to the real backend. No mock data.
 */

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

function GitHubProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your GitHub connection"
      className="animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5"
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-[#1D1A40]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-1/3 rounded bg-[#1D1A40]" />
          <div className="h-3 w-2/3 rounded bg-[#1D1A40]" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#1C1A38] pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-[#1D1A40]/60" />
        ))}
      </div>
    </div>
  );
}

function GitHubProfileError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your GitHub connection"
        description={getErrorMessage(error)}
      />
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium
                   text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

export default function GitHubIntegration() {
  const {
    profile,
    isLoadingProfile,
    isNotConnected,
    profileError,
    refetchProfile,
    repositories,
    isLoadingRepositories,
    repositoriesError,
    refetchRepositories,
    connect,
    isConnecting,
    connectError,
    sync,
    isSyncing,
  } = useGithub();

  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6000 : 4000
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const notify = (text, tone = "success") => setNotice({ text, tone });

  const handleConnect = async (accessToken) => {
    try {
      await connect(accessToken);
      notify("GitHub account connected.");
    } catch (err) {
      // The form shows connectError inline; still let the person know via toast too.
      notify(getErrorMessage(err), "error");
      throw err; // so the form knows the submit failed
    }
  };

  const handleSync = async () => {
    try {
      const result = await sync();
      notify(result?.message || `Synced ${result?.repositoriesSynced ?? 0} repositories.`);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  return (
    <div className="github-integration-page">
      <div className="head-container">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">GitHub</h1>
        <p className="mt-1 text-sm text-[#8B88AE]">
          Connect your GitHub account to see your repositories and commit activity.
        </p>
      </div>

      <div className="body-container mt-6 flex flex-col gap-6">
        {isLoadingProfile ? (
          <GitHubProfileSkeleton />
        ) : profileError ? (
          <GitHubProfileError error={profileError} onRetry={() => refetchProfile()} />
        ) : isNotConnected ? (
          <GithubConnectPanel
            onConnect={handleConnect}
            isConnecting={isConnecting}
            error={connectError}
          />
        ) : (
          <>
            <GithubProfileCard profile={profile} onSync={handleSync} isSyncing={isSyncing} />

            <section aria-labelledby="repositories-title">
              <h2 id="repositories-title" className="mb-3 text-sm font-semibold text-[#F5F5F5]">
                Repositories
              </h2>
              <RepositoryList
                repositories={repositories}
                isLoading={isLoadingRepositories}
                error={repositoriesError}
                onRetry={() => refetchRepositories()}
              />
            </section>
          </>
        )}
      </div>

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-sm items-center gap-2.5 rounded-xl
                     border border-[#2E2A66] bg-[#0F0E24] px-4 py-3 text-sm text-[#F5F5F5]
                     shadow-xl shadow-black/50 sm:left-auto sm:right-6 sm:mx-0"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              notice.tone === "error"
                ? "bg-red-400/20 text-red-300"
                : "bg-[#6C7BFF]/20 text-[#8E9BFF]"
            }`}
          >
            {notice.tone === "error" ? <AlertCircle size={12} /> : <Check size={12} />}
          </span>
          {notice.text}
        </div>
      )}
    </div>
  );
}