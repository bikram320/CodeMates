package com.codemates.contribution.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MlContributionBatchRequest {
    private List<MlContributionPairDto> pairs;
}
