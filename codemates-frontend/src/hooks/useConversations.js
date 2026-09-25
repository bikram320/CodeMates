import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  startDirectConversation as startDirectConversationApi,
} from "../api/chatApi";

export const CONVERSATIONS_QUERY_KEY = ["chat", "conversations"];

/**
 * List of the current user's conversations (DIRECT and PROJECT mixed) —
 * matches GET /api/conversations/my exactly, no client-side filtering
 * baked in here. Callers (ProjectChat, Messages) filter by type/projectId
 * themselves, since what counts as "the right conversation" differs per
 * page.
 */
export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: CONVERSATIONS_QUERY_KEY, queryFn: getConversations });

  const startDirectMutation = useMutation({
    mutationFn: startDirectConversationApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    startDirectConversation: startDirectMutation.mutateAsync,
    isStartingConversation: startDirectMutation.isPending,
  };
}