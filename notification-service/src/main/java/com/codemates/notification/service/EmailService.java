package com.codemates.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${notification.email.from}")
    private String fromAddress;

    /**
     * Fire-and-forget: failures are logged, not thrown, so a bad SMTP config or a transient
     * send failure never blocks or crashes the Kafka listener that triggered it. There is
     * currently no delivery-status tracking on the Notification entity (no emailSent/
     * emailSentAt column was in the DB-first entity), so a failed send is only visible in
     * logs right now - see README if you want that tracked.
     */
    @Async
    public void send(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Skipping email send - no email on file for recipient (subject: {})", subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {} (subject: {}): {}", toEmail, subject, e.getMessage(), e);
        }
    }
}
