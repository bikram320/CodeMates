/**
 * useMessages()
 *
 * Data layer for the Direct Messages page (TanStack Query):
 *   Messages.jsx → useMessages → messagesApi.js → messagesMock.js (for now)
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * It also owns which conversation is open, because the messages query depends
 * on it. Nothing selected is a normal state (`selectedConversation === null`).
 *
 * Returns
 *   Conversations
 *     conversations              undefined until loaded (already sorted by the server)
 *     isLoadingConversations     first load in flight
 *     conversationsError         error | null — load failed and there's nothing to show
 *     isEmpty                    loaded, and there are no conversations
 *     refetchConversations()
 *   Selection
 *     selectedConversation       the open conversation, or null
 *     selectConversation(id)     opens it and marks it read
 *     clearSelection()
 *   Open conversation
 *     messages                   oldest → newest; undefined until loaded
 *     isLoadingMessages          messages in flight
 *     messagesError              error | null
 *     refetchMessages()
 *     unreadDividerId            id of the first message that was unread when it was opened
 *   Actions (all return a Promise that rejects with MessagesApiError)
 *     sendMessage(content)             optimistic; a rejected send is rolled back
 *     deleteMessage(messageId)         optimistic; rolled back on failure
 *     markConversationAsRead(id)
 *     setConversationMuted(id, isMuted)
 *   currentUserId
 *
 * A message being sent has `status: 'sending'` until the server answers.
 */

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteMessage as deleteMessageApi,
  getConversations,
  getCurrentUserId,
  getMessages,
  markConversationAsRead as markConversationAsReadApi,
  sendMessage as sendMessageApi,
  setConversationMuted as setConversationMutedApi,
} from '../api/messagesApi';

export const messagesQueryKeys = {
  conversations: ['messages', 'conversations'],
  thread: (conversationId) => ['messages', 'thread', conversationId],
};

// Matches the server's preview length.
const PREVIEW_LENGTH = 90;

// Don't retry 4xx; retry a flaky 5xx once.
const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

let tempCounter = 0;
const newTempId = () => `tmp-${Date.now()}-${(tempCounter += 1)}`;

/** The last-message fields of a conversation, from what's left in its thread. */
const lastMessageFields = (thread, currentUserId) => {
  const last = thread[thread.length - 1];
  return {
    lastMessageAt: last ? last.createdAt : null,
    lastMessagePreview: last ? last.content.slice(0, PREVIEW_LENGTH) : null,
    lastMessageFromMe: last ? last.senderUserId === currentUserId : false,
  };
};

