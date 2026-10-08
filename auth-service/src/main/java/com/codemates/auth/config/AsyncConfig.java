package com.codemates.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables @Async so EmailService can send mail on a background thread.
 * Put this in any package under com.codemates.auth (the package line must match the folder).
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}