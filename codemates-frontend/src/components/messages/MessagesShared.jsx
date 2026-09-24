/**
 * Small helpers shared by the Direct Messages components.
 *
 *   <DeveloperAvatar />        initials / photo avatar with an online dot
 *   formatMessageTime(iso)     "2:32 PM"
 *   formatDayLabel(iso)        "Today", "Yesterday", "Mon, Sep 14"
 *   formatListTime(iso)        "2:32 PM", "Yesterday", "Mon", "Sep 3"
 *   formatLastSeen(iso)        "Last seen 2h ago"
 *   isSameDay(a, b)
 */

import { useState } from 'react';

import { formatRelativeTime } from '../github/githubSharedHelpers';

/* ── Time formatting ─────────────────────────────────────────────────────── */

const dayStart = (value) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const DAY_MS = 86_400_000;

export const isSameDay = (a, b) => dayStart(a) === dayStart(b);

const validDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function formatMessageTime(iso) {
  const d = validDate(iso);
  return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
}

export function formatDayLabel(iso) {
  const d = validDate(iso);
  if (!d) return '';

  const daysAgo = Math.round((dayStart(Date.now()) - dayStart(d)) / DAY_MS);
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';

  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    weekday: daysAgo < 7 ? 'long' : undefined,
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

export function formatListTime(iso) {
  const d = validDate(iso);
  if (!d) return '';

  const daysAgo = Math.round((dayStart(Date.now()) - dayStart(d)) / DAY_MS);
  if (daysAgo === 0) return formatMessageTime(iso);
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLastSeen(iso) {
  return iso ? `Last seen ${formatRelativeTime(iso)}` : 'Offline';
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

const GRADIENTS = [
  'from-[#6C7BFF] to-[#C9A8FF]',
  'from-[#C9A8FF] to-[#6C7BFF]',
  'from-[#5A67E0] to-[#B79CFF]',
  'from-[#8E9BFF] to-[#C9A8FF]',
];

const SIZES = {
  sm: { box: 'h-10 w-10 text-xs', dot: 'h-3 w-3' },
  md: { box: 'h-12 w-12 text-sm', dot: 'h-3.5 w-3.5' },
  lg: { box: 'h-14 w-14 text-base', dot: 'h-3.5 w-3.5' },
};

function hashString(str = '') {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/**
 * Props: name, username, avatarUrl?, presence ('ONLINE' | 'OFFLINE' — omit to hide the dot),
 *        size ('sm' | 'md' | 'lg')
 * The dot is decorative; callers show the status as text as well.
 */
export function DeveloperAvatar({ name, username, avatarUrl, presence, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const { box, dot } = SIZES[size] ?? SIZES.md;
  const gradient = GRADIENTS[hashString(username || name) % GRADIENTS.length];

  return (
    <div className="relative shrink-0">
      {avatarUrl && !failed ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailed(true)}
          className={`${box} rounded-full object-cover`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${box} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-[#0A0918]`}
        >
          {getInitials(name)}
        </div>
      )}

      {presence && (
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 -right-0.5 ${dot} rounded-full border-2 border-[#0A0918] ${
            presence === 'ONLINE' ? 'bg-emerald-400' : 'bg-[#6B6890]'
          }`}
        />
      )}
    </div>
  );
}