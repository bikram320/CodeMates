package com.codemates.social.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ConnectionRequestDto {
    @NotNull
    private UUID receiverUserId;
}