import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Bell, BellOff, MessagesSquare } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import TypingIndicator from "../components/chat/TypingIndicator";
import MessageInput from "../components/chat/MessageInput";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

import { useConnections } from "../hooks/useConnections";
import { useUserProfiles } from "../hooks/useUserProfiles";
import { useConversations } from "../hooks/useConversations";
import { useConversation } from "../hooks/useConversation";
import { usePresence } from "../hooks/usePresence";
import { useAuth } from "../hooks/useAuth";
import { developerFromProfile } from "../utils/developerProfileMapping";

/**
 * Messages page (/messages) — the general inbox for DIRECT conversations.
 *
 * The list is driven by your accepted connections (useConnections), not by
 * which conversations already have messages. Every connection shows up,
 * Discord-style: if a real conversation with them exists (useConversations),
 * you see the last message; if not, selecting them opens an empty thread
 * and the first message you send creates the conversation (POST
 * /api/conversations/direct via startDirectConversation).
 *
 * Arriving from a developer's profile page passes { otherUserId } via
 * router state (see DeveloperProfile.jsx's onMessage) to auto-open that
 * person's thread.
 */
export default function Messages() {
  const location = useLocation();
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const presence = usePresence();

  const { connections, isLoading: isLoadingConnections, isError: isConnectionsError, error: connectionsError } =
      useConnections();

  const {
    conversations,
    isLoading: isLoadingConversations,
    isError: isConversationsError,
    startDirectConversation,
    isStartingConversation,
  } = useConversations();

  const directConversations = conversations.filter((c) => c.type === "DIRECT");

  // Resolve every connection's userId (+ anyone from a conversation not in
  // the connections list, e.g. a stale/removed connection with old history)
  // into real names/avatars in one batch call.
  const conversationOtherIds = directConversations
      .map((c) => c.participants?.find((p) => p.userId !== currentUserId)?.userId)
      .filter(Boolean);

  const idsToResolve = [...connections.map((c) => c.otherUserId), ...conversationOtherIds];
  const { profileMap, isLoading: isLoadingProfiles } = useUserProfiles(idsToResolve);

  const [selectedOtherUserId, setSelectedOtherUserId] = useState(null);
  const [sendError, setSendError] = useState(null);
  const pendingMessageRef = useRef(null);
  const appliedNavStateRef = useRef(false);

  // Arrived here from a profile page's "Message" button — open that
  // person's thread once, the first time this page mounts with that state.
  useEffect(() => {
    const targetUserId = location.state?.otherUserId;
    if (targetUserId && !appliedNavStateRef.current) {
      appliedNavStateRef.current = true;
      setSelectedOtherUserId(targetUserId);
    }
  }, [location.state]);

  const isLoading = isLoadingConnections || isLoadingConversations || isLoadingProfiles;

  // Build one row per connection — chatted or not — plus any conversation
  // whose other participant isn't (or no longer is) a connection, so
  // existing history is never hidden. `id` is what ConversationList /
  // ConversationItem read (onSelect(conversation.id)) — must match here.
  const matchedConversationIds = new Set();

  const connectionEntries = connections.map((c) => {
    const conversation = directConversations.find((conv) =>
        conv.participants?.some((p) => p.userId === c.otherUserId)
    );
    if (conversation) matchedConversationIds.add(conversation.id);

    const developer = developerFromProfile(c.otherUserId, profileMap.get(c.otherUserId));
    const selfParticipant = conversation?.participants?.find((p) => p.userId === currentUserId);
    const unread =
        !!conversation?.lastMessageAt &&
        (!selfParticipant?.lastReadAt || new Date(selfParticipant.lastReadAt) < new Date(conversation.lastMessageAt));

    return {
      id: conversation?.id ?? `pending-${c.otherUserId}`,
      otherUserId: c.otherUserId,
      developer,
      displayName: developer.name,
      displayAvatar: developer.avatarUrl,
      isGroup: false,
      isOnline: presence[c.otherUserId] === "ONLINE",
      unread,
      lastMessagePreview: conversation?.lastMessagePreview ?? "Say hi \u{1F44B} — start the conversation",
      lastMessageAt: conversation?.lastMessageAt ?? null,
    };
  });

  const leftoverEntries = directConversations
      .filter((conv) => !matchedConversationIds.has(conv.id))
      .map((conv) => {
        const otherUserId = conv.participants?.find((p) => p.userId !== currentUserId)?.userId;
        const developer = developerFromProfile(otherUserId, profileMap.get(otherUserId));
        const selfParticipant = conv.participants?.find((p) => p.userId === currentUserId);
        const unread =
            !!conv.lastMessageAt &&
            (!selfParticipant?.lastReadAt || new Date(selfParticipant.lastReadAt) < new Date(conv.lastMessageAt));

        return {
          id: conv.id,
          otherUserId,
          developer,
          displayName: developer.name,
          displayAvatar: developer.avatarUrl,
          isGroup: false,
          isOnline: presence[otherUserId] === "ONLINE",
          unread,
          lastMessagePreview: conv.lastMessagePreview,
          lastMessageAt: conv.lastMessageAt ?? null,
        };
      });

  const allEntries = [...connectionEntries, ...leftoverEntries].sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const activeEntry = allEntries.find((e) => e.otherUserId === selectedOtherUserId);
  const activeConversation = directConversations.find((conv) =>
      conv.participants?.some((p) => p.userId === selectedOtherUserId)
  );
  const activeConversationId = activeConversation?.id ?? null;

  const {
    messages,
    hasMoreMessages,
    isLoadingMessages,
    isLoadingMore,
    isMessagesError,
    messagesError,
    loadMoreMessages,
    typingUserIds,
    sendMessage,
    notifyTyping,
    editMessage,
    deleteMessage,
    setMuted,
  } = useConversation(activeConversationId);

  // Once starting a new conversation resolves and directConversations
  // includes it (after the query invalidation in useConversations),
  // activeConversationId picks it up here — flush the message that was
  // waiting to be sent.
  useEffect(() => {
    if (activeConversationId && pendingMessageRef.current) {
      const content = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMessage(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  async function handleSend(content) {
    if (activeConversationId) {
      sendMessage(content);
      return;
    }
    if (!selectedOtherUserId) return;

    try {
      setSendError(null);
      pendingMessageRef.current = content;
      await startDirectConversation(selectedOtherUserId);
      // directConversations will include the new thread once the
      // conversations query refetches; the effect above sends the
      // pending message as soon as activeConversationId resolves.
    } catch (err) {
      pendingMessageRef.current = null;
      setSendError(err.message);
    }
  }

  const typingNames = typingUserIds
      .filter((id) => id !== currentUserId)
      .map((id) => developerFromProfile(id, profileMap.get(id)).name);

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
    );
  }

  if (isConnectionsError || isConversationsError) {
    return (
        <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your messages"
            description={connectionsError?.message || "Something went wrong. Please try again."}
        />
    );
  }

  const isMuted =
      activeConversation?.participants?.find((p) => p.userId === currentUserId)?.isMuted ?? false;

  return (
      <div className="messages-page flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] overflow-hidden rounded-lg border border-[var(--cm-border)]">
        <div className="flex w-72 shrink-0 flex-col border-r border-[var(--cm-border)]">
          <ConversationList
              conversations={allEntries}
              activeConversationId={activeEntry?.id}
              onSelect={(id) => {
                const entry = allEntries.find((e) => e.id === id);
                if (entry) setSelectedOtherUserId(entry.otherUserId);
              }}
              className="flex-1 border-r-0"
          />
          {allEntries.length === 0 && (
              <div className="border-t border-[var(--cm-border)] p-4">
                <p className="text-center text-xs text-[var(--cm-muted)]">
                  Connect with developers to start messaging them.
                </p>
              </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {activeEntry ? (
              <>
                <ChatHeader
                    title={activeEntry.displayName}
                    subtitle={activeEntry.isOnline ? "Online" : "Offline"}
                    avatarUrl={activeEntry.displayAvatar}
                    isGroup={false}
                    onClose={() => setSelectedOtherUserId(null)}
                    action={
                      activeConversationId ? (
                          <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={isMuted ? BellOff : Bell}
                              onClick={() => setMuted(!isMuted)}
                          >
                            {isMuted ? "Unmute" : "Mute"}
                          </Button>
                      ) : undefined
                    }
                />

                {!activeConversationId ? (
                    <MessageList messages={[]} currentUserId={currentUserId} userDirectory={{}} />
                ) : isLoadingMessages ? (
                    <div className="flex flex-1 items-center justify-center">
                      <Spinner size="lg" />
                    </div>
                ) : isMessagesError ? (
                    <div className="flex flex-1 items-center justify-center p-6">
                      <EmptyState
                          icon={AlertTriangle}
                          title="Couldn't load messages"
                          description={messagesError?.message || "Please try again."}
                      />
                    </div>
                ) : (
                    <MessageList
                        messages={messages}
                        currentUserId={currentUserId}
                        userDirectory={{
                          [activeEntry.otherUserId]: {
                            name: activeEntry.displayName,
                            avatarUrl: activeEntry.displayAvatar,
                          },
                        }}
                        hasMore={hasMoreMessages}
                        onLoadMore={isLoadingMore ? undefined : loadMoreMessages}
                        onEditMessage={editMessage}
                        onDeleteMessage={deleteMessage}
                    />
                )}

                <TypingIndicator typingUsers={typingNames} />

                {sendError && (
                    <p className="px-5 pb-1 text-xs text-[var(--cm-lavender)]">{sendError}</p>
                )}

                <MessageInput
                    onSend={handleSend}
                    onTyping={activeConversationId ? notifyTyping : undefined}
                    disabled={isStartingConversation}
                />
              </>
          ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                    icon={MessagesSquare}
                    title="No conversation selected"
                    description="Choose a connection from the list to start chatting."
                />
              </div>
          )}
        </div>
      </div>
  );
}