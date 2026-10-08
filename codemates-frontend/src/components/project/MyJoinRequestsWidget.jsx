/**
 * MyJoinRequestsWidget
 *
 * A button (with a pending-count badge) that opens a modal listing the
 * current user's own join requests — requests THEY sent to join other
 * PUBLIC projects, across every status. Pending ones get a Cancel button;
 * others just show their resolved status.
 *
 * Sibling to PendingInvitationsWidget.jsx (which shows invitations sent
 * TO you) — kept as a separate component since the data, actions and
 * backend endpoints are entirely different (join-requests/my vs
 * invitations/pending).
 *
 * ProjectJoinRequestResponseDto only carries projectId, so each row
 * resolves the project's name via useProject(projectId) — same approach
 * PendingInvitationsWidget uses for the inviter's project.
 */

import { useMemo, useState } from 'react';
import { Inbox, Loader2, X, XCircle } from 'lucide-react';
import { useProject, useMyJoinRequests, useJoinRequestMutations } from '../../hooks/useMyProjects';

const STATUS_STYLES = {
    PENDING:   'bg-[#6C7BFF]/20 text-[#8E9BFF]',
    ACCEPTED:  'bg-emerald-400/20 text-emerald-300',
    REJECTED:  'bg-red-400/20 text-red-300',
    CANCELLED: 'bg-[#2E2A66] text-[#8B88AE]',
};

function StatusPill({ status }) {
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                STATUS_STYLES[status] ?? 'bg-[#2E2A66] text-[#8B88AE]'
            }`}
        >
        {status?.toLowerCase()}
      </span>
    );
}

function JoinRequestRow({ joinRequest, onCancel, busy, rowError }) {
    const { project, isLoading: projectLoading } = useProject(joinRequest.projectId);
    const projectName = project?.name || (projectLoading ? '…' : 'a project');
    const isPending = joinRequest.status === 'PENDING';

    return (
        <div className="rounded-lg border border-[#1C1A38] bg-[#1D1A40]/40 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-[#F5F5F5]">
                        Request to join <span className="font-medium">{projectName}</span>
                    </p>
                    <div className="mt-1.5">
                        <StatusPill status={joinRequest.status} />
                    </div>
                    {rowError && (
                        <p role="alert" className="mt-1.5 text-xs text-red-300">
                            {rowError}
                        </p>
                    )}
                </div>

                {isPending && (
                    <button
                        type="button"
                        onClick={() => onCancel(joinRequest.id)}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2E2A66] px-3 py-1.5
                         text-xs font-medium text-[#F5F5F5] transition-colors hover:bg-[#1D1A40]
                         disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

export default function MyJoinRequestsWidget() {
    const [open, setOpen] = useState(false);
    const [rowErrors, setRowErrors] = useState({});
    const [busyId, setBusyId] = useState(null);

    const { joinRequests, isLoading, isError } = useMyJoinRequests();
    const { cancelJoinRequest } = useJoinRequestMutations();

    const pendingCount = useMemo(
        () => joinRequests.filter((r) => r.status === 'PENDING').length,
        [joinRequests]
    );

    function handleCancel(id) {
        setBusyId(id);
        setRowErrors((e) => ({ ...e, [id]: '' }));
        cancelJoinRequest(id, {
            onError: (err) =>
                setRowErrors((e) => ({ ...e, [id]: err?.message || 'Could not cancel this request.' })),
            onSettled: () => setBusyId(null),
        });
    }

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
                My Requests
                {pendingCount > 0 && (
                    <span
                        className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full
                         bg-[#6C7BFF] px-1 text-[11px] font-semibold text-[#0A0918]"
                    >
            {pendingCount}
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
                        aria-labelledby="my-join-requests-title"
                        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#1C1A38]
                         bg-[#0A0918] shadow-2xl shadow-black/60"
                    >
                        <div className="flex items-center justify-between border-b border-[#1C1A38] px-5 py-4">
                            <h2 id="my-join-requests-title" className="text-base font-semibold text-[#F5F5F5]">
                                My join requests
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
                                        <div key={i} className="h-[64px] animate-pulse rounded-lg bg-[#1D1A40]" />
                                    ))}
                                </div>
                            )}

                            {isError && (
                                <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
                                    Couldn't load your requests. Try again shortly.
                                </p>
                            )}

                            {!isLoading && !isError && joinRequests.length === 0 && (
                                <p className="rounded-lg border border-dashed border-[#26224A] px-4 py-8 text-center text-sm text-[#8B88AE]">
                                    You haven't requested to join any projects yet.
                                </p>
                            )}

                            {!isLoading &&
                                !isError &&
                                joinRequests.map((jr) => (
                                    <JoinRequestRow
                                        key={jr.id}
                                        joinRequest={jr}
                                        onCancel={handleCancel}
                                        busy={busyId === jr.id}
                                        rowError={rowErrors[jr.id]}
                                    />
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}