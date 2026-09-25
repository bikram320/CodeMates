package com.codemates.notification.service;

import com.codemates.notification.dto.NotificationPageResponse;
import com.codemates.notification.dto.NotificationResponse;
import com.codemates.notification.exception.ResourceNotFoundException;
import com.codemates.notification.exception.UnauthorizedAccessException;
import com.codemates.notification.model.Notification;
import com.codemates.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final UserContactService userContactService;

    /**
     * Creates and persists the in-app notification. If sendEmail is true, also fires an
     * email using whatever address is on file in UserContact (silently skipped if we don't
     * have one yet - e.g. the recipient registered before notification-service existed and
     * the user.registered backfill hasn't reached them).
     */
    @Transactional
    public Notification create(UUID recipientUserId, UUID senderUserId, String type, String title,
                                String body, UUID referenceId, String referenceType, boolean sendEmail) {
        Instant now = Instant.now();
        Notification notification = new Notification();
        notification.setRecipientUserId(recipientUserId);
        notification.setSenderUserId(senderUserId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setIsRead(false);
        notification.setIsDeleted(false);
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);
        Notification saved = notificationRepository.save(notification);

        if (sendEmail) {
            String email = userContactService.get(recipientUserId).map(c -> c.getEmail()).orElse(null);
            emailService.send(email, title, body);
        }

        return saved;
    }

    public NotificationPageResponse getPage(
            UUID userId,
            Instant before,
            int limit,
            boolean unreadOnly
    ) {
        List<Notification> results;

        PageRequest pageRequest = PageRequest.of(0, limit + 1);

        if (before == null) {
            results = notificationRepository.findPage(
                    userId,
                    unreadOnly,
                    pageRequest
            );
        } else {
            results = notificationRepository.findPageBefore(
                    userId,
                    before,
                    unreadOnly,
                    pageRequest
            );
        }

        boolean hasMore = results.size() > limit;

        List<Notification> page = hasMore
                ? results.subList(0, limit)
                : results;

        Instant nextCursor = hasMore
                ? page.get(page.size() - 1).getCreatedAt()
                : null;

        return NotificationPageResponse.builder()
                .notifications(
                        page.stream()
                                .map(NotificationResponse::from)
                                .collect(Collectors.toList())
                )
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .build();
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalseAndIsDeletedFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID requestingUserId) {
        Notification notification = notificationRepository.findByIdAndIsDeletedFalse(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getRecipientUserId().equals(requestingUserId)) {
            throw new UnauthorizedAccessException("This notification does not belong to you");
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(Instant.now());
            notification.setUpdatedAt(Instant.now());
            notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId, Instant.now());
    }

    @Transactional
    public void delete(UUID notificationId, UUID requestingUserId) {
        Notification notification = notificationRepository.findByIdAndIsDeletedFalse(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getRecipientUserId().equals(requestingUserId)) {
            throw new UnauthorizedAccessException("This notification does not belong to you");
        }

        notification.setIsDeleted(true);
        notification.setDeletedAt(Instant.now());
        notification.setUpdatedAt(Instant.now());
        notificationRepository.save(notification);
    }
}
