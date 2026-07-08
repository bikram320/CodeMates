package com.codemates.social.repository;

import com.codemates.social.model.ProfileView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProfileViewRepository extends JpaRepository<ProfileView, UUID> {
}