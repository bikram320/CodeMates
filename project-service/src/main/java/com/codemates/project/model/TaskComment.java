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
@Table(name = "task_comments")
public class TaskComment {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "author_user_id", nullable = false)
    private UUID authorUserId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "content", nullable = false, length = Integer.MAX_VALUE)
    private String content;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("false")
    @Column(name = "is_edited", nullable = false)
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    private Instant editedAt;

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