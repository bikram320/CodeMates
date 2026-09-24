import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMessage as deleteMessageApi,
  editMessage as editMessageApi,
  getConversations,
  getMessages,
  markConversationRead,
} from "../api/chatApi";

/**
 * ProjectChat.jsx -> useProjectChat(projectId) -> chatApi.js -> real
 * messaging-service (via apiClient). No mock data anywhere in this chain.
 *
 * ⚠️ sendMessage is intentionally NOT a working call. The real backend
 * has no REST endpoint for sending at all — only STOMP, at
 * /app/conversations/{id}/send (confirmed by MessageService.sendMessage()
 * never being called from MessageController). Calling the stub below
 * throws a clear error instead of silently doing nothing, so a broken
 * "Send" button isn't mistaken for a working one. Replace this once a
 * WebSocket client module exists.
 *
 * @param {string} projectId
 */
export function useProjectChat(projectId) {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: getConversations,
  });

  const conversations = conversationsQuery.data ?? [];

  const [activeConversationId, setActiveConversationId] = useState(null);

  // Default to this project's own PROJECT-type conversation once the
  // list loads, if nothing's been explicitly selected yet — done
  // client-side since the real API has no per-project filter.
  useEffect(() => {
    if (activeConversationId || conversations.length === 0) return;
    const projectConversation = conversations.find(
      (c) => c.type === "PROJECT" && c.projectId === projectId
    );
    setActiveConversationId((projectConversation ?? conversations[0])?.id ?? null);
  }, [conversations, activeConversationId, projectId]);

  const messagesQueryKey = ["chat", "messages", activeConversationId];

  const messagesQuery = useQuery({
    queryKey: messagesQueryKey,
    queryFn: () => getMessages(activeConversationId),
    enabled: !!activeConversationId,
  });

  const messages = messagesQuery.data?.messages ?? [];
  const hasMoreMessages = messagesQuery.data?.hasMore ?? false;

  function invalidateChat() {
    queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    queryClient.invalidateQueries({ queryKey: messagesQueryKey });
  }

  const editMutation = useMutation({
    mutationFn: ({ messageId, content }) => editMessageApi(messageId, content),
    onSuccess: invalidateChat,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMessageApi,
    onSuccess: invalidateChat,
  });

  const markReadMutation = useMutation({
    mutationFn: () => markConversationRead(activeConversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });

  return {
    conversations,
    isLoadingConversations: conversationsQuery.isLoading,
    isConversationsError: conversationsQuery.isError,

    activeConversationId,
    setActiveConversationId,

    messages,
    hasMoreMessages,
    isLoadingMessages: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,

    // See the file-level ⚠️ above — not a working call yet.
    sendMessage: () => {
      throw new Error(
        "Sending isn't connected yet — it needs the WebSocket client (STOMP), which isn't built."
      );
    },

    editMessage: (messageId, content) => editMutation.mutate({ messageId, content }),
    isEditing: editMutation.isPending,

    deleteMessage: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    markRead: markReadMutation.mutate,
  };
}