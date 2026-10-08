package com.codemates.githubsync.dto.github;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

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

    @JsonProperty("open_issues_count")
    private Integer openIssuesCount;

    private Integer size; // GitHub returns this in KB already -- no conversion needed

    private GithubLicenseApiResponse license; // nullable -- GitHub returns null if no license detected

    @JsonProperty("created_at")
    private String createdAt;

    private List<String> topics; // e.g. ["machine-learning", "cli", "api"] -- nullable/empty if none tagged
}
