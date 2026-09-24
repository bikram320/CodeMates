import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptConnectionRequest as acceptConnectionRequestApi,
  blockConnection as blockConnectionApi,
  getConnections,
  getIncomingRequests,
  rejectConnectionRequest as rejectConnectionRequestApi,
  removeConnection as removeConnectionApi,
  sendConnectionRequest as sendConnectionRequestApi,
} from "../api/connectionsApi";

const QK_CONNECTIONS = ["connections", "list"];
const QK_INCOMING = ["connections", "incoming"];

/**
 * Connections.jsx -> useConnections() -> connectionsApi.js -> real
 * social-service (via apiClient). No mock data.
 *
 * No outgoing-requests query — see connectionsApi.js for why that's
 * permanently unavailable rather than just not-yet-built.
 *
 * Note: `isPending` below is the React Query v5 name for a mutation's
 * loading state — use `isLoading` on the mutation objects instead if
 * this project is on v4.
 */
export function useConnections() {
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({ queryKey: QK_CONNECTIONS, queryFn: getConnections });
  const incomingQuery = useQuery({ queryKey: QK_INCOMING, queryFn: getIncomingRequests });

  const isLoading = connectionsQuery.isLoading || incomingQuery.isLoading;
  const isError = connectionsQuery.isError || incomingQuery.isError;
  const error = connectionsQuery.error ?? incomingQuery.error;

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: QK_CONNECTIONS });
    queryClient.invalidateQueries({ queryKey: QK_INCOMING });
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

  const blockMutation = useMutation({
    mutationFn: blockConnectionApi,
    onSuccess: invalidateAll,
  });

  const removeMutation = useMutation({
    mutationFn: removeConnectionApi,
    onSuccess: invalidateAll,
  });

  return {
    connections: connectionsQuery.data ?? [],
    incomingRequests: incomingQuery.data ?? [],

    isLoading,
    isError,
    error,

    sendConnectionRequest: sendMutation.mutate,
    isSending: sendMutation.isPending,

    acceptConnectionRequest: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,

    rejectConnectionRequest: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,

    blockConnection: blockMutation.mutate,
    isBlocking: blockMutation.isPending,

    removeConnection: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}