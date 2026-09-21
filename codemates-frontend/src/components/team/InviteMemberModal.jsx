/**
 * InviteMemberModal
 *
 * Invite a developer to the project by username or email, pick their role,
 * and optionally add a note. Mock-only for now: it just hands the result to
 * `onInvite` — wire that to teamApi when the backend is ready.
 *
 * Behaviour: Escape / backdrop click / close button dismiss it, focus is
 * trapped while open, body scroll is locked, and form state resets on every
 * open (the body is only mounted while `open` is true).
 *
 * Props:
 *   open               {boolean}
 *   onClose            {fn}
 *   onInvite           {fn}     ({ identifier, role, message })
 *                               identifier is normalised: no leading "@", lowercase
 *   takenIdentifiers   {Array}  Usernames/emails already on the team or invited
 *   suggestions        {Array}  Optional [{ username, name }] quick-pick developers
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import { ROLES, ROLE_META } from './TeamMemberCard';

const HANDLE_RE = /^@?[a-z0-9][a-z0-9_-]{1,29}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 240;

const normalize = (value) => value.trim().replace(/^@/, '').toLowerCase();

function validate(raw, taken) {
  const value = raw.trim();
  if (!value) return 'Enter a username or email address.';
  if (!EMAIL_RE.test(value) && !HANDLE_RE.test(value)) {
    return 'Use a valid username (like @jane_dev) or an email address.';
  }
  if (taken.has(normalize(value))) {
    return 'This developer is already on the team or has a pending invite.';
  }
  return '';
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]';

function ModalBody({ onClose, onInvite, takenIdentifiers, suggestions }) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const taken = useMemo(
    () => new Set(takenIdentifiers.map(normalize)),
    [takenIdentifiers]
  );

  const availableSuggestions = suggestions.filter(
    (s) => !taken.has(normalize(s.username))
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
    const problem = validate(identifier, taken);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    onInvite({
      identifier: normalize(identifier),
      role,
      message: message.trim(),
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-5 py-5">
            {/* ── Username / email ────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="invite-identifier"
                className="mb-1.5 block text-sm font-medium text-[#F5F5F5]"
              >
                Username or email
              </label>
              <input
                ref={inputRef}
                id="invite-identifier"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError('');
                }}
                placeholder="@username or name@example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'invite-identifier-error' : undefined}
                className={`w-full rounded-lg border bg-[#1D1A40]/50 px-3 py-2.5 text-base text-[#F5F5F5]
                            placeholder:text-[#6B6890] sm:text-sm
                            focus:outline-none focus:ring-2 ${
                              error
                                ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
                                : 'border-[#2E2A66] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30'
                            }`}
              />
              {error && (
                <p id="invite-identifier-error" role="alert" className="mt-1.5 text-xs text-red-300">
                  {error}
                </p>
              )}

              {availableSuggestions.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-[#6B6890]">Suggested developers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSuggestions.map((s) => (
                      <button
                        key={s.username}
                        type="button"
                        onClick={() => {
                          setIdentifier(`@${s.username}`);
                          setError('');
                          inputRef.current?.focus();
                        }}
                        title={s.name}
                        className="rounded-md bg-[#1D1A40] px-2 py-1 font-mono text-[11px] text-[#C9A8FF]
                                   transition-colors hover:bg-[#2E2A66]
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                      >
                        @{s.username}
                      </button>
                    ))}
                  </div>
                </div>
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

            {/* ── Note ────────────────────────────────────────────────────── */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="invite-message" className="text-sm font-medium text-[#F5F5F5]">
                  Note <span className="font-normal text-[#6B6890]">(optional)</span>
                </label>
                <span className="font-mono text-[10px] text-[#6B6890]">
                  {message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                id="invite-message"
                rows={3}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell them what you're building and why they'd be a good fit."
                className="w-full resize-none rounded-lg border border-[#2E2A66] bg-[#1D1A40]/50 px-3 py-2.5
                           text-base text-[#F5F5F5] placeholder:text-[#6B6890] sm:text-sm
                           focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
              />
            </div>
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
  takenIdentifiers = [],
  suggestions = [],
}) {
  if (!open) return null;

  return (
    <ModalBody
      onClose={onClose}
      onInvite={onInvite}
      takenIdentifiers={takenIdentifiers}
      suggestions={suggestions}
    />
  );
}