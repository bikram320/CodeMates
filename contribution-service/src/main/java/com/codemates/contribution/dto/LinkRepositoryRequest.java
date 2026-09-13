package com.codemates.contribution.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class LinkRepositoryRequest {

    @NotNull
    private UUID repositoryId;
}
