package com.codemates.githubsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepoContextResponseDto {
    private Integer stars;
    private Integer forks;
    private Integer subscribers;
    private List<String> topics;
    private String language;
}