package com.codemates.contribution.exception;

public class RepositoryLinkNotFoundException extends RuntimeException {
    public RepositoryLinkNotFoundException(String message) {
        super(message);
    }
}
