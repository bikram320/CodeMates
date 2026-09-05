package com.codemates.discovery.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "search_history")
public class SearchHistory {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @jakarta.validation.constraints.Size(max = 255)
    @Column(name = "search_query")
    private String searchQuery;

    @Column(name = "filters_used")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> filtersUsed;

    @ColumnDefault("0")
    @Column(name = "results_count")
    private Integer resultsCount;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}