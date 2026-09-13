package com.codemates.contribution.event.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Mirrors the Map published by MessageEventProducer.publishMessageSent:
 * {messageId, conversationId, conversationType, projectId, senderUserId}
 *
 * projectId is null for DIRECT conversations (Conversation.projectId is
 * nullable) — those are intentionally ignored for scoring, since only
 * PROJECT-type conversation participation should count.
 */
@Data
public class MessageSentEvent {
    private UUID messageId;
    private UUID conversationId;
    private String conversationType;
    private UUID projectId;
    private UUID senderUserId;
}
