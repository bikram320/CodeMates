package com.codemates.social.exception;

public class UnauthorizedConnectionActionException extends RuntimeException {
    public UnauthorizedConnectionActionException(String message) {
        super(message);
    }
}
