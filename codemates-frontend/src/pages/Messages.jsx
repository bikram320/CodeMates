import { useState } from "react";
import { AlertTriangle, Bell, BellOff, MessagesSquare, X } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import TypingIndicator from "../components/chat/TypingIndicator";
import MessageInput from "../components/chat/MessageInput";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { useConversations } from "../hooks/useConversations";
import { useConversation } from "../hooks/useConversation";
import { usePresence } from "../hooks/usePresence";
import { useAuth } from "../hooks/useAuth";
import useUserDirectory from "../hooks/useUserDirectory";

// Last-resort label if a profile can't be resolved.
function shortLabel(id) {
  return id ? `User ${id.slice(0, 8)}` : "Unknown";
}

/**
 * Messages page (/messages) — the general inbox for DIRECT conversations
 * with other developers, independent of any project. Project team chat
 * lives at /projects/:projectId/chat instead (a project's one
 * conversation, no switching needed); this page is specifically for
 * conversations where switching between people genuinely applies.
 *
 * Fully real: conversation list, message history, sending, typing,
 * presence, edit, delete, mute, pagination, and starting a new direct
 * conversation all talk to the actual backend.
 */
export default function Messages() {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const presence = usePresence();

  const {
    conversations,
    isLoading: isLoadingConversations,
    isError: isConversationsError,
  } = useConversations();

  const directConversations = conversations.filter((c) => c.type === "DIRECT");

  // One batched lookup for everyone in every direct conversation (covers
  // message senders, typing users and the sidebar).
  const { directory } = useUserDirectory(
      directConversations.flatMap((c) => (c.participants ?? []).map((p) => p.userId))
  );
  const nameOf = (id) => directory[id]?.fullName?.trim() || directory[id]?.username || shortLabel(id);

  // Shape handed to MessageList (it previously received {}, hence the "?" avatars).
  const userDirectory = Object.fromEntries(
      Object.entries(directory).map(([id, p]) => [
        id,
        { id, name: nameOf(id), fullName: p.fullName, username: p.username, avatarUrl: p.avatarUrl },
      ])
  );

  const [activeConversationId, setActiveConversationId] = useState(null);

  const enrichedConversations = directConversations.map((c) => {
    const otherParticipant = c.participants?.find((p) => p.userId !== currentUserId);
    const selfParticipant = c.participants?.find((p) => p.userId === currentUserId);
    const unread =
        !!c.lastMessageAt &&
        (!selfParticipant?.lastReadAt ||
            new Date(selfParticipant.lastReadAt) < new Date(c.lastMessageAt));

    return {
      ...c,
      displayName: nameOf(otherParticipant?.userId),
      displayUsername: directory[otherParticipant?.userId]?.username,
      displayAvatar: directory[otherParticipant?.userId]?.avatarUrl ?? null,
      isGroup: false,
      isOnline: presence[otherParticipant?.userId] === "ONLINE",
      unread,
    };
  });

  const activeConversation = enrichedConversations.find((c) => c.id === activeConversationId);

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
  } = useConversation(activeConversation?.id);

  const typingNames = typingUserIds.filter((id) => id !== currentUserId).map(nameOf);

  if (isLoadingConversations) {
    return (
        <div className="flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
    );
  }

  if (isConversationsError) {
    return (
        <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your messages"
            description="Something went wrong. Please try again."
        />
    );
  }

  const isMuted = activeConversation?.participants?.find((p) => p.userId === currentUserId)?.isMuted ?? false;

  return (
      <div className="messages-page flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] overflow-hidden rounded-lg border border-[var(--cm-border)]">
        <div className="flex w-72 shrink-0 flex-col border-r border-[var(--cm-border)]">
          <ConversationList
              conversations={enrichedConversations}
              activeConversationId={activeConversationId}
              onSelect={setActiveConversationId}
              className="flex-1 border-r-0"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {activeConversation ? (
              <>
                <ChatHeader
                    title={activeConversation.displayName}
                    subtitle={`${activeConversation.displayUsername ? `@${activeConversation.displayUsername} · ` : ""}${
                        activeConversation.isOnline ? "Online" : "Offline"
                    }`}
                    avatarUrl={activeConversation.displayAvatar}
                    isGroup={false}
                    action={
                      <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={isMuted ? BellOff : Bell}
                            onClick={() => setMuted(!isMuted)}
                        >
                          {isMuted ? "Unmute" : "Mute"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => setActiveConversationId(null)}
                            aria-label="Close conversation"
                            title="Close conversation"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cm-indigo)]"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    }
                />

                {isLoadingMessages ? (
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
                        userDirectory={userDirectory}
                        hasMore={hasMoreMessages}
                        onLoadMore={isLoadingMore ? undefined : loadMoreMessages}
                        onEditMessage={editMessage}
                        onDeleteMessage={deleteMessage}
                    />
                )}

                <TypingIndicator typingUsers={typingNames} />

                <MessageInput onSend={(content) => sendMessage(content)} onTyping={notifyTyping} />
              </>
          ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                    icon={MessagesSquare}
                    title="No conversation selected"
                    description="Choose a conversation from the list, or start a new one."
                />
              </div>
          )}
        </div>
      </div>
  );
}