package com.codemates.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.from-name:CodeMates}")
    private String fromName;

    @Value("${frontend.reset-password-url}")
    private String resetPasswordUrl;

    /**
     * Sends the password reset email.
     * Runs on a background thread (@Async) so the HTTP response is not delayed by SMTP,
     * and so response time does not reveal whether the email is registered.
     * Failures are logged and swallowed on purpose: the caller must always return the same
     * generic response.
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String token, long ttlMinutes) {
        try {
            String link = resetPasswordUrl + "?token="
                    + URLEncoder.encode(token, StandardCharsets.UTF_8);

            String plain = "We received a request to reset your CodeMates password.\n\n"
                    + "Open this link to choose a new password:\n"
                    + link + "\n\n"
                    + "This link expires in " + ttlMinutes + " minutes. "
                    + "If you did not request this, you can ignore this email.";

            String html = """
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
                      <h2>Reset your password</h2>
                      <p>We received a request to reset the password for your CodeMates account.</p>
                      <p>
                        <a href="%s"
                           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;">
                          Reset password
                        </a>
                      </p>
                      <p>This link expires in %d minutes. If you did not request this, you can ignore this email.</p>
                      <p style="color:#6b7280;font-size:12px;">
                        If the button does not work, copy this link into your browser:<br>%s
                      </p>
                    </div>
                    """.formatted(link, ttlMinutes, link);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Reset your CodeMates password");
            helper.setText(plain, html);

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
        }
    }
}