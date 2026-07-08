package com.codemates.githubsync.dto.github;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubRepoApiResponse {
    private String name;
    @JsonProperty("full_name")
    private String fullName;
    @JsonProperty("html_url")
    private String htmlUrl;
    private String description;
    private String language;
    @JsonProperty("stargazers_count")
    private Integer stargazersCount;
    @JsonProperty("forks_count")
    private Integer forksCount;
    @JsonProperty("private")
    private Boolean isPrivate;
    private Boolean fork;
    @JsonProperty("pushed_at")
    private String pushedAt;
}