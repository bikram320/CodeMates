package com.codemates.messaging.dto;

import lombok.Data;

/** Inbound payload from a client sending to /app/conversations/{id}/typing */
@Data
public class TypingEvent {
    private boolean typing;
}
