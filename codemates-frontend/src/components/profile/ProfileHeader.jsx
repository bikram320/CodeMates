/**
 * ProfileHeader
 *
 * Read-only summary at the top of the Profile page: avatar, name, username,
 * activity status, "open to collaborate" badge, and member-since date.
 *
 * Props:
 *   profile {object}  ProfileResponse
 */

import { Calendar, Users } from 'lucide-react';

const STATUS_META = {
  ACTIVE: { label: 'Active', dot: 'bg-emerald-400' },
  BUSY: { label: 'Busy', dot: 'bg-amber-400' },
  AWAY: { label: 'Away', dot: 'bg-amber-400' },
  OFFLINE: { label: 'Offline', dot: 'bg-[#6B6890]' },
};

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function formatMemberSince(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileHeader({ profile }) {
  const status = STATUS_META[profile.activityStatus] ?? null;
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5 sm:flex-row sm:items-center">
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
                     from-[#6C7BFF] to-[#C9A8FF] text-xl font-bold text-[#0A0918]"
        >
          {getInitials(profile.fullName) || '?'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-[#F5F5F5]">{profile.fullName}</h1>
        <p className="truncate font-mono text-sm text-[#8B88AE]">@{profile.username}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#8B88AE]">
          {status && (
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}

          {profile.isOpenToCollaborate && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#6C7BFF]/30 bg-[#6C7BFF]/10 px-2 py-0.5 text-[#8E9BFF]">
              <Users size={11} />
              Open to collaborate
            </span>
          )}

          {memberSince && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} className="text-[#6B6890]" />
              Member since {memberSince}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}