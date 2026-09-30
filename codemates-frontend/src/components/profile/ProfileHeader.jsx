import { Calendar, Users } from 'lucide-react';
import { cardClass } from '../shared/formControls';

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
<<<<<<< Updated upstream
    <div className="flex flex-col gap-4 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5 sm:flex-row sm:items-center">
=======
    <div className={`${cardClass} flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-10`}>
>>>>>>> Stashed changes
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
<<<<<<< Updated upstream
          className="h-16 w-16 shrink-0 rounded-full object-cover"
=======
          className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-[#6C7BFF]/30"
>>>>>>> Stashed changes
        />
      ) : (
        <div
          aria-hidden="true"
<<<<<<< Updated upstream
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
                     from-[#6C7BFF] to-[#C9A8FF] text-xl font-bold text-[#0A0918]"
=======
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
                     from-[#6C7BFF] to-[#C9A8FF] text-2xl font-bold text-white"
>>>>>>> Stashed changes
        >
          {getInitials(profile.fullName) || '?'}
        </div>
      )}

      <div className="min-w-0 flex-1">
<<<<<<< Updated upstream
        <h1 className="truncate text-xl font-bold text-[#F5F5F5]">{profile.fullName}</h1>
        <p className="truncate font-mono text-sm text-[#8B88AE]">@{profile.username}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#8B88AE]">
=======
        <h1 className="truncate text-base font-semibold text-[#16171D]" style={{ color: '#16171D' }}>
          {profile.fullName}
        </h1>
        <p className="truncate font-mono text-sm text-[#6B7280]">@{profile.username}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6B7280]">
>>>>>>> Stashed changes
          {status && (
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}

          {profile.isOpenToCollaborate && (
<<<<<<< Updated upstream
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#6C7BFF]/30 bg-[#6C7BFF]/10 px-2 py-0.5 text-[#8E9BFF]">
=======
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#6C7BFF]/10 px-2 py-0.5 text-[#4F5DE8]">
>>>>>>> Stashed changes
              <Users size={11} />
              Open to collaborate
            </span>
          )}

          {memberSince && (
            <span className="inline-flex items-center gap-1.5">
<<<<<<< Updated upstream
              <Calendar size={12} className="text-[#6B6890]" />
=======
              <Calendar size={12} className="text-[#9CA3AF]" />
>>>>>>> Stashed changes
              Member since {memberSince}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}