package com.codemates.messaging.service;

import com.codemates.messaging.dto.*;
import com.codemates.messaging.event.MessageEventProducer;
import com.codemates.messaging.exception.MessageNotFoundException;
import com.codemates.messaging.exception.UnauthorizedMessageActionException;
import com.codemates.messaging.model.Conversation;
import com.codemates.messaging.model.Message;
import com.codemates.messaging.repository.ConversationRepository;
import com.codemates.messaging.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
public class MessageService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;
    private static final List<String> VALID_MESSAGE_TYPES = List.of("TEXT", "FILE", "IMAGE", "SYSTEM");

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final MessageEventProducer eventProducer;
    private final SimpMessagingTemplate messagingTemplate;

    // ── SEND ───────────────────────────────────────
    @Transactional
    public MessageResponse sendMessage(UUID senderUserId, UUID conversationId, SendMessageRequest request) {
        Conversation conversation = conversationService.getActiveOrThrow(conversationId);
        conversationService.assertAccess(senderUserId, conversation);

        String messageType = request.getMessageType() != null ? request.getMessageType().toUpperCase() : "TEXT";
        if (!VALID_MESSAGE_TYPES.contains(messageType)) {
            throw new IllegalArgumentException("Invalid messageType: " + messageType);
        }

        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderUserId(senderUserId);
        message.setContent(request.getContent());
        message.setMessageType(messageType);
        message.setFileUrl(request.getFileUrl());
        message.setFileName(request.getFileName());
        message.setIsEdited(false);
        message.setIsDeleted(false);

        Message saved = messageRepository.save(message);

        // denormalized preview on the conversation, for the inbox list
        conversation.setLastMessageAt(saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now());
        conversation.setLastMessagePreview(preview(saved.getContent()));
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        MessageResponse response = toResponse(saved);
        broadcast(conversationId, ConversationEvent.EventType.MESSAGE_NEW, response);
        eventProducer.publishMessageSent(saved.getId(), conversation, senderUserId);

        return response;
    }

    // ── EDIT ───────────────────────────────────────
    @Transactional
    public MessageResponse editMessage(UUID userId, UUID messageId, EditMessageRequest request) {
        Message message = getActiveOrThrow(messageId);
        if (!message.getSenderUserId().equals(userId)) {
            throw new UnauthorizedMessageActionException("Only the sender can edit this message");
        }

        message.setContent(request.getContent());
        message.setIsEdited(true);
        message.setEditedAt(Instant.now());
        Message saved = messageRepository.save(message);

        MessageResponse response = toResponse(saved);
        broadcast(saved.getConversationId(), ConversationEvent.EventType.MESSAGE_EDITED, response);
        return response;
    }

    // ── DELETE (soft) ────────────────────────────────
    @Transactional
    public void deleteMessage(UUID userId, UUID messageId) {
        Message message = getActiveOrThrow(messageId);

        Conversation conversation = conversationService.getActiveOrThrow(message.getConversationId());
        boolean isSender = message.getSenderUserId().equals(userId);
        boolean isProjectLeaderContext = "PROJECT".equals(conversation.getType());
        // Sender can always delete their own message. For project chats we
        // don't have role info locally, so leader-or-sender enforcement for
        // moderation is left as a follow-up if you want it; for now: sender-only.
        if (!isSender) {
            throw new UnauthorizedMessageActionException("Only the sender can delete this message");
        }

        message.setIsDeleted(true);
        message.setDeletedAt(Instant.now());
        Message saved = messageRepository.save(message);

        broadcast(saved.getConversationId(), ConversationEvent.EventType.MESSAGE_DELETED, toResponse(saved));
    }

    // ── HISTORY (cursor-paginated, newest first) ─────
    @Transactional(readOnly = true)
    public MessagePageResponse getHistory(UUID userId, UUID conversationId, Instant before, Integer limit) {
        Conversation conversation = conversationService.getActiveOrThrow(conversationId);
        conversationService.assertAccess(userId, conversation);

        int pageSize = (limit == null || limit <= 0) ? DEFAULT_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE);
        // fetch one extra row to know if there's more without a separate count query
        Pageable pageable = PageRequest.of(0, pageSize + 1);

        List<Message> messages = (before != null)
                ? messageRepository.findByConversationIdAndIsDeletedFalseAndCreatedAtBeforeOrderByCreatedAtDesc(
                        conversationId, before, pageable)
                : messageRepository.findByConversationIdAndIsDeletedFalseOrderByCreatedAtDesc(conversationId, pageable);

        boolean hasMore = messages.size() > pageSize;
        List<Message> page = hasMore ? messages.subList(0, pageSize) : messages;

        List<MessageResponse> ordered = page.stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(MessageResponse::getCreatedAt))
                .collect(Collectors.toList());

        return MessagePageResponse.builder().messages(ordered).hasMore(hasMore).build();
    }

    // ── HELPERS ──────────────────────────────────────
    private Message getActiveOrThrow(UUID messageId) {
        return messageRepository.findByIdAndIsDeletedFalse(messageId)
                .orElseThrow(() -> new MessageNotFoundException("Message not found: " + messageId));
    }

    private void broadcast(UUID conversationId, ConversationEvent.EventType type, MessageResponse message) {
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId,
                new ConversationEvent(type, message)
        );
    }

    private String preview(String content) {
        if (content == null) return null;
        return content.length() > 120 ? content.substring(0, 120) + "…" : content;
    }

    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderUserId(m.getSenderUserId())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .isEdited(m.getIsEdited())
                .editedAt(m.getEditedAt())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
