/**
 * GitHubStats
 *
 * Four headline numbers for the linked repository: total commits, branches,
 * pull requests and issues. Labelled "sample data" while they're mock values.
 *
 * Props:
 *   stats {object}
 *     totalCommits      number
 *     commitsLast7Days  number
 *     branches          number
 *     pullRequests      { open, merged, closed }
 *     issues            { open, closed }
 *   defaultBranch {string}   Shown under the branch count
 *   sample        {boolean}  Show the "sample data" badge (default true)
 */

import { CircleDot, GitBranch, GitCommit, GitPullRequest } from 'lucide-react';

import { SampleDataBadge } from './githubShared';

const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');

function StatTile({ label, value, detail, icon: Icon, tone }) {
  const toneClass =
    tone === 'lavender'
      ? 'bg-[#C9A8FF]/10 text-[#C9A8FF]'
      : 'bg-[#6C7BFF]/10 text-[#8E9BFF]';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-4 transition-colors duration-150 hover:border-[#2E2A66]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[#8B88AE]">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold text-[#F5F5F5]">{value}</p>
      <p className="text-xs text-[#6B6890]">{detail}</p>
    </div>
  );
}

export default function GitHubStats({ stats, defaultBranch, sample = true }) {
  const prTotal =
    stats.pullRequests.open + stats.pullRequests.merged + stats.pullRequests.closed;
  const issueTotal = stats.issues.open + stats.issues.closed;

  return (
    <section aria-labelledby="github-stats-title">
      <div className="mb-3 flex items-center gap-2">
        <h2 id="github-stats-title" className="text-sm font-semibold text-[#F5F5F5]">
          Repository stats
        </h2>
        {sample && <SampleDataBadge />}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label="Total commits"
          value={fmt(stats.totalCommits)}
          detail={`+${fmt(stats.commitsLast7Days)} this week`}
          icon={GitCommit}
          tone="indigo"
        />
        <StatTile
          label="Branches"
          value={fmt(stats.branches)}
          detail={defaultBranch ? `default: ${defaultBranch}` : ' '}
          icon={GitBranch}
          tone="lavender"
        />
        <StatTile
          label="Pull requests"
          value={fmt(prTotal)}
          detail={`${fmt(stats.pullRequests.open)} open · ${fmt(stats.pullRequests.merged)} merged`}
          icon={GitPullRequest}
          tone="indigo"
        />
        <StatTile
          label="Issues"
          value={fmt(issueTotal)}
          detail={`${fmt(stats.issues.open)} open · ${fmt(stats.issues.closed)} closed`}
          icon={CircleDot}
          tone="lavender"
        />
      </div>
    </section>
  );
}