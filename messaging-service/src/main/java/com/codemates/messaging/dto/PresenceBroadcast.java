package com.codemates.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/** Outbound payload broadcast to /topic/presence */
@Data
@AllArgsConstructor
public class PresenceBroadcast {
    private UUID userId;
    private String status; // ONLINE | OFFLINE
}
