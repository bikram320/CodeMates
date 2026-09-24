/**
 * RepositoryList
 *
 * Search + language filter over the connected account's synced repositories,
 * sorted by most recently pushed. Owns its own loading / error / empty states.
 *
 * Props:
 *   repositories {Array}     RepositoryResponseDto[] | undefined (undefined = loading)
 *   isLoading    {boolean}
 *   error        {Error|null}
 *   onRetry      {fn}
 */

import { useMemo, useState } from 'react';
import { AlertCircle, FolderGit2, RefreshCw, Search, SearchX, X } from 'lucide-react';

import EmptyState from '../ui/EmptyState';
import RepositoryCard from './RepositoryCard';

function RepositoryListSkeleton() {
  return (
    <div role="status" aria-label="Loading repositories" className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="h-[92px] animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]"
        />
      ))}
    </div>
  );
}

const byRecentPush = (a, b) => {
  if (!a.lastPushedAt && !b.lastPushedAt) return 0;
  if (!a.lastPushedAt) return 1;
  if (!b.lastPushedAt) return -1;
  return new Date(b.lastPushedAt) - new Date(a.lastPushedAt);
};

export default function RepositoryList({ repositories, isLoading, error, onRetry }) {
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('ALL');

  const languages = useMemo(() => {
    const set = new Set((repositories ?? []).map((r) => r.primaryLanguage).filter(Boolean));
    return Array.from(set).sort();
  }, [repositories]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (repositories ?? [])
      .filter((r) => language === 'ALL' || r.primaryLanguage === language)
      .filter(
        (r) =>
          !query ||
          r.repoName?.toLowerCase().includes(query) ||
          r.repoFullName?.toLowerCase().includes(query)
      )
      .sort(byRecentPush);
  }, [repositories, search, language]);

  if (isLoading) return <RepositoryListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center">
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load repositories"
          description={error.message || 'Something went wrong. Try again.'}
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

  if ((repositories ?? []).length === 0) {
    return (
      <EmptyState
        icon={FolderGit2}
        title="No repositories synced yet"
        description="Run a sync to pull in your repositories from GitHub."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]" />
          <input
            type="text"
            inputMode="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories"
            aria-label="Search repositories"
            className="w-full rounded-lg border border-[#1C1A38] bg-[#0A0918] py-2 pl-9 pr-9 text-sm text-[#F5F5F5]
                       placeholder:text-[#6B6890] transition-colors hover:border-[#2E2A66]
                       focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded
                         text-[#6B6890] transition-colors hover:text-[#F5F5F5]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {languages.length > 0 && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Filter by language"
            className="rounded-lg border border-[#1C1A38] bg-[#0A0918] px-3 py-2 text-sm text-[#F5F5F5]
                       transition-colors hover:border-[#2E2A66] [color-scheme:dark]
                       focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
          >
            <option value="ALL">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="mb-3 font-mono text-xs text-[#6B6890]">
        {filtered.length} of {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No repositories match"
          description="Try a different name or language."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}
    </div>
  );
}