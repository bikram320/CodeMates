package com.codemates.githubsync.dto.github;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubLicenseApiResponse {
    private String key;       // e.g. "mit"
    private String name;      // e.g. "MIT License" -- matches your training data's license strings
    @JsonProperty("spdx_id")
    private String spdxId;
}