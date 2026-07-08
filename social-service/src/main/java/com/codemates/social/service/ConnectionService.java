package com.codemates.social.service;

import com.codemates.social.dto.ConnectionResponseDto;
import com.codemates.social.dto.ConnectionStatusResponseDto;
import com.codemates.social.dto.ConnectionSummaryDto;
import com.codemates.social.event.SocialEventProducer;
import com.codemates.social.exception.ConnectionAlreadyExistsException;
import com.codemates.social.exception.ConnectionNotFoundException;
import com.codemates.social.exception.InvalidConnectionStateException;
import com.codemates.social.exception.UnauthorizedConnectionActionException;
import com.codemates.social.model.Connection;
import com.codemates.social.repository.ConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final SocialEventProducer eventProducer;

    @Transactional
    public ConnectionResponseDto sendRequest(UUID senderUserId, UUID receiverUserId) {
        if (senderUserId.equals(receiverUserId)) {
            throw new InvalidConnectionStateException("You cannot send a connection request to yourself");
        }

        connectionRepository.findBetweenUsers(senderUserId, receiverUserId).ifPresent(existing -> {
            if (!"REJECTED".equals(existing.getStatus())) {
                throw new ConnectionAlreadyExistsException(
                        "A connection already exists between these users with status: " + existing.getStatus());
            }
        });

        Connection connection = new Connection();
        connection.setSenderUserId(senderUserId);
        connection.setReceiverUserId(receiverUserId);
        connection.setStatus("PENDING");
        connection.setIsDeleted(false);

        Connection saved = connectionRepository.save(connection);
        eventProducer.publishConnectionRequestSent(saved.getId(), senderUserId, receiverUserId);

        return toDto(saved);
    }

    @Transactional
    public ConnectionResponseDto acceptRequest(UUID connectionId, UUID currentUserId) {
        Connection connection = getActiveOrThrow(connectionId);

        if (!connection.getReceiverUserId().equals(currentUserId)) {
            throw new UnauthorizedConnectionActionException("Only the receiver can accept this request");
        }
        if (!"PENDING".equals(connection.getStatus())) {
            throw new InvalidConnectionStateException("Only pending requests can be accepted");
        }

        connection.setStatus("ACCEPTED");
        connection.setRespondedAt(LocalDateTime.now());
        Connection saved = connectionRepository.save(connection);

        eventProducer.publishConnectionAccepted(saved.getId(), saved.getSenderUserId(), saved.getReceiverUserId());

        return toDto(saved);
    }

    @Transactional
    public ConnectionResponseDto rejectRequest(UUID connectionId, UUID currentUserId) {
        Connection connection = getActiveOrThrow(connectionId);

        if (!connection.getReceiverUserId().equals(currentUserId)) {
            throw new UnauthorizedConnectionActionException("Only the receiver can reject this request");
        }
        if (!"PENDING".equals(connection.getStatus())) {
            throw new InvalidConnectionStateException("Only pending requests can be rejected");
        }

        connection.setStatus("REJECTED");
        connection.setRespondedAt(LocalDateTime.now());
        return toDto(connectionRepository.save(connection));
    }

    @Transactional
    public ConnectionResponseDto blockUser(UUID connectionId, UUID currentUserId) {
        Connection connection = getActiveOrThrow(connectionId);

        if (!connection.getSenderUserId().equals(currentUserId) && !connection.getReceiverUserId().equals(currentUserId)) {
            throw new UnauthorizedConnectionActionException("You are not part of this connection");
        }

        connection.setStatus("BLOCKED");
        connection.setRespondedAt(LocalDateTime.now());
        return toDto(connectionRepository.save(connection));
    }

    @Transactional
    public void removeConnection(UUID connectionId, UUID currentUserId) {
        Connection connection = getActiveOrThrow(connectionId);

        if (!connection.getSenderUserId().equals(currentUserId) && !connection.getReceiverUserId().equals(currentUserId)) {
            throw new UnauthorizedConnectionActionException("You are not part of this connection");
        }

        connection.setIsDeleted(true);
        connection.setDeletedAt(LocalDateTime.now());
        connectionRepository.save(connection);
    }

    public List<ConnectionSummaryDto> getMyConnections(UUID currentUserId) {
        return connectionRepository.findAcceptedConnections(currentUserId).stream()
                .map(c -> ConnectionSummaryDto.builder()
                        .connectionId(c.getId())
                        .otherUserId(c.getSenderUserId().equals(currentUserId) ? c.getReceiverUserId() : c.getSenderUserId())
                        .connectedSince(c.getRespondedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ConnectionResponseDto> getPendingRequests(UUID currentUserId) {
        return connectionRepository.findByReceiverUserIdAndStatusAndIsDeletedFalse(currentUserId, "PENDING")
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ConnectionStatusResponseDto getConnectionStatus(UUID currentUserId, UUID otherUserId) {
        return connectionRepository.findBetweenUsers(currentUserId, otherUserId)
                .map(c -> ConnectionStatusResponseDto.builder().status(c.getStatus()).build())
                .orElse(ConnectionStatusResponseDto.builder().status("NONE").build());
    }

    private Connection getActiveOrThrow(UUID connectionId) {
        return connectionRepository.findByIdAndIsDeletedFalse(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException("Connection not found: " + connectionId));
    }

    private ConnectionResponseDto toDto(Connection c) {
        return ConnectionResponseDto.builder()
                .id(c.getId())
                .senderUserId(c.getSenderUserId())
                .receiverUserId(c.getReceiverUserId())
                .status(c.getStatus())
                .respondedAt(c.getRespondedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}