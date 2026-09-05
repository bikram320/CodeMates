package com.codemates.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @jakarta.validation.constraints.Size(max = 255)
    @jakarta.validation.constraints.NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'TODO'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'MEDIUM'")
    @Column(name = "priority", nullable = false, length = 20)
    private String priority;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @ColumnDefault("0")
    @Column(name = "\"position\"")
    private Integer position;

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