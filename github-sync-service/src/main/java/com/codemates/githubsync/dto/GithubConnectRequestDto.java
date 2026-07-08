package com.codemates.githubsync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GithubConnectRequestDto {
    @NotBlank
    private String accessToken;
}