/**
 * RepositoryActivity
 *
 * Recent repository-level events: pull requests, issues, branches, releases.
 * (Commits live in CommitActivity.)
 *
 * Props:
 *   events {Array}
 *     { id, type, actor, title?, number?, ref?, createdAt }
 *     type: PULL_REQUEST_OPENED | PULL_REQUEST_MERGED | ISSUE_OPENED |
 *           ISSUE_CLOSED | BRANCH_CREATED | RELEASE_PUBLISHED
 *   sample {boolean}  Show the "sample data" badge (default true)
 */

import {
  CheckCircle2,
  CircleDot,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Tag,
} from 'lucide-react';

import { SampleDataBadge, formatRelativeTime } from './githubShared';

const EVENT_META = {
  PULL_REQUEST_MERGED: {
    icon: GitMerge,
    tone: 'bg-[#C9A8FF]/10 text-[#C9A8FF]',
    verb: (e) => `merged pull request #${e.number}`,
  },
  PULL_REQUEST_OPENED: {
    icon: GitPullRequest,
    tone: 'bg-[#6C7BFF]/10 text-[#8E9BFF]',
    verb: (e) => `opened pull request #${e.number}`,
  },
  ISSUE_OPENED: {
    icon: CircleDot,
    tone: 'bg-emerald-400/10 text-emerald-300',
    verb: (e) => `opened issue #${e.number}`,
  },
  ISSUE_CLOSED: {
    icon: CheckCircle2,
    tone: 'bg-[#C9A8FF]/10 text-[#C9A8FF]',
    verb: (e) => `closed issue #${e.number}`,
  },
  BRANCH_CREATED: {
    icon: GitBranch,
    tone: 'bg-[#6C7BFF]/10 text-[#8E9BFF]',
    verb: () => 'created branch',
  },
  RELEASE_PUBLISHED: {
    icon: Tag,
    tone: 'bg-amber-400/10 text-amber-300',
    verb: () => 'published release',
  },
};

export default function RepositoryActivity({ events = [], sample = true }) {
  return (
    <section
      aria-labelledby="repo-activity-title"
      className="rounded-xl border border-[#1C1A38] bg-[#0A0918]"
    >
      <div className="flex items-center gap-2 border-b border-[#1C1A38] px-5 py-3.5">
        <h2 id="repo-activity-title" className="text-sm font-semibold text-[#F5F5F5]">
          Repository activity
        </h2>
        {sample && <SampleDataBadge />}
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#6B6890]">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-[#1C1A38]">
          {events.map((event) => {
            const meta = EVENT_META[event.type];
            if (!meta) return null;
            const Icon = meta.icon;
            const detail = event.title ?? event.ref;

            return (
              <li key={event.id} className="flex gap-3 px-5 py-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}
                >
                  <Icon size={14} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#8B88AE]">
                    <span className="font-medium text-[#F5F5F5]">@{event.actor}</span>{' '}
                    {meta.verb(event)}
                  </p>
                  {detail && (
                    <p
                      title={detail}
                      className={`mt-0.5 truncate text-xs text-[#A9A6C8] ${
                        event.ref ? 'font-mono' : ''
                      }`}
                    >
                      {detail}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-[#6B6890]">
                    {formatRelativeTime(event.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}