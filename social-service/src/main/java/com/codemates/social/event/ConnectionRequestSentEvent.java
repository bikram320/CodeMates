package com.codemates.social.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionRequestSentEvent {
    private UUID connectionId;
    private UUID senderUserId;
    private UUID receiverUserId;
    private LocalDateTime timestamp;
}