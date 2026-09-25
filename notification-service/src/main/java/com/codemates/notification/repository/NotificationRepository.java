package com.codemates.notification.repository;

import com.codemates.notification.model.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // First page - no cursor
    @Query("""
        SELECT n
        FROM Notification n
        WHERE n.recipientUserId = :userId
          AND n.isDeleted = false
          AND (:unreadOnly = false OR n.isRead = false)
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findPage(
            @Param("userId") UUID userId,
            @Param("unreadOnly") boolean unreadOnly,
            Pageable pageable
    );

    // Next pages - cursor is provided
    @Query("""
        SELECT n
        FROM Notification n
        WHERE n.recipientUserId = :userId
          AND n.isDeleted = false
          AND n.createdAt < :before
          AND (:unreadOnly = false OR n.isRead = false)
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findPageBefore(
            @Param("userId") UUID userId,
            @Param("before") Instant before,
            @Param("unreadOnly") boolean unreadOnly,
            Pageable pageable
    );

    long countByRecipientUserIdAndIsReadFalseAndIsDeletedFalse(
            UUID recipientUserId
    );

    Optional<Notification> findByIdAndIsDeletedFalse(
            UUID id
    );

    List<Notification> findByRecipientUserIdAndIsReadFalseAndIsDeletedFalse(
            UUID recipientUserId
    );

    @Modifying
    @Query("""
        UPDATE Notification n
        SET n.isRead = true,
            n.readAt = :now,
            n.updatedAt = :now
        WHERE n.recipientUserId = :userId
          AND n.isRead = false
          AND n.isDeleted = false
        """)
    int markAllAsRead(
            @Param("userId") UUID userId,
            @Param("now") Instant now
    );
}