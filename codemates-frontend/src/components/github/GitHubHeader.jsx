/**
 * GitHubHeader
 *
 * Top of the Project GitHub page: back link, title, connected / not-connected
 * state, last-synced time, "Open on GitHub", and a two-step Disconnect.
 *
 * Props:
 *   projectId      {string}
 *   projectName    {string}   Label for the back link
 *   connected      {boolean}
 *   status         {'loading'|'error'}  Optional. While the connection state is
 *                                       still being fetched (or failed to load),
 *                                       show a neutral badge instead of
 *                                       "Not connected".
 *   repoUrl        {string}   Target of "Open on GitHub"
 *   repoFullName   {string}   Shown in the disconnect confirmation
 *   lastSyncedAt   {string}   ISO timestamp
 *   canManage      {boolean}  Viewer can disconnect (project leader)
 *   onDisconnect   {fn}
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Link2Off } from 'lucide-react';

import { formatRelativeTime } from './githubShared';

function ConnectionBadge({ connected, status }) {
  if (status === 'loading') {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-[22px] w-24 animate-pulse rounded-md bg-[#1D1A40]"
      />
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2E2A66] bg-[#1D1A40] px-2 py-0.5 text-xs font-medium text-[#8B88AE]">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Unavailable
      </span>
    );
  }

  return connected ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2E2A66] bg-[#1D1A40] px-2 py-0.5 text-xs font-medium text-[#8B88AE]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6B6890]" />
      Not connected
    </span>
  );
}

export default function GitHubHeader({
  projectId,
  projectName,
  connected,
  status,
  repoUrl,
  repoFullName,
  lastSyncedAt,
  canManage = false,
  onDisconnect,
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      <Link
        to={`/projects/${projectId}`}
        className="mb-3 inline-flex items-center gap-1.5 rounded text-xs text-[#8B88AE]
                   transition-colors hover:text-[#C9A8FF]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <ArrowLeft size={13} />
        {projectName ?? 'Project'}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">GitHub</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ConnectionBadge connected={connected} status={status} />
            <span className="text-sm text-[#8B88AE]">
              {status === 'loading'
                ? 'Checking connection…'
                : status === 'error'
                ? "Couldn't load the connection status."
                : connected
                ? `Last synced ${formatRelativeTime(lastSyncedAt)}`
                : 'Link a repository to track commits and activity.'}
            </span>
          </div>
        </div>

        {connected && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5
                         text-sm font-semibold text-[#0A0918] transition-colors hover:bg-[#8190FF]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]"
            >
              <ExternalLink size={15} />
              Open on GitHub
            </a>

            {canManage && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-expanded={confirming}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2.5
                           text-sm font-medium text-[#F5F5F5] transition-colors
                           hover:border-red-400/50 hover:text-red-300
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              >
                <Link2Off size={15} />
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Disconnect confirmation ───────────────────────────────────────── */}
      {connected && confirming && (
        <div
          role="group"
          aria-label="Confirm disconnect"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-[#2E2A66] bg-[#0F0E24] p-4
                     sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-[#F5F5F5]">
            Disconnect{' '}
            <span className="font-mono text-[#C9A8FF]">{repoFullName}</span>?
            <span className="mt-0.5 block text-xs text-[#8B88AE]">
              This project stops syncing from the repository. You can reconnect it later.
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium text-[#F5F5F5]
                         transition-colors hover:bg-[#1D1A40] sm:flex-none
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDisconnect();
              }}
              className="flex-1 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white
                         transition-colors hover:bg-red-500 sm:flex-none
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}