/**
 * PendingInvitationsWidget
 *
 * A button (with a count badge) that opens a modal listing the current
 * user's pending PROJECT invitations — invitations other leaders have
 * sent them, not invitations they've sent out.
 *
 * Backend: matches ProjectController.java / ProjectService.java exactly.
 *   GET /api/projects/invitations/pending   -> ProjectInvitationResponseDto[]
 *   PUT /api/projects/invitations/{id}/accept -> ProjectMemberResponseDto
 *   PUT /api/projects/invitations/{id}/reject -> ProjectInvitationResponseDto
 *
 * ProjectInvitationResponseDto only carries IDs (projectId,
 * invitedByUserId) — confirmed against the DTO and
 * ProjectService#toInvitationDto. So each row resolves:
 *   - the project's name via useProject(projectId) (already in useMyProjects.js)
 *   - the inviter's name/avatar via useUserDirectory([invitedByUserId]),
 *     batched once for the whole list — the same hook InviteMemberModal
 *     uses to resolve connection names
 *
 * Uses usePendingInvitations() + useProjectMutations() from
 * useMyProjects.js — NOT the separate projectInvitationsApi.js /
 * useProjectInvitations.js sketched earlier in this conversation. Those
 * are superseded: this hook already covers the same endpoints under the
 * same ['invitations','pending'] query key, and already invalidates
 * ['projects','my'] on accept so the accepted project shows up in My
 * Projects without a manual refresh. Don't wire both up.
 *
 * Server-enforced edge cases surfaced per-row rather than as a generic
 * toast, since they're specific to the one invitation acted on:
 *   - invitations expire 7 days after creation (expiresAt) — accepting an
 *     expired one is rejected server-side ("This invitation has expired")
 *     and the Accept button is disabled once the countdown hits 0
 *   - accepting can fail with "Project has reached its member limit"
 */

import { useMemo, useState } from 'react';
import { Check, Inbox, Loader2, X } from 'lucide-react';
import { useProject, useProjectMutations, usePendingInvitations } from '../../hooks/useMyProjects';
import useUserDirectory from '../../hooks/useUserDirectory';
import Avatar from '../ui/Avatar';

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function InvitationRow({ invitation, inviterProfile, onAccept, onReject, busyAction, rowError }) {
  const { project, isLoading: projectLoading } = useProject(invitation.projectId);

  const inviterName =
      inviterProfile?.fullName || inviterProfile?.username || `${invitation.invitedByUserId.slice(0, 8)}…`;
  const projectName = project?.name || (projectLoading ? '…' : 'a project');
  const left = daysLeft(invitation.expiresAt);
  const expired = left === 0;
  const busy = Boolean(busyAction);

  return (
      <div className="rounded-lg border border-[#1C1A38] bg-[#1D1A40]/40 p-3">
        <div className="flex items-start gap-3">
          <Avatar name={inviterName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#F5F5F5]">
              <span className="font-medium">{inviterName}</span> invited you to{' '}
              <span className="font-medium">{projectName}</span>
            </p>
            <p className="mt-0.5 text-xs text-[#8B88AE]">
              as {invitation.role?.toLowerCase()}
              {left !== null && (
                  <>
                    {' · '}
                    {expired ? (
                        <span className="text-red-300">expired</span>
                    ) : (
                        `expires in ${left} day${left === 1 ? '' : 's'}`
                    )}
                  </>
              )}
            </p>
            {rowError && (
                <p role="alert" className="mt-1 text-xs text-red-300">
                  {rowError}
                </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
              type="button"
              onClick={() => onReject(invitation.id)}
              disabled={busy || expired}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2A66] px-3 py-1.5
                     text-xs font-medium text-[#F5F5F5] transition-colors hover:bg-[#1D1A40]
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === 'reject' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            Decline
          </button>
          <button
              type="button"
              onClick={() => onAccept(invitation.id)}
              disabled={busy || expired}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C7BFF] px-3 py-1.5 text-xs
                     font-semibold text-[#0A0918] transition-colors hover:bg-[#8190FF]
                     disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === 'accept' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Accept
          </button>
        </div>
      </div>
  );
}

export default function PendingInvitationsWidget() {
  const [open, setOpen] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [busy, setBusy] = useState(null); // { id, action: 'accept' | 'reject' } | null

  const { invitations, isLoading, isError } = usePendingInvitations();
  const { acceptInvitation, rejectInvitation } = useProjectMutations();

  const inviterIds = useMemo(
      () => [...new Set(invitations.map((i) => i.invitedByUserId))],
      [invitations]
  );
  const { directory } = useUserDirectory(inviterIds);

  function handleAccept(id) {
    setBusy({ id, action: 'accept' });
    setRowErrors((e) => ({ ...e, [id]: '' }));
    acceptInvitation(id, {
      onError: (err) =>
          setRowErrors((e) => ({ ...e, [id]: err?.message || 'Could not accept this invitation.' })),
      onSettled: () => setBusy(null),
    });
  }

  function handleReject(id) {
    setBusy({ id, action: 'reject' });
    setRowErrors((e) => ({ ...e, [id]: '' }));
    rejectInvitation(id, {
      onError: (err) =>
          setRowErrors((e) => ({ ...e, [id]: err?.message || 'Could not decline this invitation.' })),
      onSettled: () => setBusy(null),
    });
  }

  const count = invitations.length;

  return (
      <>
        <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-lg border border-[#2E2A66]
                   bg-[#1D1A40]/40 px-3.5 py-2 text-sm font-medium text-[#F5F5F5]
                   transition-colors hover:bg-[#1D1A40] focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          <Inbox size={15} />
          Invitations
          {count > 0 && (
              <span
                  className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full
                         bg-[#6C7BFF] px-1 text-[11px] font-semibold text-[#0A0918]"
              >
            {count}
          </span>
          )}
        </button>

        {open && (
            <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setOpen(false);
                }}
            >
              <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="pending-invitations-title"
                  className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#1C1A38]
                         bg-[#0A0918] shadow-2xl shadow-black/60"
              >
                <div className="flex items-center justify-between border-b border-[#1C1A38] px-5 py-4">
                  <h2 id="pending-invitations-title" className="text-base font-semibold text-[#F5F5F5]">
                    Pending invitations
                  </h2>
                  <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6890]
                             transition-colors hover:bg-[#1D1A40] hover:text-[#F5F5F5]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2.5 px-5 py-5">
                  {isLoading && (
                      <div className="space-y-2.5">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-[86px] animate-pulse rounded-lg bg-[#1D1A40]" />
                        ))}
                      </div>
                  )}

                  {isError && (
                      <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
                        Couldn't load your invitations. Try again shortly.
                      </p>
                  )}

                  {!isLoading && !isError && invitations.length === 0 && (
                      <p className="rounded-lg border border-dashed border-[#26224A] px-4 py-8 text-center text-sm text-[#8B88AE]">
                        No pending invitations.
                      </p>
                  )}

                  {!isLoading &&
                      !isError &&
                      invitations.map((inv) => (
                          <InvitationRow
                              key={inv.id}
                              invitation={inv}
                              inviterProfile={directory[inv.invitedByUserId]}
                              onAccept={handleAccept}
                              onReject={handleReject}
                              busyAction={busy?.id === inv.id ? busy.action : null}
                              rowError={rowErrors[inv.id]}
                          />
                      ))}
                </div>
              </div>
            </div>
        )}
      </>
  );
}
