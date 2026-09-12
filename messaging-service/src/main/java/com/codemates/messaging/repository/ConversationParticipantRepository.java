package com.codemates.messaging.repository;

import com.codemates.messaging.model.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {

    List<ConversationParticipant> findByConversationIdAndIsDeletedFalse(UUID conversationId);

    Optional<ConversationParticipant> findByConversationIdAndUserIdAndIsDeletedFalse(UUID conversationId, UUID userId);

    List<ConversationParticipant> findByUserIdAndIsDeletedFalse(UUID userId);

    boolean existsByConversationIdAndUserIdAndIsDeletedFalse(UUID conversationId, UUID userId);
}
