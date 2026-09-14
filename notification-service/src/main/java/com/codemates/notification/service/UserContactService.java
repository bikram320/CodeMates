package com.codemates.notification.service;

import com.codemates.notification.model.UserContact;
import com.codemates.notification.repository.UserContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserContactService {

    private final UserContactRepository userContactRepository;

    @Transactional
    public void upsert(UUID userId, String email, String username, String fullName) {
        UserContact contact = userContactRepository.findByUserIdAndIsDeletedFalse(userId)
                .orElseGet(UserContact::new);
        Instant now = Instant.now();
        boolean isNew = contact.getUserId() == null;
        contact.setUserId(userId);
        contact.setEmail(email);
        contact.setUsername(username);
        contact.setFullName(fullName);
        contact.setUpdatedAt(now);
        if (isNew) {
            contact.setCreatedAt(now);
        }
        userContactRepository.save(contact);
    }

    public Optional<UserContact> get(UUID userId) {
        return userContactRepository.findByUserIdAndIsDeletedFalse(userId);
    }

    /** Falls back to the userId's string form when no contact/name is on file yet. */
    public String displayNameOrFallback(UUID userId) {
        return get(userId)
                .map(c -> c.getFullName() != null && !c.getFullName().isBlank() ? c.getFullName() : c.getUsername())
                .filter(name -> name != null && !name.isBlank())
                .orElse("Someone");
    }
}
