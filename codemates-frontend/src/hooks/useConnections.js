import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptConnectionRequest as acceptConnectionRequestApi,
  getConnections,
  getIncomingRequests,
  getOutgoingRequests,
  rejectConnectionRequest as rejectConnectionRequestApi,
  removeConnection as removeConnectionApi,
  sendConnectionRequest as sendConnectionRequestApi,
} from "../api/connectionsApi";

const QK_CONNECTIONS = ["connections", "list"];
const QK_INCOMING = ["connections", "incoming"];
const QK_OUTGOING = ["connections", "outgoing"];

/**
 * Connections.jsx -> useConnections() -> connectionsApi.js -> connectionsMock.js
 *
 * Three independent queries, matching the three requested "get" functions
 * one-to-one — each maps to a different (or, for outgoing, missing) real
 * endpoint, so collapsing them into one call would hide that distinction.
 *
 * Note: `isPending` below is the React Query v5 name for a mutation's
 * loading state — use `isLoading` on the mutation objects instead if
 * this project is on v4.
 */
export function useConnections() {
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({ queryKey: QK_CONNECTIONS, queryFn: getConnections });
  const incomingQuery = useQuery({ queryKey: QK_INCOMING, queryFn: getIncomingRequests });
  const outgoingQuery = useQuery({ queryKey: QK_OUTGOING, queryFn: getOutgoingRequests });

  const isLoading =
    connectionsQuery.isLoading || incomingQuery.isLoading || outgoingQuery.isLoading;
  const isError = connectionsQuery.isError || incomingQuery.isError || outgoingQuery.isError;
  const error = connectionsQuery.error ?? incomingQuery.error ?? outgoingQuery.error;

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: QK_CONNECTIONS });
    queryClient.invalidateQueries({ queryKey: QK_INCOMING });
    queryClient.invalidateQueries({ queryKey: QK_OUTGOING });
  }

  const sendMutation = useMutation({
    mutationFn: sendConnectionRequestApi,
    onSuccess: invalidateAll,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptConnectionRequestApi,
    onSuccess: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: rejectConnectionRequestApi,
    onSuccess: invalidateAll,
  });

  const removeMutation = useMutation({
    mutationFn: removeConnectionApi,
    onSuccess: invalidateAll,
  });

  return {
    connections: connectionsQuery.data ?? [],
    incomingRequests: incomingQuery.data ?? [],
    outgoingRequests: outgoingQuery.data ?? [],

    isLoading,
    isError,
    error,

    sendConnectionRequest: sendMutation.mutate,
    isSending: sendMutation.isPending,

    acceptConnectionRequest: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,

    rejectConnectionRequest: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,

    // Also used to cancel an outgoing request — see connectionsApi.js's
    // removeConnection for why one function covers both.
    removeConnection: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}