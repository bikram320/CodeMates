/**
 * RepositoryCard
 *
 * One synced repository: name, visibility, fork flag, language, stars,
 * forks, last push, a link to open it on GitHub, and an expandable commit
 * stats panel (fetched lazily — see RepositoryCommitStats).
 *
 * Props:
 *   repository {object}  RepositoryResponseDto
 *     { id, repoName, repoFullName, repoUrl, primaryLanguage, starsCount,
 *       forksCount, isPrivate, isForked, lastPushedAt }
 */

import { useState } from 'react';
import { ChevronDown, ExternalLink, GitFork, Globe, Lock, Star } from 'lucide-react';

import RepositoryCommitStats from './RepositoryCommitStats';
import { formatRelativeTime } from './githubSharedHelpers';

function Chip({ icon: Icon, children, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
        tone === 'lavender'
          ? 'border-[#C9A8FF]/30 bg-[#C9A8FF]/10 text-[#C9A8FF]'
          : 'border-[#2E2A66] bg-[#1D1A40] text-[#8B88AE]'
      }`}
    >
      <Icon size={11} />
      {children}
    </span>
  );
}

export default function RepositoryCard({ repository }) {
  const [expanded, setExpanded] = useState(false);
  const VisibilityIcon = repository.isPrivate ? Lock : Globe;
  const [owner, name] = (repository.repoFullName || repository.repoName || '').split('/').length > 1
    ? repository.repoFullName.split('/')
    : [null, repository.repoName];

  return (
    <div className="rounded-xl border border-[#1C1A38] bg-[#0A0918] transition-colors duration-150 hover:border-[#2E2A66]">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-sm font-semibold text-[#F5F5F5]">
              {owner && <span className="font-normal text-[#8B88AE]">{owner}/</span>}
              {name}
            </h3>
            <Chip icon={VisibilityIcon}>{repository.isPrivate ? 'Private' : 'Public'}</Chip>
            {repository.isForked && <Chip icon={GitFork} tone="lavender">Fork</Chip>}
          </div>

          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8B88AE]">
            {repository.primaryLanguage && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Language</dt>
                <span className="h-2 w-2 rounded-full bg-[#C9A8FF]" aria-hidden="true" />
                <dd>{repository.primaryLanguage}</dd>
              </div>
            )}
            <div className="flex items-center gap-1">
              <dt className="sr-only">Stars</dt>
              <Star size={12} className="text-[#6B6890]" aria-hidden="true" />
              <dd>{repository.starsCount ?? 0}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">Forks</dt>
              <GitFork size={12} className="text-[#6B6890]" aria-hidden="true" />
              <dd>{repository.forksCount ?? 0}</dd>
            </div>
            {repository.lastPushedAt && (
              <div>
                <dt className="sr-only">Last push</dt>
                <dd>Pushed {formatRelativeTime(repository.lastPushedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={repository.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name} on GitHub`}
            title="Open on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B88AE] transition-colors
                       hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide commit stats' : 'Show commit stats'}
            title={expanded ? 'Hide commit stats' : 'Show commit stats'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B88AE] transition-colors
                       hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <ChevronDown size={16} className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && <RepositoryCommitStats repositoryId={repository.id} enabled={expanded} />}
    </div>
  );
}