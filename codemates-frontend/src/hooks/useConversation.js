import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMessage as deleteMessageApi,
  editMessage as editMessageApi,
  getMessages,
  markConversationRead,
  setConversationMuted as setConversationMutedApi,
} from "../api/chatApi";
import { publish, subscribe } from "../api/websocketClient";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";

const TYPING_STOP_DELAY_MS = 2000;

/**
 * Live view of a single conversation: message history over REST, plus
 * real-time updates and sending over WebSocket. Shared by ProjectChat.jsx
 * and Messages.jsx — a conversation behaves identically whether it's
 * DIRECT or PROJECT type, so there's one hook, not two.
 *
 * @param {string} conversationId
 */
export function useConversation(conversationId) {
  const queryClient = useQueryClient();
  const messagesQueryKey = ["chat", "messages", conversationId];

  const messagesQuery = useQuery({
    queryKey: messagesQueryKey,
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
  });

  const messages = messagesQuery.data?.messages ?? [];
  const hasMoreMessages = messagesQuery.data?.hasMore ?? false;

  // ── Live message events: MESSAGE_NEW / MESSAGE_EDITED / MESSAGE_DELETED
  // wrapped as ConversationEvent on /topic/conversations/{id}. ──────────
  useEffect(() => {
    if (!conversationId) return undefined;

    return subscribe(`/topic/conversations/${conversationId}`, (event) => {
      queryClient.setQueryData(messagesQueryKey, (old) => {
        const list = old?.messages ?? [];
        if (event.eventType === "MESSAGE_NEW") {
          if (list.some((m) => m.id === event.message.id)) return old; // already have it
          return { ...old, messages: [...list, event.message] };
        }
        if (event.eventType === "MESSAGE_EDITED" || event.eventType === "MESSAGE_DELETED") {
          return {
            ...old,
            messages: list.map((m) => (m.id === event.message.id ? event.message : m)),
          };
        }
        return old;
      });

      // A new message also changes the conversation's lastMessagePreview/
      // lastMessageAt server-side — refresh the list so previews update.
      if (event.eventType === "MESSAGE_NEW") {
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [conversationId]);

  // ── Live typing: TypingBroadcast on /topic/conversations/{id}/typing ──
  const [typingUserIds, setTypingUserIds] = useState([]);

  useEffect(() => {
    if (!conversationId) return undefined;

    return subscribe(`/topic/conversations/${conversationId}/typing`, (broadcast) => {
      setTypingUserIds((prev) => {
        if (broadcast.typing) {
          return prev.includes(broadcast.userId) ? prev : [...prev, broadcast.userId];
        }
        return prev.filter((id) => id !== broadcast.userId);
      });
    });
  }, [conversationId]);

  // Clear stale typing state whenever the active conversation changes.
  useEffect(() => {
    setTypingUserIds([]);
  }, [conversationId]);

  // ── Mark read the moment a conversation becomes active ────────────────
  const markReadMutation = useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
  });

  useEffect(() => {
    if (conversationId) markReadMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── Edit / delete (REST — both real, sender-only server-side) ─────────
  const editMutation = useMutation({ mutationFn: ({ messageId, content }) => editMessageApi(messageId, content) });
  const deleteMutation = useMutation({ mutationFn: deleteMessageApi });

  // ── Mute / unmute ──────────────────────────────────────────────────────
  const muteMutation = useMutation({
    mutationFn: (muted) => setConversationMutedApi(conversationId, muted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
  });

  // ── Pagination: fetch an older page and prepend it ────────────────────
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  async function loadMoreMessages() {
    if (!conversationId || messages.length === 0 || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0];
      const olderPage = await getMessages(conversationId, { before: oldest.createdAt, limit: 50 });
      queryClient.setQueryData(messagesQueryKey, (old) => ({
        messages: [...olderPage.messages, ...(old?.messages ?? [])],
        hasMore: olderPage.hasMore,
      }));
    } finally {
      setIsLoadingMore(false);
    }
  }

  // ── Send + typing (WebSocket — the only real way to do either) ────────
  const typingTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  function sendTyping(typing) {
    if (!conversationId) return;
    publish(`/app/conversations/${conversationId}/typing`, { typing });
  }

  /** Call on every keystroke — debounces the "stopped typing" signal. */
  function notifyTyping() {
    sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), TYPING_STOP_DELAY_MS);
  }

  /**
   * Sends over the WebSocket — matches SendMessageRequest exactly.
   * @param {string} content
   * @param {{ messageType?: string, fileUrl?: string, fileName?: string }} [extra]
   */
  function sendMessage(content, extra = {}) {
    if (!conversationId) return;
    clearTimeout(typingTimeoutRef.current);
    sendTyping(false);
    return publish(`/app/conversations/${conversationId}/send`, { content, ...extra });
  }

  return {
    messages,
    hasMoreMessages,
    isLoadingMessages: messagesQuery.isLoading,
    isLoadingMore,
    isMessagesError: messagesQuery.isError,
    messagesError: messagesQuery.error,
    loadMoreMessages,

    typingUserIds,

    sendMessage,
    notifyTyping,

    editMessage: (messageId, content) => editMutation.mutate({ messageId, content }),
    isEditing: editMutation.isPending,

    deleteMessage: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    setMuted: muteMutation.mutate,
  };
}