/**
 * src/hooks/useProfileConnection.js
 *
 * Resolves the "Connect" button's real state for someone else's profile
 * page, and exposes the actions it can trigger. Replaces the old
 * DeveloperProfile.jsx local `useState(false)` "connected" toggle, which
 * never touched the backend at all — that's why the button "did nothing".
 *
 * ── Why this needs more than one call ────────────────────────────────────
 * GET /api/social/connections/status/{userId} (ConnectionStatusResponseDto)
 * only returns a bare status string: NONE | PENDING | ACCEPTED | REJECTED |
 * BLOCKED. It does not say who sent a pending request, and it carries no
 * connectionId — so on its own it's not enough to decide "show Accept /
 * Decline" vs. a disabled "Request sent", or to know which connectionId to
 * call accept/reject/remove on. So:
 *
 *   - status === 'PENDING'  → also fetch GET /connections/pending (my
 *     incoming, receiver-only). If this profile's userId shows up there as
 *     a sender, it's a request THEY sent me — I have its id, so Accept /
 *     Decline are wired up. If it doesn't show up, it must be a request I
 *     sent THEM — there is no backend endpoint for "requests I sent" (see
 *     connectionsApi.js's own note on this), so that case is permanently a
 *     disabled "Request sent" with no cancel option until the backend adds
 *     one.
 *   - status === 'ACCEPTED' → also fetch GET /connections (my accepted
 *     connections) and match by otherUserId to get the connectionId needed
 *     to remove it.
 *   - status === 'REJECTED' → ConnectionService.sendRequest only blocks a
 *     new request when an existing record's status is NOT "REJECTED", so a
 *     rejected connection is really just "you can send a new request" —
 *     treated the same as NONE here.
 *
 * ⚠️ Assumption: this is keyed on `userId`, the developer-profile's own
 * user id. None of the ProfileResponse fields were given to me directly,
 * but every other DTO in this codebase (ProfileSearchResult, ConnectionSummaryDto,
 * etc.) uses `userId` for this same purpose, so DeveloperProfile.jsx passes
 * `profile.userId`. If ProfileResponse actually calls it something else,
 * this hook will just sit disabled (see the `!userId` branch below) rather
 * than silently querying the wrong thing.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    acceptConnectionRequest,
    getConnectionStatus,
    getConnections,
    getIncomingRequests,
    rejectConnectionRequest,
    removeConnection,
    sendConnectionRequest,
} from '../api/connectionsApi';

function isBusy(mutation) {
    return Boolean(mutation.isPending) || Boolean(mutation.isLoading);
}

export function useProfileConnection(userId) {
    const queryClient = useQueryClient();

    const statusQuery = useQuery({
        queryKey: ['social', 'connectionStatus', userId],
        queryFn: () => getConnectionStatus(userId),
        enabled: Boolean(userId),
        retry: false,
    });

    const status = statusQuery.data?.status;

    const incomingQuery = useQuery({
        queryKey: ['social', 'incomingRequests'],
        queryFn: getIncomingRequests,
        enabled: Boolean(userId) && status === 'PENDING',
        retry: false,
    });

    const connectionsQuery = useQuery({
        queryKey: ['social', 'connections'],
        queryFn: getConnections,
        enabled: Boolean(userId) && status === 'ACCEPTED',
        retry: false,
    });

    const incomingMatch = incomingQuery.data?.find((r) => r.senderUserId === userId);
    const connectionMatch = connectionsQuery.data?.find((c) => c.otherUserId === userId);

    const state = useMemo(() => {
        if (!userId) return 'UNAVAILABLE'; // see the assumption note above
        if (statusQuery.isError) return 'ERROR';
        if (!statusQuery.isSuccess) return 'LOADING';

        if (status === 'NONE' || status === 'REJECTED') return 'NONE';
        if (status === 'BLOCKED') return 'BLOCKED';

        if (status === 'ACCEPTED') {
            return connectionsQuery.isLoading ? 'LOADING' : 'ACCEPTED';
        }

        if (status === 'PENDING') {
            if (incomingQuery.isLoading) return 'LOADING';
            return incomingMatch ? 'PENDING_INCOMING' : 'PENDING_OUTGOING';
        }

        return 'NONE';
    }, [
        userId,
        status,
        statusQuery.isError,
        statusQuery.isSuccess,
        connectionsQuery.isLoading,
        incomingQuery.isLoading,
        incomingMatch,
    ]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['social', 'connectionStatus', userId] });
        queryClient.invalidateQueries({ queryKey: ['social', 'incomingRequests'] });
        queryClient.invalidateQueries({ queryKey: ['social', 'connections'] });
    };

    const connectMutation = useMutation({
        mutationFn: () => sendConnectionRequest(userId),
        onSuccess: invalidateAll,
    });

    const acceptMutation = useMutation({
        mutationFn: () => acceptConnectionRequest(incomingMatch?.id),
        onSuccess: invalidateAll,
    });

    const rejectMutation = useMutation({
        mutationFn: () => rejectConnectionRequest(incomingMatch?.id),
        onSuccess: invalidateAll,
    });

    const removeMutation = useMutation({
        mutationFn: () => removeConnection(connectionMatch?.connectionId),
        onSuccess: invalidateAll,
    });

    const actionError =
        connectMutation.error?.message ||
        acceptMutation.error?.message ||
        rejectMutation.error?.message ||
        removeMutation.error?.message ||
        null;

    return {
        state, // 'NONE' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'ACCEPTED' | 'BLOCKED' | 'LOADING' | 'ERROR' | 'UNAVAILABLE'
        connect: () => connectMutation.mutate(),
        accept: () => acceptMutation.mutate(),
        reject: () => rejectMutation.mutate(),
        remove: () => removeMutation.mutate(),
        retry: () => statusQuery.refetch(),
        isActing: isBusy(connectMutation) || isBusy(acceptMutation) || isBusy(rejectMutation) || isBusy(removeMutation),
        actionError,
    };
}

export default useProfileConnection;