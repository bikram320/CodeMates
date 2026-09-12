package com.codemates.messaging.exception;

public class InvalidConversationStateException extends RuntimeException {
    public InvalidConversationStateException(String message) {
        super(message);
    }
}
