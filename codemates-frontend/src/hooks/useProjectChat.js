import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_ID } from "../mock/chatMock";
import {
  deleteMessage as deleteMessageApi,
  editMessage as editMessageApi,
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
} from "../api/chatApi";

/**
 * ProjectChat.jsx -> useProjectChat(projectId) -> chatApi.js -> chatMock.js
 *
 * Owns the conversation list, active conversation selection, message
 * history, and send/edit/delete mutations for a project's chat.
 * ProjectChat.jsx still resolves display names/avatars itself (that's
 * presentation logic requiring project data + the user directory, not
 * data-fetching), this hook just owns the async data and mutations.
 *
 * Note: `isPending` below is the React Query v5 name for a mutation's
 * loading state. If this project is on v4, use `isLoading` instead on
 * the mutation objects.
 *
 * @param {string} projectId
 */
export function useProjectChat(projectId) {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations", projectId],
    queryFn: () => getConversations(projectId),
    enabled: !!projectId,
  });

  const conversations = conversationsQuery.data ?? [];

  const [activeConversationId, setActiveConversationId] = useState(null);

  // Default to this project's own PROJECT-type conversation once the
  // list loads, if nothing's been explicitly selected yet.
  useEffect(() => {
    if (activeConversationId || conversations.length === 0) return;
    const projectConversation = conversations.find(
      (c) => c.type === "PROJECT" && c.projectId === projectId
    );
    setActiveConversationId((projectConversation ?? conversations[0])?.id ?? null);
  }, [conversations, activeConversationId, projectId]);

  const messagesQueryKey = ["chat", "messages", projectId, activeConversationId];

  const messagesQuery = useQuery({
    queryKey: messagesQueryKey,
    queryFn: () => getMessages(projectId, activeConversationId),
    enabled: !!projectId && !!activeConversationId,
  });

  const messages = messagesQuery.data?.messages ?? [];

  function invalidateChat() {
    queryClient.invalidateQueries({ queryKey: ["chat", "conversations", projectId] });
    queryClient.invalidateQueries({ queryKey: messagesQueryKey });
  }

  // Optimistic send: the message appears immediately in the cache, then
  // gets reconciled with the "server" response once the mock delay
  // resolves — without this, every send would visibly wait ~400ms,
  // which feels wrong for chat specifically.
  const sendMutation = useMutation({
    mutationFn: (content) => sendMessageApi(projectId, activeConversationId, { content }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });
      const previous = queryClient.getQueryData(messagesQueryKey);

      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId: activeConversationId,
        senderUserId: CURRENT_USER_ID,
        content,
        messageType: "TEXT",
        fileUrl: null,
        fileName: null,
        isEdited: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(messagesQueryKey, (old) => ({
        messages: [...(old?.messages ?? []), optimisticMessage],
        hasMore: old?.hasMore ?? false,
      }));

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesQueryKey, context.previous);
      }
    },
    onSettled: invalidateChat,
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, content }) => editMessageApi(projectId, messageId, { content }),
    onSuccess: invalidateChat,
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId) => deleteMessageApi(projectId, messageId),
    onSuccess: invalidateChat,
  });

  return {
    conversations,
    isLoadingConversations: conversationsQuery.isLoading,
    isConversationsError: conversationsQuery.isError,

    activeConversationId,
    setActiveConversationId,

    messages,
    isLoadingMessages: messagesQuery.isLoading,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,

    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,

    editMessage: (messageId, content) => editMutation.mutate({ messageId, content }),
    isEditing: editMutation.isPending,

    deleteMessage: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}