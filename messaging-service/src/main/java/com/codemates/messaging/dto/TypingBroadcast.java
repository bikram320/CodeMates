package com.codemates.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/** Outbound payload broadcast to /topic/conversations/{id}/typing */
@Data
@AllArgsConstructor
public class TypingBroadcast {
    private UUID conversationId;
    private UUID userId;
    private boolean typing;
}
