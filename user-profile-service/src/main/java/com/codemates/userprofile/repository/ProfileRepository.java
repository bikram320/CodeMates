package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

  Optional<Profile> findByUserIdAndIsDeletedFalse(UUID userId);

  Optional<Profile> findByUsernameAndIsDeletedFalse(String username);

  boolean existsByUserIdAndIsDeletedFalse(UUID userId);

  boolean existsByUsernameAndIsDeletedFalse(String username);
}