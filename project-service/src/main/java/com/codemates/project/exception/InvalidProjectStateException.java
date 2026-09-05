package com.codemates.project.exception;

public class InvalidProjectStateException extends RuntimeException {
    public InvalidProjectStateException(String message) { super(message); }
}
