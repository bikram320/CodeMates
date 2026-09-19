package com.codemates.auth.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

/**
 * Talks to GitHub's OAuth + REST API. Not wired to any Spring bean for
 * RestTemplate elsewhere in the project (none of the shared files showed
 * one), so this builds its own instance — swap for an injected bean if
 * auth-service already has a shared RestTemplate/WebClient config.
 */
@Slf4j
@Service
public class GithubOAuthService {

    @Value("${github.oauth.client-id}")
    private String clientId;

    @Value("${github.oauth.client-secret}")
    private String clientSecret;

    @Value("${github.oauth.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
    private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String USER_URL = "https://api.github.com/user";
    private static final String EMAILS_URL = "https://api.github.com/user/emails";

    public String buildAuthorizeUrl(String state) {
        return AUTHORIZE_URL
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&scope=read:user%20user:email"
                + "&state=" + state;
    }

    public String exchangeCodeForAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        ResponseEntity<GithubTokenResponse> response = restTemplate.postForEntity(
                TOKEN_URL, new HttpEntity<>(body, headers), GithubTokenResponse.class);

        if (response.getBody() == null || response.getBody().getAccessToken() == null) {
            throw new IllegalStateException("GitHub did not return an access token — the code may be invalid, expired, or already used");
        }
        return response.getBody().getAccessToken();
    }

    public GithubOAuthUserDto fetchGithubUser(String accessToken) {
        ResponseEntity<GithubOAuthUserDto> response = restTemplate.exchange(
                USER_URL, HttpMethod.GET, new HttpEntity<>(authHeaders(accessToken)), GithubOAuthUserDto.class);
        return response.getBody();
    }

    /** GitHub only returns a public `email` on /user if the user made it public — this is the fallback. */
    public String fetchPrimaryVerifiedEmail(String accessToken) {
        ResponseEntity<GithubEmailDto[]> response = restTemplate.exchange(
                EMAILS_URL, HttpMethod.GET, new HttpEntity<>(authHeaders(accessToken)), GithubEmailDto[].class);

        GithubEmailDto[] emails = response.getBody();
        if (emails == null) return null;

        return Arrays.stream(emails)
                .filter(GithubEmailDto::isPrimary)
                .filter(GithubEmailDto::isVerified)
                .map(GithubEmailDto::getEmail)
                .findFirst()
                .orElse(null);
    }

    private HttpHeaders authHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    // ── response DTOs (kept in this file to keep the patch small — split out if you prefer) ──

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GithubTokenResponse {
        @JsonProperty("access_token")
        private String accessToken;
        @JsonProperty("token_type")
        private String tokenType;
        private String scope;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GithubOAuthUserDto {
        private Long id;              // GitHub's numeric user id
        private String login;         // GitHub username
        private String name;          // display name, may be null
        private String email;         // only present if publicly set
        @JsonProperty("avatar_url")
        private String avatarUrl;
        private String bio;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GithubEmailDto {
        private String email;
        private boolean primary;
        private boolean verified;
    }
}