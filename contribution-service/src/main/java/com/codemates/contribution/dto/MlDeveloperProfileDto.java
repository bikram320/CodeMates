package com.codemates.contribution.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * "developer" object inside one pair sent to ml-service's
 * /predict/contribution/batch. snake_case JSON keys via @JsonProperty --
 * ml-service (FastAPI/Pydantic) expects snake_case, Jackson defaults to
 * camelCase, so every field needs an explicit mapping or the request 422s.
 */
@Data
@Builder
public class MlDeveloperProfileDto {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("public_repos")
    private Integer publicRepos;

    @JsonProperty("public_gists")
    private Integer publicGists;

    private Integer followers;
    private Integer following;

    @JsonProperty("account_age_days")
    private Integer accountAgeDays;

    @JsonProperty("primary_language")
    private String primaryLanguage;
}
