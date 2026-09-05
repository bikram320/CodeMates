package com.codemates.discovery.repository;

import com.codemates.discovery.model.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, UUID> {

    List<SearchHistory> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID userId);
}
