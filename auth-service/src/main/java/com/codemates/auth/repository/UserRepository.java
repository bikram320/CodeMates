package com.codemates.auth.repository;

import com.codemates.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailAndIsDeletedFalse(String email);

    Optional<User> findByGithubIdAndIsDeletedFalse(String githubId);

    boolean existsByEmailAndIsDeletedFalse(String email);
}