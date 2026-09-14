package com.codemates.notification.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * Mirrors the shared ApiResponse<T> envelope {success, message, data} used by every
 * CodeMates service, so responses from project-service / messaging-service can be unwrapped.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class RemoteApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
