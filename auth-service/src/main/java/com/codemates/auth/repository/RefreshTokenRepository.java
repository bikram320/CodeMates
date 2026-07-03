package com.codemates.auth.repository;

import com.codemates.auth.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHashAndIsDeletedFalse(String tokenHash);

    // used for logout from all devices
    @Modifying
    @Query("UPDATE RefreshToken r SET r.isRevoked = true, r.revokedAt = CURRENT_TIMESTAMP WHERE r.userId = :userId AND r.isRevoked = false")
    void revokeAllByUserId(UUID userId);
}