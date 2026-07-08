package com.codemates.social.repository;

import com.codemates.social.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    Optional<Connection> findByIdAndIsDeletedFalse(UUID id);

    @Query("SELECT c FROM Connection c WHERE c.isDeleted = false AND " +
            "((c.senderUserId = :userId1 AND c.receiverUserId = :userId2) OR " +
            "(c.senderUserId = :userId2 AND c.receiverUserId = :userId1))")
    Optional<Connection> findBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    @Query("SELECT c FROM Connection c WHERE c.isDeleted = false AND c.status = 'ACCEPTED' AND " +
            "(c.senderUserId = :userId OR c.receiverUserId = :userId)")
    List<Connection> findAcceptedConnections(@Param("userId") UUID userId);

    List<Connection> findByReceiverUserIdAndStatusAndIsDeletedFalse(UUID receiverUserId, String status);
}