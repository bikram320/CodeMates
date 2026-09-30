/**
 * InviteMemberModal
 *
 * Invite someone to the project and pick their role. Two ways to choose who:
 *   1. "From connections" (default) — pick from the viewer's connections by
 *      name/username. No IDs to copy.
 *   2. "By user ID" — paste a UUID, for people who aren't connections yet.
 *
 * The invite endpoint still takes { invitedUserId, role }, so both paths
 * resolve to a userId before calling onInvite.
 *
 * Behaviour: Escape / backdrop click / close button dismiss it, focus is
 * trapped while open, body scroll is locked, and form state resets on every
 * open (the body is only mounted while `open` is true — which also means the
 * connections are only fetched when the modal opens).
 *
 * Props:
 *   open            {boolean}
 *   onClose         {fn}
 *   onInvite        {fn}     ({ invitedUserId, role })
 *   takenUserIds    {Array}  userIds already on the team
 *   currentUserId   {string} the viewer — used to pick "the other person" out
 *                            of a connection record
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Send, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { ROLES, ROLE_META } from './TeamMemberCard';
import { getDisplayName, getUsername } from './memberDisplay';
import { useConnections } from '../../hooks/useConnections';
import useUserDirectory from '../../hooks/useUserDirectory';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalize = (value) => value.trim().toLowerCase();

function validateUserId(raw, taken) {
  const value = raw.trim();
  if (!value) return "Enter the developer's user ID.";
  if (!UUID_RE.test(value)) return 'Enter a valid user ID (UUID format).';
  if (taken.has(normalize(value))) return 'This user is already on the team.';
  return '';
}

/**
 * Pull "the other person's" userId out of a connection record.
 * ADJUST to your real connection shape if none of these match.
 */
function getConnectionUserId(conn, currentUserId) {
  const direct =
      conn.userId ?? conn.connectedUserId ?? conn.otherUserId ?? conn.friendId ?? conn.user?.id;
  if (direct) return direct;

  const a = conn.requesterId ?? conn.senderId ?? conn.fromUserId;
  const b = conn.receiverId ?? conn.recipientId ?? conn.toUserId ?? conn.addresseeId;
  if (a && b) return a === currentUserId ? b : a;
  return a ?? b ?? null;
}

const FOCUSABLE =
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]';

