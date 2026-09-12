package com.codemates.messaging.service;

import com.codemates.messaging.client.ProjectServiceClient;
import com.codemates.messaging.dto.ConversationResponse;
import com.codemates.messaging.dto.ParticipantSummary;
import com.codemates.messaging.exception.ConversationNotFoundException;
import com.codemates.messaging.exception.InvalidConversationStateException;
import com.codemates.messaging.exception.NotConversationParticipantException;
import com.codemates.messaging.model.Conversation;
import com.codemates.messaging.model.ConversationParticipant;
import com.codemates.messaging.repository.ConversationParticipantRepository;
import com.codemates.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ProjectServiceClient projectServiceClient;

    // ── DIRECT: find-or-create ───────────────────
    @Transactional
    public ConversationResponse startOrGetDirectConversation(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new InvalidConversationStateException("Cannot start a conversation with yourself");
        }

        Conversation conversation = conversationRepository
                .findDirectConversationBetween(currentUserId, targetUserId)
                .orElseGet(() -> createDirectConversation(currentUserId, targetUserId));

        return toResponse(conversation);
    }

    private Conversation createDirectConversation(UUID userA, UUID userB) {
        Conversation conversation = new Conversation();
        conversation.setType("DIRECT");
        conversation.setCreatedByUserId(userA);
        conversation.setIsDeleted(false);
        Conversation saved = conversationRepository.save(conversation);

        addParticipant(saved.getId(), userA);
        addParticipant(saved.getId(), userB);

        log.info("Created DIRECT conversation {} between {} and {}", saved.getId(), userA, userB);
        return saved;
    }

    // ── PROJECT: created via Kafka listener on project.created ──
    @Transactional
    public void ensureProjectConversation(UUID projectId, UUID ownerUserId) {
        if (conversationRepository.findByProjectIdAndIsDeletedFalse(projectId).isPresent()) {
            log.info("Project conversation for project {} already exists, skipping (idempotent)", projectId);
            return;
        }

        Conversation conversation = new Conversation();
        conversation.setType("PROJECT");
        conversation.setProjectId(projectId);
        conversation.setCreatedByUserId(ownerUserId);
        conversation.setIsDeleted(false);
        Conversation saved = conversationRepository.save(conversation);

        addParticipant(saved.getId(), ownerUserId);
        log.info("Created PROJECT conversation {} for project {}", saved.getId(), projectId);
    }

    @Transactional
    public void addProjectMemberToConversation(UUID projectId, UUID userId) {
        Conversation conversation = conversationRepository.findByProjectIdAndIsDeletedFalse(projectId)
                .orElseThrow(() -> new ConversationNotFoundException(
                        "No project conversation found for project " + projectId + " (project.created event may not have arrived yet)"));

        if (!participantRepository.existsByConversationIdAndUserIdAndIsDeletedFalse(conversation.getId(), userId)) {
            addParticipant(conversation.getId(), userId);
            log.info("Added user {} to project conversation {}", userId, conversation.getId());
        }
    }

    @Transactional
    public void removeProjectMemberFromConversation(UUID projectId, UUID userId) {
        conversationRepository.findByProjectIdAndIsDeletedFalse(projectId).ifPresent(conversation ->
                participantRepository.findByConversationIdAndUserIdAndIsDeletedFalse(conversation.getId(), userId)
                        .ifPresent(participant -> {
                            participant.setIsDeleted(true);
                            participant.setDeletedAt(Instant.now());
                            participantRepository.save(participant);
                            log.info("Removed user {} from project conversation {}", userId, conversation.getId());
                        }));
    }

    private void addParticipant(UUID conversationId, UUID userId) {
        ConversationParticipant participant = new ConversationParticipant();
        participant.setConversationId(conversationId);
        participant.setUserId(userId);
        participant.setIsMuted(false);
        participant.setIsDeleted(false);
        participantRepository.save(participant);
    }

    // ── LIST / GET ────────────────────────────────
    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(UUID userId) {
        List<UUID> conversationIds = participantRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(ConversationParticipant::getConversationId)
                .collect(Collectors.toList());

        return conversationRepository.findAllById(conversationIds).stream()
                .filter(c -> !c.getIsDeleted())
                .map(this::toResponse)
                .sorted(Comparator.comparing(
                        (ConversationResponse c) -> c.getLastMessageAt() != null ? c.getLastMessageAt() : c.getCreatedAt())
                        .reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID userId, UUID conversationId) {
        Conversation conversation = getActiveOrThrow(conversationId);
        assertAccess(userId, conversation);
        return toResponse(conversation);
    }

    // ── READ / MUTE ───────────────────────────────
    @Transactional
    public void markRead(UUID userId, UUID conversationId) {
        Conversation conversation = getActiveOrThrow(conversationId);
        assertAccess(userId, conversation);

        ConversationParticipant participant = participantRepository
                .findByConversationIdAndUserIdAndIsDeletedFalse(conversationId, userId)
                .orElseThrow(() -> new NotConversationParticipantException("Not a participant of this conversation"));
        participant.setLastReadAt(Instant.now());
        participantRepository.save(participant);
    }

    @Transactional
    public void setMuted(UUID userId, UUID conversationId, boolean muted) {
        Conversation conversation = getActiveOrThrow(conversationId);
        assertAccess(userId, conversation);

        ConversationParticipant participant = participantRepository
                .findByConversationIdAndUserIdAndIsDeletedFalse(conversationId, userId)
                .orElseThrow(() -> new NotConversationParticipantException("Not a participant of this conversation"));
        participant.setIsMuted(muted);
        participantRepository.save(participant);
    }

    // ── ACCESS CONTROL ─────────────────────────────
    /**
     * For DIRECT conversations, access is decided purely by the local
     * ConversationParticipant row. For PROJECT conversations, we call
     * project-service live on every access, per your workflow decision, so
     * a member removed from the project loses chat access immediately even
     * if the local participant row hasn't been cleaned up yet.
     */
    public void assertAccess(UUID userId, Conversation conversation) {
        if ("PROJECT".equals(conversation.getType())) {
            boolean isMember = projectServiceClient.isProjectMember(conversation.getProjectId(), userId);
            if (!isMember) {
                throw new NotConversationParticipantException("You are not a member of this project");
            }
            return;
        }

        boolean isParticipant = participantRepository
                .existsByConversationIdAndUserIdAndIsDeletedFalse(conversation.getId(), userId);
        if (!isParticipant) {
            throw new NotConversationParticipantException("Not a participant of this conversation");
        }
    }

    public Conversation getActiveOrThrow(UUID conversationId) {
        return conversationRepository.findByIdAndIsDeletedFalse(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException("Conversation not found: " + conversationId));
    }

    // ── MAPPING ────────────────────────────────────
    private ConversationResponse toResponse(Conversation c) {
        List<ParticipantSummary> participants = participantRepository
                .findByConversationIdAndIsDeletedFalse(c.getId()).stream()
                .map(p -> ParticipantSummary.builder()
                        .userId(p.getUserId())
                        .lastReadAt(p.getLastReadAt())
                        .isMuted(p.getIsMuted())
                        .build())
                .collect(Collectors.toList());

        return ConversationResponse.builder()
                .id(c.getId())
                .type(c.getType())
                .projectId(c.getProjectId())
                .createdByUserId(c.getCreatedByUserId())
                .lastMessageAt(c.getLastMessageAt())
                .lastMessagePreview(c.getLastMessagePreview())
                .participants(participants)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
