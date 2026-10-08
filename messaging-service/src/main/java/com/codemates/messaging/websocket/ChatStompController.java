package com.codemates.messaging.websocket;

import com.codemates.messaging.dto.SendMessageRequest;
import com.codemates.messaging.dto.TypingBroadcast;
import com.codemates.messaging.dto.TypingEvent;
import com.codemates.messaging.model.Conversation;
import com.codemates.messaging.service.ConversationService;
import com.codemates.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * Client sends to:
 *   /app/conversations/{conversationId}/send    (body: SendMessageRequest)
 *   /app/conversations/{conversationId}/typing  (body: TypingEvent)
 *
 * Client subscribes to:
 *   /topic/conversations/{conversationId}          -> ConversationEvent (new/edited/deleted messages)
 *   /topic/conversations/{conversationId}/typing    -> TypingBroadcast
 *   /topic/presence                                 -> PresenceBroadcast
 *
 * REST is still available for initial history load (GET /api/conversations/{id}/messages)
 * and for edit/delete, which also broadcast over the same /topic/conversations/{id} channel.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final MessageService messageService;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/conversations/{conversationId}/send")
    public void send(@DestinationVariable UUID conversationId,
                      @Payload SendMessageRequest request,
                      Principal principal) {
        UUID senderUserId = currentUserId(principal);
        // sendMessage() itself validates access and broadcasts the new message
        messageService.sendMessage(senderUserId, conversationId, request);
    }

    @MessageMapping("/conversations/{conversationId}/typing")
    public void typing(@DestinationVariable UUID conversationId,
                        @Payload TypingEvent event,
                        Principal principal) {
        UUID userId = currentUserId(principal);

        // validate the user actually has access before broadcasting typing state
        Conversation conversation = conversationService.getActiveOrThrow(conversationId);
        conversationService.assertAccess(userId, conversation);

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId + "/typing",
                new TypingBroadcast(conversationId, userId, event.isTyping())
        );
    }

    private UUID currentUserId(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated WebSocket session");
        }
        return UUID.fromString(principal.getName());
    }

    /**
     * Without this, exceptions thrown inside @MessageMapping handlers (bad
     * access, invalid payload, etc.) are just logged server-side and the
     * client never finds out its send/typing frame failed. This routes the
     * error back to the sender only, on /user/queue/errors — client needs
     * to subscribe to that destination to see it.
     */
    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(Exception e) {
        log.warn("STOMP handler error: {}", e.getMessage());
        return e.getMessage();
    }
}
