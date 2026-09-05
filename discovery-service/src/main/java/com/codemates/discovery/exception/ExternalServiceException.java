package com.codemates.discovery.exception;

/**
 * Thrown when a call to another microservice (e.g. user-profile-service)
 * fails or is unreachable.
 */
public class ExternalServiceException extends RuntimeException {
    public ExternalServiceException(String message) { super(message); }
    public ExternalServiceException(String message, Throwable cause) { super(message, cause); }
}
