package com.codemates.githubsync.dto.github;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubUserApiResponse {
    private String login;
    @JsonProperty("id")
    private Long githubId;
    @JsonProperty("avatar_url")
    private String avatarUrl;
    private String bio;
    @JsonProperty("public_repos")
    private Integer publicRepos;
    private Integer followers;
    private Integer following;
}