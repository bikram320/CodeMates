package com.codemates.notification.repository;

import com.codemates.notification.model.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserContactRepository extends JpaRepository<UserContact, UUID> {
    Optional<UserContact> findByUserIdAndIsDeletedFalse(UUID userId);
}
