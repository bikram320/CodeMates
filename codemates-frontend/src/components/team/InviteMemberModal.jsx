/**
 * InviteMemberModal
 *
 * Invite a developer to the project by their user ID, and pick their role.
 *
 * The real backend's invite endpoint (POST /api/projects/{projectId}/invitations)
 * takes { invitedUserId, role } where invitedUserId is a UUID — there's no
 * username/email lookup endpoint and no "message" field on the request, so
 * this modal no longer collects a username/email/note or shows suggested
 * developers (those were fabricated usernames that don't correspond to real
 * user IDs). If a username/email → userId lookup gets added to the backend
 * later, this is the file to bring that back into.
 *
 * Behaviour: Escape / backdrop click / close button dismiss it, focus is
 * trapped while open, body scroll is locked, and form state resets on every
 * open (the body is only mounted while `open` is true).
 *
 * Props:
 *   open          {boolean}
 *   onClose       {fn}
 *   onInvite      {fn}     ({ invitedUserId, role })
 *   takenUserIds  {Array}  userIds already on the team
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import { ROLES, ROLE_META } from './TeamMemberCard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalize = (value) => value.trim().toLowerCase();

function validate(raw, taken) {
  const value = raw.trim();
  if (!value) return "Enter the developer's user ID.";
  if (!UUID_RE.test(value)) {
    return 'Enter a valid user ID (UUID format).';
  }
  if (taken.has(normalize(value))) {
    return 'This user is already on the team.';
  }
  return '';
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]';

function ModalBody({ onClose, onInvite, takenUserIds }) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const taken = useMemo(
    () => new Set(takenUserIds.map(normalize)),
    [takenUserIds]
  );

  /* Focus, scroll lock, Escape, and a minimal focus trap */
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = validate(userId, taken);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    onInvite({
      invitedUserId: userId.trim(),
      role,
    });
    onClose();
  };

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

<<<<<<< Updated upstream
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-5 py-5">
            {/* ── User ID ───────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="invite-user-id"
                className="mb-1.5 block text-sm font-medium text-[#F5F5F5]"
              >
                User ID
              </label>
              <input
                ref={inputRef}
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
                aria-describedby={error ? 'invite-user-id-error' : 'invite-user-id-hint'}
                className={`w-full rounded-lg border bg-[#1D1A40]/50 px-3 py-2.5 font-mono text-sm text-[#F5F5F5]
                            placeholder:text-[#6B6890]
                            focus:outline-none focus:ring-2 ${
=======
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5 px-5 py-5">
              {/* ── Who ───────────────────────────────────────────────────── */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-[#F5F5F5]">
                  {mode === 'connections' ? 'From your connections' : 'User ID'}
                </span>
                  <button
                      type="button"
                      onClick={() => switchMode(mode === 'connections' ? 'manual' : 'connections')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8E9BFF]
                             transition-colors hover:text-[#C9A8FF] focus:outline-none
                             focus-visible:underline"
                  >
                    {mode === 'connections' ? (
                        <>
                          <Link2 size={12} />
                          Invite by user ID instead
                        </>
                    ) : (
                        <>
                          <Users size={12} />
                          Search connections instead
                        </>
                    )}
                  </button>
                </div>

                {mode === 'connections' ? (
                    <ConnectionPicker
                        selectedUserId={selectedUserId}
                        onSelect={(id) => {
                          setSelectedUserId(id);
                          if (error) setError('');
                        }}
                        takenUserIds={takenUserIds}
                    />
                ) : (
                    <>
                      <input
                          ref={manualInputRef}
                          id="invite-user-id"
                          type="text"
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={manualId}
                          onChange={(e) => {
                            setManualId(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder="Enter user ID"
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? 'invite-user-id-error' : 'invite-user-id-hint'}
                          className={`w-full rounded-lg border bg-[#1D1A40]/50 px-3 py-2.5 font-mono text-sm text-[#F5F5F5]
                                placeholder:text-[#6B6890]
                                focus:outline-none focus:ring-2 ${
>>>>>>> Stashed changes
                              error
                                ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
                                : 'border-[#2E2A66] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30'
                            }`}
              />
              {error ? (
                <p id="invite-user-id-error" role="alert" className="mt-1.5 text-xs text-red-300">
                  {error}
                </p>
              ) : (
                <p id="invite-user-id-hint" className="mt-1.5 text-xs text-[#6B6890]">
                  There's no username or email lookup yet — paste the developer's
                  user ID directly.
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
                        <span className="block text-sm font-medium text-[#F5F5F5]">
                          {meta.label}
                        </span>
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
}) {
  if (!open) return null;

  return (
    <ModalBody onClose={onClose} onInvite={onInvite} takenUserIds={takenUserIds} />
  );
}