package com.codemates.githubsync.exception;

public class GithubProfileNotFoundException extends RuntimeException {
    public GithubProfileNotFoundException(String message) {
        super(message);
    }
}
