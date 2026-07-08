package com.codemates.githubsync.exception;

public class GithubApiException extends RuntimeException {
    public GithubApiException(String message) {
        super(message);
    }
}
