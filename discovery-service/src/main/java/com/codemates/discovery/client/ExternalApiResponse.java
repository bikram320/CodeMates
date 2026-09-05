package com.codemates.discovery.client;

import lombok.Data;

/**
 * Mirrors the {success, message, data} shape every CodeMates service
 * wraps its responses in — used only to deserialize responses coming
 * back from other services (e.g. user-profile-service).
 */
@Data
public class ExternalApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
