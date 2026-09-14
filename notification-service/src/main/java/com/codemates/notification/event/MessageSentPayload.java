package com.codemates.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Mirrors MessageEventProducer's payload:
 * {messageId, conversationId, conversationType, projectId, senderUserId}.
 * No message `type` field on the source event (known gap per project notes - can't tell
 * TEXT/FILE/IMAGE apart), so the notification body is generic ("New message from...").
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MessageSentPayload {
    private UUID messageId;
    private UUID conversationId;
    private String conversationType; // "DIRECT" or "PROJECT"
    private UUID projectId; // null for DIRECT conversations
    private UUID senderUserId;
}
