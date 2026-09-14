package com.codemates.notification.model;

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
@Table(name = "notifications")
public class Notification {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Column(name = "sender_user_id")
    private UUID senderUserId;

    @jakarta.validation.constraints.Size(max = 50)
    @jakarta.validation.constraints.NotNull
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @jakarta.validation.constraints.Size(max = 255)
    @jakarta.validation.constraints.NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @jakarta.validation.constraints.NotNull
    @Column(name = "body", nullable = false, length = Integer.MAX_VALUE)
    private String body;

    @Column(name = "reference_id")
    private UUID referenceId;

    @jakarta.validation.constraints.Size(max = 50)
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("false")
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

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
