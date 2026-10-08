/**
 * JoinRequestsModal
 *
 * Leader-only list of pending requests to join the project, with
 * Approve / Decline per request. Names come from useUserDirectory, so
 * it's only mounted (and only fetches profiles) while open.
 *
 * Props:
 *   open, onClose
 *   requests   {Array}   [{ id, userId (applicant), createdAt }]
 *   isLoading, isError
 *   busyId     {string|null}  request being processed
 *   onApprove  {fn}  (request)
 *   onReject   {fn}  (request)
 */

import { useEffect } from 'react';
import { Check, Inbox, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import useUserDirectory from '../../hooks/useUserDirectory';
import { getDisplayName, getUsername } from './memberDisplay';

function timeAgo(dateStr) {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Body({ onClose, requests, isLoading, isError, busyId, onApprove, onReject }) {
  const { directory } = useUserDirectory(requests.map((r) => r.userId));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-requests-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl border border-[#1C1A38]
                   bg-[#0A0918] shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#1C1A38] px-5 py-4">
          <div>
            <h2 id="join-requests-title" className="text-base font-semibold text-[#F5F5F5]">
              Join requests
            </h2>
            <p className="mt-0.5 text-xs text-[#8B88AE]">
              People asking to join this project.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B6890]
                       hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-[#8B88AE]">Loading requests…</p>
          ) : isError ? (
            <p role="alert" className="py-8 text-center text-sm text-red-300">
              Couldn&apos;t load join requests. Close this and try again.
            </p>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox size={22} className="text-[#6B6890]" />
              <p className="text-sm font-medium text-[#F5F5F5]">No pending requests</p>
              <p className="text-xs text-[#8B88AE]">New requests will show up here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {requests.map((req) => {
                const profile = directory[req.userId];
                const name = getDisplayName(profile, req.userId);
                const username = getUsername(profile);
                const busy = busyId === req.id;

                return (
                  <li
                    key={req.id}
                    className="rounded-lg border border-[#1C1A38] bg-[#1D1A40]/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={profile ? name : ''} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#F5F5F5]">{name}</p>
                        <p className="truncate text-xs text-[#8B88AE]">
                          {[username, timeAgo(req.createdAt)].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onReject(req)}
                        className="flex-1 rounded-lg border border-[#2E2A66] px-3 py-1.5 text-xs font-medium
                                   text-[#F5F5F5] transition-colors hover:bg-[#1D1A40] disabled:opacity-50
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(req)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#6C7BFF]
                                   px-3 py-1.5 text-xs font-semibold text-[#0A0918] transition-colors
                                   hover:bg-[#8190FF] disabled:opacity-50
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]"
                      >
                        <Check size={13} />
                        {busy ? 'Working…' : 'Approve'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinRequestsModal({ open, ...props }) {
  if (!open) return null;
  return <Body {...props} />;
}
