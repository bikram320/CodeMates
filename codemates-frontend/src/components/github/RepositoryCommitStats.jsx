/**
 * RepositoryCommitStats
 *
 * Commit stats for one repository, fetched on demand (only while the
 * repository's card is expanded — see `enabled` on useRepositoryCommitStats).
 *
 * Props:
 *   repositoryId  {string}
 *   enabled       {boolean}  Only fetch while the card showing this is open
 */

import { AlertCircle, GitCommit, RefreshCw } from 'lucide-react';

import { useRepositoryCommitStats } from '../../hooks/useGitHub';
import { formatRelativeTime } from './githubSharedHelpers';

const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');

function Tile({ label, value }) {
  return (
    <div className="rounded-lg bg-[#1D1A40]/60 px-3 py-2.5 text-center">
      <p className="font-mono text-lg font-semibold text-[#F5F5F5]">{fmt(value)}</p>
      <p className="mt-0.5 text-[11px] text-[#8B88AE]">{label}</p>
    </div>
  );
}

export default function RepositoryCommitStats({ repositoryId, enabled = true }) {
  const { data: stats, isLoading, isError, error, refetch } = useRepositoryCommitStats(repositoryId, {
    enabled,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading commit stats"
        className="grid grid-cols-3 gap-2 border-t border-[#1C1A38] p-4"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="h-[54px] animate-pulse rounded-lg bg-[#1D1A40]/60" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1C1A38] p-4">
        <p className="flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={13} className="shrink-0" />
          {error?.message || "Couldn't load commit stats."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2A66] px-2.5 py-1.5 text-xs font-medium
                     text-[#F5F5F5] transition-colors hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          <RefreshCw size={12} />
          Try again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border-t border-[#1C1A38] p-4">
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Total commits" value={stats.totalCommits} />
        <Tile label="Last 30 days" value={stats.commitsLast30Days} />
        <Tile label="Last 7 days" value={stats.commitsLast7Days} />
      </div>
      {stats.lastCommitAt && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-[#8B88AE]">
          <GitCommit size={12} className="shrink-0" />
          Last commit {formatRelativeTime(stats.lastCommitAt)}
        </p>
      )}
    </div>
  );
}