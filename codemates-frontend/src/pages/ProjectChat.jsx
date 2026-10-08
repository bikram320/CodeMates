import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Bell, BellOff } from "lucide-react";

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
import { useProject } from "../hooks/useMyProjects";
import useUserDirectory from "../hooks/useUserDirectory";

// Fallback only for a participant whose profile lookup came back empty
// (deleted account, lookup failure, etc.) — not the primary path anymore.
function shortLabel(id) {
    return id ? `User ${id.slice(0, 8)}` : "Unknown";
}

/**
 * Project Chat page (/projects/:projectId/chat).
 *
 * A project has exactly one PROJECT-type conversation, created
 * automatically by the backend the moment the project is created
 * (ConversationService.ensureProjectConversation — idempotent, it will
 * never create a second one for the same project). There's nothing to
 * switch between here, which is why this page has no conversation
 * sidebar. See Messages.jsx for the page where switching between
 * conversations actually applies (your DIRECT conversations with other
 * developers).
 *
 * Fully real: message history, sending, typing, presence, edit, delete,
 * mute, and pagination all talk to the actual backend.
 */
export default function ProjectChat() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const currentUserId = user?.userId ?? null;

    const { project, isLoading: isLoadingProject } = useProject(projectId);

    const {
        conversations,
        isLoading: isLoadingConversations,
        isError: isConversationsError,
    } = useConversations();

    const projectConversation = conversations.find(
        (c) => c.type === "PROJECT" && c.projectId === projectId
    );

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
    } = useConversation(projectConversation?.id);

    const presence = usePresence();

    const participantIds = useMemo(
        () => (projectConversation?.participants ?? []).map((p) => p.userId),
        [projectConversation]
    );
    const { directory: profileDirectory } = useUserDirectory(participantIds);

    // MessageList expects { [userId]: { name, avatarUrl } } — useUserDirectory
    // returns { [userId]: { fullName, username, avatarUrl, ... } }, so this
    // reshapes rather than passing profiles straight through.
    const messageUserDirectory = useMemo(() => {
        const out = {};
        participantIds.forEach((id) => {
            const profile = profileDirectory[id];
            out[id] = {
                name: profile?.fullName || profile?.username || shortLabel(id),
                avatarUrl: profile?.avatarUrl,
            };
        });
        return out;
    }, [participantIds, profileDirectory]);

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
                title="Couldn't load this project's chat"
                description="Something went wrong. Please try again."
            />
        );
    }

    if (!projectConversation) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title="No chat found for this project"
                description="This project's conversation hasn't been created yet."
            />
        );
    }

    const onlineCount = (projectConversation.participants ?? []).filter(
        (p) => presence[p.userId] === "ONLINE"
    ).length;

    const selfParticipant = projectConversation.participants?.find(
        (p) => p.userId === currentUserId
    );
    const isMuted = selfParticipant?.isMuted ?? false;

    const typingNames = typingUserIds
        .filter((id) => id !== currentUserId)
        .map((id) => messageUserDirectory[id]?.name || shortLabel(id));

    return (
        <div className="project-chat-page flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] flex-col overflow-hidden rounded-lg border border-[var(--cm-border)]">
            <ChatHeader
                title={project?.name || (isLoadingProject ? "Loading…" : `Project ${projectId?.slice(0, 8)}`)}
                subtitle={`${projectConversation.participants?.length ?? 0} members · ${onlineCount} online`}
                isGroup
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
                    userDirectory={messageUserDirectory}
                    showSenderName
                    hasMore={hasMoreMessages}
                    onLoadMore={isLoadingMore ? undefined : loadMoreMessages}
                    onEditMessage={editMessage}
                    onDeleteMessage={deleteMessage}
                />
            )}

            <TypingIndicator typingUsers={typingNames} />

            <MessageInput onSend={(content) => sendMessage(content)} onTyping={notifyTyping} />
        </div>
    );
}