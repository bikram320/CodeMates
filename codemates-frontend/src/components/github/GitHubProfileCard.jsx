/**
 * GithubProfileCard
 *
 * The signed-in user's connected GitHub profile: avatar, username, bio, and
 * public-repo / follower / following counts, plus a "Sync now" button.
 *
 * Props:
 *   profile    {object}  GithubProfileResponseDto
 *                        { githubUsername, avatarUrl, bio, publicReposCount,
 *                          followersCount, followingCount, lastSyncedAt }
 *   onSync     {fn}
 *   isSyncing  {boolean}
 */

import { RefreshCw } from 'lucide-react';

import { formatRelativeTime } from './githubSharedHelpers';

const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');

export default function GithubProfileCard({ profile, onSync, isSyncing }) {
  return (
    <section
      aria-label="Connected GitHub profile"
      className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
                         from-[#6C7BFF] to-[#C9A8FF] text-lg font-bold text-[#0A0918]"
            >
              {profile.githubUsername?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-lg font-semibold text-[#F5F5F5]">
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                >
                  @{profile.githubUsername}
                </a>
              </h2>
            </div>

            {profile.bio && (
              <p className="mt-1 text-sm leading-relaxed text-[#A9A6C8]">{profile.bio}</p>
            )}

            <p className="mt-2 text-xs text-[#6B6890]">
              Last synced {formatRelativeTime(profile.lastSyncedAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          aria-busy={isSyncing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2
                     text-sm font-medium text-[#F5F5F5] transition-colors hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                     disabled:cursor-not-allowed disabled:opacity-60
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#1C1A38] pt-4 text-center">
        <div>
          <dt className="text-xs text-[#8B88AE]">Public repos</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold text-[#F5F5F5]">
            {fmt(profile.publicReposCount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#8B88AE]">Followers</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold text-[#F5F5F5]">
            {fmt(profile.followersCount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#8B88AE]">Following</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold text-[#F5F5F5]">
            {fmt(profile.followingCount)}
          </dd>
        </div>
      </dl>
    </section>
  );
}