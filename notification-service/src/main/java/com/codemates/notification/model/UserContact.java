package com.codemates.notification.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.UUID;

/**
 * NEW ENTITY - designed by Claude, NOT DB-first (no source entity was provided for this).
 * Populated by consuming user.registered Kafka events. Exists so notification-service can
 * resolve a userId to an email + display name for outbound emails and notification titles
 * without calling auth-service directly on every notification.
 *
 * userId is the primary key (one row per user, upserted on every user.registered event —
 * in practice each user registers once, but upsert logic is idempotent against redelivery).
 */
@Getter
@Setter
@Entity
@Table(name = "user_contacts")
public class UserContact {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
