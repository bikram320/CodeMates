/**
 * DirectMessageHeader
 *
 * Top of an open conversation: back button (small screens), the developer's
 * avatar, name, @username and online / last-seen status, and a mute toggle.
 *
 * Props:
 *   participant  {object}  { name, username, avatarUrl, presence, lastSeenAt }
 *   isMuted      {boolean}
 *   onToggleMute {fn}
 *   onBack       {fn}      Shown below the lg breakpoint only
 */

import { Bell, BellOff } from 'lucide-react';
import BackButton from '../ui/BackButton';

import { DeveloperAvatar, formatLastSeen } from './messagesShared';

export default function DirectMessageHeader({ participant, isMuted, onToggleMute, onBack }) {
  const online = participant.presence === 'ONLINE';
  const MuteIcon = isMuted ? BellOff : Bell;

  return (
    <div className="flex items-center gap-4 border-b border-[#1C1A38] px-5 py-4">
      <BackButton
        label=""
        onClick={onBack}
        className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8B88AE]
                   hover:bg-[#1D1A40] hover:text-[#F5F5F5] lg:hidden
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      />

      <DeveloperAvatar
        name={participant.name}
        username={participant.username}
        avatarUrl={participant.avatarUrl}
        presence={participant.presence}
        size="lg"
      />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold text-[#F5F5F5]">{participant.name}</h2>
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate font-mono text-[#8B88AE]">@{participant.username}</span>
          <span aria-hidden="true" className="text-[#4A4660]">·</span>
          <span className={`shrink-0 ${online ? 'text-emerald-300' : 'text-[#8B88AE]'}`}>
            {online ? 'Online' : formatLastSeen(participant.lastSeenAt)}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={isMuted}
        aria-label={isMuted ? `Unmute ${participant.name}` : `Mute ${participant.name}`}
        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors
                    hover:bg-[#1D1A40] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 ${
                      isMuted ? 'text-[#C9A8FF]' : 'text-[#8B88AE] hover:text-[#F5F5F5]'
                    }`}
      >
        <MuteIcon size={16} />
      </button>
    </div>
  );
}