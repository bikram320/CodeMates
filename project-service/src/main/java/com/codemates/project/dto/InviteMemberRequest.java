package com.codemates.project.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class InviteMemberRequest {
    @NotNull
    private UUID invitedUserId;

    private String role; // defaults to CONTRIBUTOR if null
}
