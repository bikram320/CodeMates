import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { useProjectChat } from "../hooks/useProjectChat";
import { useAuth } from "../hooks/useAuth";

// ⚠️ Temporary display fallback. ConversationResponse/MessageResponse
// only ever carry raw UUIDs — never a name, avatar, or project title.
// useAuth() resolves WHO you are (userId) via UserInfoResponse, but that
// DTO has no name/avatar either — real name/avatar resolution still
// needs project-service (project name) and user-profile-service (person
// names/avatars), neither provided yet.
function shortLabel(id) {
  return id ? `User ${id.slice(0, 8)}` : "Unknown";
}

/**
 * Project Chat page (/projects/:projectId/chat).
 *
 * Fully connected to the real backend for everything REST can do
 * (conversation list, history, edit, delete). Sending is disabled with
 * a visible message rather than silently doing nothing — see
 * hooks/useProjectChat.js for why.
 */
export default function ProjectChat() {
  const { projectId } = useParams();
  const [sendError, setSendError] = useState(null);
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;

  const {
    conversations,
    isLoadingConversations,
    isConversationsError,
    activeConversationId,
    setActiveConversationId,
    messages,
    isLoadingMessages,
    isMessagesError,
    messagesError,
    sendMessage,
  } = useProjectChat(projectId);

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
        title="Couldn't load conversations"
        description="Something went wrong loading this project's chat. Please try again."
      />
    );
  }

  const enrichedConversations = conversations.map((conversation) => {
    const selfParticipant = conversation.participants?.find(
      (p) => p.userId === currentUserId
    );
    const otherParticipant = conversation.participants?.find(
      (p) => p.userId !== currentUserId
    );

    const unread =
      !!conversation.lastMessageAt &&
      (!selfParticipant?.lastReadAt ||
        new Date(selfParticipant.lastReadAt) < new Date(conversation.lastMessageAt));

    return {
      ...conversation,
      displayName:
        conversation.type === "PROJECT"
          ? `Project ${conversation.projectId?.slice(0, 8)}`
          : shortLabel(otherParticipant?.userId),
      displayAvatar: null,
      isGroup: conversation.type === "PROJECT",
      isOnline: false, // presence isn't wired up yet — needs the WebSocket /topic/presence subscription
      unread,
    };
  });

  const activeConversation = enrichedConversations.find(
    (c) => c.id === activeConversationId
  );

  // Empty until user-profile-service is available to resolve names/avatars.
  const userDirectory = {};

  function handleSend(content) {
    try {
      sendMessage(content);
      setSendError(null);
    } catch (err) {
      setSendError(err.message);
    }
  }

  return (
    <div className="project-chat-page flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] overflow-hidden rounded-lg border border-[var(--cm-border)]">
      <ConversationList
        conversations={enrichedConversations}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        className="hidden w-72 shrink-0 sm:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {activeConversation && (
          <ChatHeader
            title={activeConversation.displayName}
            subtitle={
              activeConversation.isGroup
                ? `${activeConversation.participants?.length ?? 0} members`
                : undefined
            }
            avatarUrl={activeConversation.displayAvatar}
            isGroup={activeConversation.isGroup}
          />
        )}

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
          />
        )}

        {sendError && (
          <p className="px-5 pb-2 text-xs text-[var(--cm-lavender)]">{sendError}</p>
        )}

        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}