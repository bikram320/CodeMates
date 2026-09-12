package com.codemates.messaging.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class StartDirectConversationRequest {

    @NotNull(message = "targetUserId is required")
    private UUID targetUserId;
}
