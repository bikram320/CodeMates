package com.codemates.social.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.ColumnDefault;
import java.time.LocalDateTime;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "profile_views")
public class ProfileView {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "viewer_user_id", nullable = false)
    private UUID viewerUserId;

    @NotNull
    @Column(name = "viewed_user_id", nullable = false)
    private UUID viewedUserId;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}