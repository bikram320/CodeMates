package com.codemates.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Wraps every message-related broadcast to /topic/conversations/{id} so the
 * client can distinguish a brand-new message from an edit or a delete
 * without needing separate subscriptions.
 */
@Data
@AllArgsConstructor
public class ConversationEvent {
    public enum EventType { MESSAGE_NEW, MESSAGE_EDITED, MESSAGE_DELETED }

    private EventType eventType;
    private MessageResponse message;
}
