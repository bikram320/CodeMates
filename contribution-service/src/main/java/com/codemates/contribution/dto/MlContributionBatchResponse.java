package com.codemates.contribution.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class MlContributionBatchResponse {
    private List<MlContributionResultDto> results;
}
