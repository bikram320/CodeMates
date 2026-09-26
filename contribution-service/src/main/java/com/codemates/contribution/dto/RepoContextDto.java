package com.codemates.contribution.dto;

import lombok.Data;

import java.util.List;

/**
 * Mirror of github-sync-service's RepoContextDto.
 */
@Data
public class RepoContextDto {
    private String repositoryId;
    private Integer stars;
    private Integer forks;
    private Integer subscribers;
    private List<String> topics;
    private String language;
}
