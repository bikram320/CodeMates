package com.codemates.messaging.exception;

public class UnauthorizedMessageActionException extends RuntimeException {
    public UnauthorizedMessageActionException(String message) {
        super(message);
    }
}