export function useMessages() {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  const [selectedId, setSelectedId] = useState(null);
  const [openInfo, setOpenInfo] = useState(null); // { id, unreadAtOpen }
  const dividerRef = useRef(null); // { conversationId, messageId } — worked out once per open

  /* ── Queries ─────────────────────────────────────────────────────────── */

  const conversationsQuery = useQuery({
    queryKey: messagesQueryKeys.conversations,
    queryFn: getConversations,
    retry,
  });
  const conversations = conversationsQuery.data;

  const selectedConversation = conversations?.find((c) => c.id === selectedId) ?? null;
  const activeId = selectedConversation ? selectedConversation.id : null;

  const threadQuery = useQuery({
    queryKey: messagesQueryKeys.thread(activeId),
    queryFn: () => getMessages(activeId),
    enabled: Boolean(activeId),
    retry,
  });
  const messages = threadQuery.data;

  /* ── Cache helpers ───────────────────────────────────────────────────── */

  const patchConversation = (id, updater) =>
    queryClient.setQueryData(messagesQueryKeys.conversations, (current) =>
      current ? current.map((c) => (c.id === id ? updater(c) : c)) : current
    );

  const patchThread = (id, updater) =>
    queryClient.setQueryData(messagesQueryKeys.thread(id), (current) =>
      current ? updater(current) : current
    );

  const getConversation = (id) =>
    queryClient.getQueryData(messagesQueryKeys.conversations)?.find((c) => c.id === id);

  const invalidateConversations = () =>
    queryClient.invalidateQueries({ queryKey: messagesQueryKeys.conversations });
  const invalidateThread = (id) =>
    queryClient.invalidateQueries({ queryKey: messagesQueryKeys.thread(id) });

  /* ── Mutations ───────────────────────────────────────────────────────── */

  const markRead = useMutation({
    mutationFn: (conversationId) => markConversationAsReadApi(conversationId),
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.conversations });
      const previous = getConversation(conversationId)?.unreadCount;
      patchConversation(conversationId, (c) => ({ ...c, unreadCount: 0 }));
      return { conversationId, previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous !== undefined) {
        patchConversation(context.conversationId, (c) => ({ ...c, unreadCount: context.previous }));
      }
    },
    onSettled: invalidateConversations,
  });

  const mute = useMutation({
    mutationFn: ({ conversationId, isMuted }) => setConversationMutedApi(conversationId, isMuted),
    onMutate: async ({ conversationId, isMuted }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.conversations });
      const previous = getConversation(conversationId)?.isMuted;
      patchConversation(conversationId, (c) => ({ ...c, isMuted }));
      return { conversationId, previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous !== undefined) {
        patchConversation(context.conversationId, (c) => ({ ...c, isMuted: context.previous }));
      }
    },
    onSettled: invalidateConversations,
  });

  // Optimistic: the message shows up straight away as "sending", and is taken
  // back out again if the server rejects it.
  const send = useMutation({
    mutationFn: ({ conversationId, content }) => sendMessageApi(conversationId, { content }),
    onMutate: async ({ conversationId, content, tempId }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.thread(conversationId) });
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.conversations });

      const now = new Date().toISOString();
      const pending = {
        id: tempId,
        conversationId,
        senderUserId: currentUserId,
        content,
        messageType: 'TEXT',
        fileUrl: null,
        fileName: null,
        isEdited: false,
        editedAt: null,
        createdAt: now,
        status: 'sending',
      };

      const previousConversation = getConversation(conversationId);
      patchThread(conversationId, (thread) => [...thread, pending]);
      patchConversation(conversationId, (c) => ({
        ...c,
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, PREVIEW_LENGTH),
        lastMessageFromMe: true,
      }));
      return { conversationId, tempId, previousConversation };
    },
    onSuccess: (saved, _vars, context) =>
      patchThread(context.conversationId, (thread) =>
        thread.map((m) => (m.id === context.tempId ? saved : m))
      ),
    onError: (_error, _vars, context) => {
      if (!context) return;
      patchThread(context.conversationId, (thread) => thread.filter((m) => m.id !== context.tempId));
      if (context.previousConversation) {
        patchConversation(context.conversationId, () => context.previousConversation);
      }
    },
    onSettled: (_data, _error, vars) => {
      invalidateConversations();
      invalidateThread(vars.conversationId);
    },
  });

  // Optimistic: the message disappears at once; it comes back if the delete fails.
  const remove = useMutation({
    mutationFn: ({ messageId }) => deleteMessageApi(messageId),
    onMutate: async ({ messageId, conversationId }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.thread(conversationId) });
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.conversations });

      const previousThread = queryClient.getQueryData(messagesQueryKeys.thread(conversationId));
      const previousConversation = getConversation(conversationId);

      const remaining = (previousThread ?? []).filter((m) => m.id !== messageId);
      patchThread(conversationId, () => remaining);
      patchConversation(conversationId, (c) => ({
        ...c,
        ...lastMessageFields(remaining, currentUserId),
      }));
      return { conversationId, previousThread, previousConversation };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      if (context.previousThread) {
        queryClient.setQueryData(messagesQueryKeys.thread(context.conversationId), context.previousThread);
      }
      if (context.previousConversation) {
        patchConversation(context.conversationId, () => context.previousConversation);
      }
    },
    onSettled: (_data, _error, vars) => {
      invalidateConversations();
      invalidateThread(vars.conversationId);
    },
  });

  /* ── Selection ───────────────────────────────────────────────────────── */

  const selectConversation = (id) => {
    const conversation = conversations?.find((c) => c.id === id);
    if (!conversation) return;

    // Remember how many were unread before the conversation is marked read,
    // so the "N new messages" divider can be placed once the thread loads.
    setOpenInfo({ id, unreadAtOpen: conversation.unreadCount });
    dividerRef.current = null;
    setSelectedId(id);

    if (conversation.unreadCount > 0) {
      markRead.mutateAsync(id).catch(() => {}); // rolled back by onError; nothing to tell the user
    }
  };

  const clearSelection = () => setSelectedId(null);

  // Worked out during render, the first time the thread is available, so the
  // divider is there on the very first paint (the list scrolls to the bottom
  // once, with the divider already in place). It's fixed for this open: later
  // sends or deletes don't move it.
  if (
    openInfo &&
    messages &&
    openInfo.id === activeId &&
    openInfo.unreadAtOpen > 0 &&
    dividerRef.current?.conversationId !== openInfo.id
  ) {
    const firstUnread = messages[messages.length - openInfo.unreadAtOpen];
    dividerRef.current = {
      conversationId: openInfo.id,
      messageId: firstUnread ? firstUnread.id : null,
    };
  }

  /* ── Public API ──────────────────────────────────────────────────────── */

  return {
    conversations,
    isLoadingConversations: conversations === undefined && !conversationsQuery.isError,
    conversationsError:
      conversationsQuery.isError && conversations === undefined ? conversationsQuery.error : null,
    isEmpty: Array.isArray(conversations) && conversations.length === 0,
    refetchConversations: conversationsQuery.refetch,

    selectedConversation,
    selectConversation,
    clearSelection,

    messages,
    isLoadingMessages: Boolean(activeId) && messages === undefined && !threadQuery.isError,
    messagesError: threadQuery.isError && messages === undefined ? threadQuery.error : null,
    refetchMessages: threadQuery.refetch,
    unreadDividerId:
      activeId && dividerRef.current?.conversationId === activeId
        ? dividerRef.current.messageId
        : null,

    sendMessage: (content) => {
      if (!activeId) return Promise.reject(new Error('Open a conversation first.'));
      return send.mutateAsync({ conversationId: activeId, content, tempId: newTempId() });
    },
    deleteMessage: (messageId) => {
      if (!activeId) return Promise.reject(new Error('Open a conversation first.'));
      return remove.mutateAsync({ messageId, conversationId: activeId });
    },
    markConversationAsRead: (id) => markRead.mutateAsync(id),
    setConversationMuted: (id, isMuted) => mute.mutateAsync({ conversationId: id, isMuted }),

    currentUserId,
  };
}

export default useMessages;