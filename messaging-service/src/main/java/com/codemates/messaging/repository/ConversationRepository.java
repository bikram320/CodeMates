package com.codemates.messaging.repository;

import com.codemates.messaging.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByIdAndIsDeletedFalse(UUID id);

    Optional<Conversation> findByProjectIdAndIsDeletedFalse(UUID projectId);

    /**
     * Finds an existing, non-deleted DIRECT conversation that has exactly
     * these two users as (non-deleted) participants. Used for find-or-create
     * on 1:1 chat start.
     */
    @Query("""
            SELECT c FROM Conversation c
            WHERE c.type = 'DIRECT'
              AND c.isDeleted = false
              AND c.id IN (
                  SELECT cp1.conversationId FROM ConversationParticipant cp1
                  WHERE cp1.userId = :userA AND cp1.isDeleted = false
              )
              AND c.id IN (
                  SELECT cp2.conversationId FROM ConversationParticipant cp2
                  WHERE cp2.userId = :userB AND cp2.isDeleted = false
              )
            """)
    Optional<Conversation> findDirectConversationBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
