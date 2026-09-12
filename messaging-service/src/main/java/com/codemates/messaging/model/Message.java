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
@Table(name = "messages")
public class Message {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "sender_user_id", nullable = false)
    private UUID senderUserId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "content", nullable = false, length = Integer.MAX_VALUE)
    private String content;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'TEXT'")
    @Column(name = "message_type", nullable = false, length = 20)
    private String messageType;

    @jakarta.validation.constraints.Size(max = 500)
    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @jakarta.validation.constraints.Size(max = 255)
    @Column(name = "file_name")
    private String fileName;

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