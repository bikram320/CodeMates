/**
 * RepositoryCard
 *
 * Details of the repository linked to the project: name, description,
 * visibility, status, URL (with copy), and quick metadata.
 *
 * Props:
 *   repository {object}
 *     repoFullName     'owner/name'
 *     repoUrl          https URL of the repo
 *     description      string | null
 *     isPrivate        boolean
 *     isArchived       boolean
 *     defaultBranch    string
 *     primaryLanguage  string | null
 *     starsCount, forksCount  number
 *     lastPushedAt     ISO string
 *     connectedBy      username of whoever linked it
 *     connectedAt      ISO string
 */

import { useEffect, useState } from 'react';
import { Check, Copy, GitBranch, GitFork, Globe, Link2, Lock, Star } from 'lucide-react';

import { GitHubMark, formatDate, formatRelativeTime } from './githubShared';

function VisibilityChip({ isPrivate }) {
  const Icon = isPrivate ? Lock : Globe;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
        isPrivate
          ? 'border-[#C9A8FF]/30 bg-[#C9A8FF]/10 text-[#C9A8FF]'
          : 'border-[#6C7BFF]/30 bg-[#6C7BFF]/10 text-[#8E9BFF]'
      }`}
    >
      <Icon size={11} />
      {isPrivate ? 'Private' : 'Public'}
    </span>
  );
}

function StatusChip({ isArchived }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#8B88AE]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isArchived ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />
      {isArchived ? 'Archived' : 'Active'}
    </span>
  );
}

export default function RepositoryCard({ repository }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const [owner, name] = repository.repoFullName.split('/');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(repository.repoUrl);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions) — fail quietly.
    }
  };

  return (
    <section
      aria-label="Connected repository"
      className="rounded-xl border border-[#1C1A38] bg-[#0A0918]"
    >
      <div className="p-5">
        {/* ── Identity ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D1A40] text-[#F5F5F5]">
            <GitHubMark size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-[#F5F5F5]">
              <span className="font-normal text-[#8B88AE]">{owner}/</span>
              {name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <VisibilityChip isPrivate={repository.isPrivate} />
              <StatusChip isArchived={repository.isArchived} />
            </div>
          </div>
        </div>

        {repository.description && (
          <p className="mt-4 text-sm leading-relaxed text-[#A9A6C8]">
            {repository.description}
          </p>
        )}

        {/* ── URL ─────────────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#2E2A66] bg-[#1D1A40]/50 py-1.5 pl-3 pr-1.5">
          <Link2 size={14} className="shrink-0 text-[#6B6890]" />
          <a
            href={repository.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate rounded font-mono text-xs text-[#C9A8FF] hover:underline
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            {repository.repoUrl}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Repository URL copied' : 'Copy repository URL'}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-[#8B88AE]
                       transition-colors hover:bg-[#2E2A66]/60 hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* ── Metadata ────────────────────────────────────────────────────── */}
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#8B88AE]">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Default branch</dt>
            <GitBranch size={13} className="text-[#6B6890]" aria-hidden="true" />
            <dd className="font-mono text-[#F5F5F5]">{repository.defaultBranch}</dd>
          </div>

          {repository.primaryLanguage && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Language</dt>
              <span className="h-2 w-2 rounded-full bg-[#C9A8FF]" aria-hidden="true" />
              <dd>{repository.primaryLanguage}</dd>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Stars</dt>
            <Star size={13} className="text-[#6B6890]" aria-hidden="true" />
            <dd>{repository.starsCount}</dd>
          </div>

          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Forks</dt>
            <GitFork size={13} className="text-[#6B6890]" aria-hidden="true" />
            <dd>{repository.forksCount}</dd>
          </div>

          <div className="flex items-center gap-1.5">
            <dt>Last push</dt>
            <dd className="text-[#F5F5F5]">{formatRelativeTime(repository.lastPushedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#1C1A38] px-5 py-3 text-xs text-[#6B6890]">
        Connected by{' '}
        <span className="font-mono text-[#8B88AE]">@{repository.connectedBy}</span>
        {repository.connectedAt && <> on {formatDate(repository.connectedAt)}</>}
      </div>
    </section>
  );
}