function ModalBody({ onClose, onInvite, takenUserIds, currentUserId }) {
  const [tab, setTab] = useState('connections'); // 'connections' | 'userId'
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const taken = useMemo(() => new Set(takenUserIds.map(normalize)), [takenUserIds]);

  /* ── Connections → resolved profiles ─────────────────────────────────── */
  const { connections, isLoading: connectionsLoading, isError: connectionsError } =
      useConnections();

  const connectionIds = useMemo(
      () =>
          [
            ...new Set(
                connections.map((c) => getConnectionUserId(c, currentUserId)).filter(Boolean)
            ),
          ],
      [connections, currentUserId]
  );

  const { directory } = useUserDirectory(connectionIds);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return connectionIds
        .map((id) => {
          const profile = directory[id];
          return {
            id,
            name: getDisplayName(profile, id),
            username: getUsername(profile),
            onTeam: taken.has(normalize(id)),
          };
        })
        .filter((p) => !q || p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q))
        .sort((a, b) => Number(a.onTeam) - Number(b.onTeam) || a.name.localeCompare(b.name));
  }, [connectionIds, directory, query, taken]);

  /* ── Focus, scroll lock, Escape, minimal focus trap ──────────────────── */
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('input')?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const switchTab = (next) => {
    setTab(next);
    setError('');
    setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let invitedUserId;
    if (tab === 'connections') {
      if (!selectedId) {
        setError('Choose a connection to invite.');
        return;
      }
      invitedUserId = selectedId;
    } else {
      const problem = validateUserId(userId, taken);
      if (problem) {
        setError(problem);
        return;
      }
      invitedUserId = userId.trim();
    }

    onInvite({ invitedUserId, role });
    onClose();
  };

  const tabClass = (active) =>
      `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none
     focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 ${
          active ? 'bg-[#6C7BFF]/15 text-[#8E9BFF]' : 'text-[#8B88AE] hover:text-[#F5F5F5]'
      }`;

  return (
      <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
      >
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-member-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1C1A38]
                   bg-[#0A0918] shadow-2xl shadow-black/60"
        >
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 border-b border-[#1C1A38] px-5 py-4">
            <div>
              <h2 id="invite-member-title" className="text-base font-semibold text-[#F5F5F5]">
                Invite a member
              </h2>
              <p className="mt-0.5 text-xs text-[#8B88AE]">
                They&apos;ll get an invitation to join this project.
              </p>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B6890]
                       transition-colors hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5 px-5 py-5">
              {/* ── Who ─────────────────────────────────────────────────── */}
              <div>
                <div
                    role="tablist"
                    aria-label="How to choose who to invite"
                    className="mb-3 flex gap-1 rounded-lg border border-[#1C1A38] bg-[#1D1A40]/40 p-1"
                >
                  <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'connections'}
                      onClick={() => switchTab('connections')}
                      className={tabClass(tab === 'connections')}
                  >
                    From connections
                  </button>
                  <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'userId'}
                      onClick={() => switchTab('userId')}
                      className={tabClass(tab === 'userId')}
                  >
                    By user ID
                  </button>
                </div>

                {tab === 'connections' ? (
                    <div>
                      <div className="relative">
                        <Search
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7BFF]"
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search your connections…"
                            aria-label="Search your connections"
                            autoComplete="off"
                            className="w-full rounded-lg border border-[#2E2A66] bg-[#1D1A40]/50 py-2 pl-9 pr-3
                                 text-sm text-[#F5F5F5] placeholder:text-[#6B6890]
                                 focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
                        />
                      </div>

                      <div
                          role="radiogroup"
                          aria-label="Your connections"
                          className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-0.5"
                      >
                        {connectionsLoading ? (
                            <p className="py-6 text-center text-sm text-[#8B88AE]">Loading connections…</p>
                        ) : connectionsError ? (
                            <p role="alert" className="py-6 text-center text-sm text-red-300">
                              Couldn&apos;t load your connections. Use &ldquo;By user ID&rdquo; instead.
                            </p>
                        ) : connectionIds.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[#8B88AE]">
                              You have no connections yet. Connect with developers from Discover, or use
                              &ldquo;By user ID&rdquo;.
                            </p>
                        ) : people.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[#8B88AE]">
                              No connections match &ldquo;{query.trim()}&rdquo;.
                            </p>
                        ) : (
                            people.map((p) => {
                              const selected = selectedId === p.id;
                              return (
                                  <button
                                      key={p.id}
                                      type="button"
                                      role="radio"
                                      aria-checked={selected}
                                      disabled={p.onTeam}
                                      onClick={() => {
                                        setSelectedId(p.id);
                                        setError('');
                                      }}
                                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left
                                        transition-colors focus:outline-none focus-visible:ring-2
                                        focus-visible:ring-[#6C7BFF]/60 disabled:cursor-not-allowed disabled:opacity-50 ${
                                          selected
                                              ? 'border-[#6C7BFF] bg-[#6C7BFF]/10'
                                              : 'border-[#1C1A38] bg-[#1D1A40]/40 hover:border-[#2E2A66]'
                                      }`}
                                  >
                                    <Avatar name={p.name} size={36} />
                                    <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-[#F5F5F5]">
                                {p.name}
                              </span>
                                      {p.username && (
                                          <span className="block truncate text-xs text-[#8B88AE]">
                                  {p.username}
                                </span>
                                      )}
                            </span>
                                    {p.onTeam ? (
                                        <span className="shrink-0 text-xs text-[#8B88AE]">On the team</span>
                                    ) : (
                                        selected && <Check size={16} className="shrink-0 text-[#6C7BFF]" />
                                    )}
                                  </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                ) : (
                    <div>
                      <label
                          htmlFor="invite-user-id"
                          className="mb-1.5 block text-sm font-medium text-[#F5F5F5]"
                      >
                        User ID
                      </label>
                      <input
                          id="invite-user-id"
                          type="text"
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={userId}
                          onChange={(e) => {
                            setUserId(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                          aria-invalid={Boolean(error)}
                          className={`w-full rounded-lg border bg-[#1D1A40]/50 px-3 py-2.5 font-mono text-sm text-[#F5F5F5]
                                placeholder:text-[#6B6890] focus:outline-none focus:ring-2 ${
                              error
                                  ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
                                  : 'border-[#2E2A66] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30'
                          }`}
                      />
                      <p className="mt-1.5 text-xs text-[#6B6890]">
                        For people you&apos;re not connected to. Paste their full user ID.
                      </p>
                    </div>
                )}

                {error && (
                    <p role="alert" className="mt-1.5 text-xs text-red-300">
                      {error}
                    </p>
                )}
              </div>

              {/* ── Role ────────────────────────────────────────────────────── */}
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-[#F5F5F5]">Role</legend>
                <div className="space-y-2">
                  {ROLES.map((value) => {
                    const meta = ROLE_META[value];
                    const Icon = meta.icon;
                    const selected = role === value;

                    return (
                        <label
                            key={value}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                                  focus-within:ring-2 focus-within:ring-[#6C7BFF]/60 ${
                                selected
                                    ? 'border-[#6C7BFF] bg-[#6C7BFF]/10'
                                    : 'border-[#1C1A38] bg-[#1D1A40]/40 hover:border-[#2E2A66]'
                            }`}
                        >
                          <input
                              type="radio"
                              name="invite-role"
                              value={value}
                              checked={selected}
                              onChange={() => setRole(value)}
                              className="sr-only"
                          />
                          <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconBox}`}
                          >
                        <Icon size={15} />
                      </span>
                          <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-[#F5F5F5]">{meta.label}</span>
                        <span className="block text-xs leading-relaxed text-[#8B88AE]">
                          {meta.description}
                        </span>
                      </span>
                          {selected && <Check size={16} className="shrink-0 text-[#6C7BFF]" />}
                        </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#1C1A38] px-5 py-4 sm:flex-row sm:justify-end">
              <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium text-[#F5F5F5]
                         transition-colors hover:bg-[#1D1A40]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              >
                Cancel
              </button>
              <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2
                         text-sm font-semibold text-[#0A0918] transition-colors hover:bg-[#8190FF]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]"
              >
                <Send size={14} />
                Send invite
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default function InviteMemberModal({
                                            open,
                                            onClose,
                                            onInvite,
                                            takenUserIds = [],
                                            currentUserId,
                                          }) {
  if (!open) return null;

  return (
      <ModalBody
          onClose={onClose}
          onInvite={onInvite}
          takenUserIds={takenUserIds}
          currentUserId={currentUserId}
      />
  );
}