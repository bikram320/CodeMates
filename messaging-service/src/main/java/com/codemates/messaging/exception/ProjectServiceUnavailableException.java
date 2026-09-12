package com.codemates.messaging.exception;

public class ProjectServiceUnavailableException extends RuntimeException {
    public ProjectServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
