/**
 * CommitActivity
 *
 * Recent commits on the linked repository: a 14-day commits-per-day bar chart
 * on top, then the latest commits.
 *
 * Props:
 *   dailyCommits {Array}   [{ date: 'YYYY-MM-DD', count }] oldest → newest
 *   commits      {Array}   [{ sha, message, author: { name, username }, branch, committedAt }]
 *   repoUrl      {string}  Used for the "View all commits" link
 *   sample       {boolean} Show the "sample data" badge (default true)
 */

import { ArrowUpRight, GitBranch } from 'lucide-react';

import { SampleDataBadge, formatRelativeTime } from './githubShared';

const CHART_HEIGHT = 96; // px

const formatDay = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function CommitChart({ daily }) {
  if (daily.length === 0) return null;

  const total = daily.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(...daily.map((d) => d.count), 1);
  const busiest = daily.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div className="border-b border-[#1C1A38] px-5 pb-4 pt-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs text-[#8B88AE]">Commits per day · last {daily.length} days</p>
        <p className="font-mono text-xs text-[#F5F5F5]">{total} total</p>
      </div>

      <div
        role="img"
        aria-label={`${total} commits over the last ${daily.length} days. Busiest day: ${formatDay(
          busiest.date
        )} with ${busiest.count}.`}
        className="flex gap-1.5"
        style={{ height: CHART_HEIGHT }}
      >
        {daily.map((day, i) => {
          const isLatest = i === daily.length - 1;
          const height = day.count === 0 ? 2 : Math.max(6, Math.round((day.count / max) * CHART_HEIGHT));
          return (
            <div
              key={day.date}
              title={`${formatDay(day.date)} — ${day.count} ${day.count === 1 ? 'commit' : 'commits'}`}
              className="flex flex-1 flex-col justify-end"
            >
              <div
                aria-hidden="true"
                style={{ height }}
                className={`w-full rounded-t transition-colors duration-150 ${
                  day.count === 0
                    ? 'bg-[#2E2A66]'
                    : isLatest
                    ? 'bg-[#C9A8FF]'
                    : 'bg-[#6C7BFF]/70 hover:bg-[#6C7BFF]'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-[#6B6890]" aria-hidden="true">
        <span>{formatDay(daily[0].date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function CommitActivity({ dailyCommits = [], commits = [], repoUrl, sample = true }) {
  return (
    <section
      aria-labelledby="commit-activity-title"
      className="rounded-xl border border-[#1C1A38] bg-[#0A0918]"
    >
      <div className="flex items-center gap-2 border-b border-[#1C1A38] px-5 py-3.5">
        <h2 id="commit-activity-title" className="text-sm font-semibold text-[#F5F5F5]">
          Recent commits
        </h2>
        {sample && <SampleDataBadge />}
      </div>

      <CommitChart daily={dailyCommits} />

      {commits.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#6B6890]">No commits yet.</p>
      ) : (
        <ul className="divide-y divide-[#1C1A38]">
          {commits.map((commit) => (
            <li key={commit.sha} className="flex items-center gap-3 px-5 py-3">
              <div
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D1A40]
                           text-[11px] font-semibold text-[#C9A8FF]"
              >
                {getInitials(commit.author.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#F5F5F5]" title={commit.message}>
                  {commit.message}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#8B88AE]">
                  <span className="font-mono">@{commit.author.username}</span>
                  <span aria-hidden="true" className="text-[#4A4660]">·</span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <GitBranch size={11} className="shrink-0 text-[#6B6890]" aria-hidden="true" />
                    <span className="truncate font-mono">{commit.branch}</span>
                  </span>
                  <span aria-hidden="true" className="text-[#4A4660]">·</span>
                  <span>{formatRelativeTime(commit.committedAt)}</span>
                </p>
              </div>

              <code className="shrink-0 rounded bg-[#1D1A40] px-2 py-1 font-mono text-[11px] text-[#C9A8FF]">
                {commit.sha.slice(0, 7)}
              </code>
            </li>
          ))}
        </ul>
      )}

      {repoUrl && (
        <div className="border-t border-[#1C1A38] px-5 py-3">
          <a
            href={`${repoUrl}/commits`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded text-xs text-[#8B88AE] transition-colors
                       hover:text-[#C9A8FF]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            View all commits on GitHub
            <ArrowUpRight size={12} />
          </a>
        </div>
      )}
    </section>
  );
}