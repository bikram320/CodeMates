package com.codemates.messaging.model;

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
@Table(name = "conversations")
public class Conversation {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'DIRECT'")
    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "project_id")
    private UUID projectId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @jakarta.validation.constraints.Size(max = 255)
    @Column(name = "last_message_preview")
    private String lastMessagePreview;

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