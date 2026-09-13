package com.codemates.contribution.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "contribution.points")
public class ScoringProperties {

    // Task completion points, scaled by priority
    private BigDecimal taskLow = BigDecimal.valueOf(5);
    private BigDecimal taskMedium = BigDecimal.valueOf(10);
    private BigDecimal taskHigh = BigDecimal.valueOf(20);
    private BigDecimal taskUrgent = BigDecimal.valueOf(30);

    // Points per new commit (diffed against last known total)
    private BigDecimal commit = BigDecimal.valueOf(3);

    // Points per project message, subject to the daily cap below
    private BigDecimal message = BigDecimal.valueOf(1);

    // Max message-points-worthy messages counted per user/project/day,
    // to stop spamming a project chat from inflating the score
    private int messageDailyCap = 20;

    public BigDecimal pointsForPriority(String priority) {
        if (priority == null) return taskMedium;
        return switch (priority.toUpperCase()) {
            case "LOW" -> taskLow;
            case "HIGH" -> taskHigh;
            case "URGENT" -> taskUrgent;
            default -> taskMedium;
        };
    }
}
