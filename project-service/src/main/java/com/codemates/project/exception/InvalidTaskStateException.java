package com.codemates.project.exception;

public class InvalidTaskStateException extends RuntimeException {
    public InvalidTaskStateException(String message) { super(message); }
}
