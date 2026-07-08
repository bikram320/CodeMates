package com.codemates.social.dto;

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
public class ConnectionResponseDto {
    private UUID id;
    private UUID senderUserId;
    private UUID receiverUserId;
    private String status;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
}