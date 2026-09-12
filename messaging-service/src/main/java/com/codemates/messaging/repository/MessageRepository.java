package com.codemates.messaging.repository;

import com.codemates.messaging.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Optional<Message> findByIdAndIsDeletedFalse(UUID id);

    List<Message> findByConversationIdAndIsDeletedFalseAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID conversationId, Instant before, Pageable pageable);

    List<Message> findByConversationIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);
}
