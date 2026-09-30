import { useState } from "react";
import { AlertTriangle, Bell, BellOff, MessagesSquare } from "lucide-react";

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

// ⚠️ Temporary display fallback. ConversationResponse/MessageResponse
// only ever carry raw UUIDs — never a name or avatar. Real resolution
// needs user-profile-service, which hasn't been provided yet — this is
// the same gap flagged for chat, contributions, and connections; whoever
// sends that file unblocks all four at once.
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
    startDirectConversation,
    isStartingConversation,
  } = useConversations();

  const directConversations = conversations.filter((c) => c.type === "DIRECT");

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newUserId, setNewUserId] = useState("");
  const [startError, setStartError] = useState(null);

  const enrichedConversations = directConversations.map((c) => {
    const otherParticipant = c.participants?.find((p) => p.userId !== currentUserId);
    const selfParticipant = c.participants?.find((p) => p.userId === currentUserId);
    const unread =
      !!c.lastMessageAt &&
      (!selfParticipant?.lastReadAt ||
        new Date(selfParticipant.lastReadAt) < new Date(c.lastMessageAt));

    return {
      ...c,
      displayName: shortLabel(otherParticipant?.userId),
      displayAvatar: null,
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

  async function handleStartConversation(e) {
    e.preventDefault();
    if (!newUserId.trim()) return;
    try {
      const conversation = await startDirectConversation(newUserId.trim());
      setActiveConversationId(conversation.id);
      setNewUserId("");
      setStartError(null);
    } catch (err) {
      setStartError(err.message);
    }
  }

  const typingNames = typingUserIds.filter((id) => id !== currentUserId).map(shortLabel);

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

        {/* Minimal "start a new conversation" affordance — pastes a
            user's UUID directly. There's no developer search/picker
            wired to this yet (that needs user-profile-service or
            discovery-service, neither provided). Once a real "Message"
            button exists on a developer's profile page, this becomes a
            fallback rather than the only entry point. */}
        <form
          onSubmit={handleStartConversation}
          className="flex flex-col gap-2 border-t border-[var(--cm-border)] p-3"
        >
          <input
            type="text"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="Start chat — paste a user ID"
            className="rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-xs text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] focus:border-[var(--cm-indigo)] focus:outline-none"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isStartingConversation}>
            {isStartingConversation ? "Starting..." : "Start Conversation"}
          </Button>
          {startError && <p className="text-xs text-[var(--cm-lavender)]">{startError}</p>}
        </form>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {activeConversation ? (
          <>
            <ChatHeader
              title={activeConversation.displayName}
              subtitle={activeConversation.isOnline ? "Online" : "Offline"}
              isGroup={false}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={isMuted ? BellOff : Bell}
                  onClick={() => setMuted(!isMuted)}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
              }
            />

            {isLoadingMessages ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner size="lg" />
              </div>
<<<<<<< Updated upstream
            ) : isMessagesError ? (
=======
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
              
                    action={
                      activeConversationId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={isMuted ? BellOff : Bell}
                            onClick={() => setMuted(!isMuted)}
                            className="cursor-pointer !bg-[#6366F1] !text-white hover:!bg-[#4F46E5] hover:!text-white"
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
>>>>>>> Stashed changes
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
                userDirectory={{}}
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