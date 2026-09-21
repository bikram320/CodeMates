/**
 * SettingsHeader
 *
 * Page title, a summary of who's signed in, and a row of shortcuts that scroll
 * to each settings section.
 *
 * Props:
 *   user      {object}  Optional. { name, username, avatarUrl? } — omitted while the
 *                       settings are loading / unavailable
 *   sections  {Array}   [{ id, label, tone? }]  ids must match the section ids.
 *                       Empty → the shortcut row is hidden
 */

import { useState } from 'react';

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function UserAvatar({ user }) {
  const [failed, setFailed] = useState(false);

  return user.avatarUrl && !failed ? (
    <img
      src={user.avatarUrl}
      alt=""
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-full object-cover"
    />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br
                 from-[#6C7BFF] to-[#C9A8FF] text-sm font-bold text-[#0A0918]"
    >
      {getInitials(user.name)}
    </div>
  );
}

export default function SettingsHeader({ user, sections = [] }) {
  const goTo = (event, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <header>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Settings</h1>
          <p className="mt-1 text-sm text-[#8B88AE]">
            Manage your profile, account security and how CodeMates works for you.
          </p>
        </div>

        {user && (
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#1C1A38] bg-[#0A0918] px-3 py-2">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F5F5F5]">{user.name}</p>
              <p className="truncate font-mono text-xs text-[#8B88AE]">@{user.username}</p>
            </div>
          </div>
        )}
      </div>

      {sections.length > 0 && (
        <nav aria-label="Settings sections" className="mt-5">
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {sections.map(({ id, label, tone }) => (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  onClick={(e) => goTo(e, id)}
                  className={`inline-flex rounded-lg border border-[#1C1A38] bg-[#0A0918] px-3 py-2 text-sm font-medium
                              text-[#8B88AE] transition-colors duration-150
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 ${
                                tone === 'danger'
                                  ? 'hover:border-red-400/40 hover:text-red-300'
                                  : 'hover:border-[#2E2A66] hover:text-[#F5F5F5]'
                              }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}