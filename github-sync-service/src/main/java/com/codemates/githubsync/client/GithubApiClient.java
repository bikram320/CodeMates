package com.codemates.githubsync.client;

import com.codemates.githubsync.dto.github.GithubRepoApiResponse;
import com.codemates.githubsync.dto.github.GithubUserApiResponse;
import com.codemates.githubsync.exception.GithubApiException;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GithubApiClient {

    private static final String BASE_URL = "https://api.github.com";
    private final RestTemplate restTemplate = new RestTemplate();
    private static final Pattern LAST_PAGE_PATTERN = Pattern.compile("page=(\\d+)>; rel=\"last\"");

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        return headers;
    }

    public GithubUserApiResponse fetchAuthenticatedUser(String token) {
        try {
            HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));
            ResponseEntity<GithubUserApiResponse> response = restTemplate.exchange(
                    BASE_URL + "/user", HttpMethod.GET, entity, GithubUserApiResponse.class);
            return response.getBody();
        } catch (Exception e) {
            throw new GithubApiException("Failed to fetch GitHub user: " + e.getMessage());
        }
    }

    public List<GithubRepoApiResponse> fetchUserRepos(String token) {
        try {
            HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));
            ResponseEntity<GithubRepoApiResponse[]> response = restTemplate.exchange(
                    BASE_URL + "/user/repos?per_page=100&sort=updated", HttpMethod.GET, entity, GithubRepoApiResponse[].class);
            return Arrays.asList(response.getBody() != null ? response.getBody() : new GithubRepoApiResponse[0]);
        } catch (Exception e) {
            throw new GithubApiException("Failed to fetch GitHub repos: " + e.getMessage());
        }
    }

    /**
     * Returns commit count for a repo, optionally filtered by "since" date (ISO-8601).
     * Uses per_page=1 + Link header trick: GitHub tells us the last page number,
     * which equals the total commit count when each page has exactly 1 item.
     */
    public int fetchCommitCount(String token, String repoFullName, String authorUsername, String sinceIso) {
        try {
            StringBuilder url = new StringBuilder(BASE_URL + "/repos/" + repoFullName + "/commits?per_page=1&author=" + authorUsername);
            if (sinceIso != null) {
                url.append("&since=").append(sinceIso);
            }
            HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));
            ResponseEntity<Object[]> response = restTemplate.exchange(
                    url.toString(), HttpMethod.GET, entity, Object[].class);

            List<String> linkHeaders = response.getHeaders().get("Link");
            if (linkHeaders != null && !linkHeaders.isEmpty()) {
                Matcher matcher = LAST_PAGE_PATTERN.matcher(linkHeaders.get(0));
                if (matcher.find()) {
                    return Integer.parseInt(matcher.group(1));
                }
            }
            // No Link header means 0 or 1 page total
            return response.getBody() != null ? response.getBody().length : 0;
        } catch (Exception e) {
            // Empty repos or repos with no commits by this author return 409/404 — treat as 0 instead of failing the whole sync
            return 0;
        }
    }
    /**
     * Returns the contributor count for a repo. Uses the same per_page=1 +
     * Link header trick as fetchCommitCount: GitHub's last-page number
     * equals the total count when each page has exactly 1 item.
     */
    public int fetchContributorsCount(String token, String repoFullName) {
        try {
            String url = BASE_URL + "/repos/" + repoFullName + "/contributors?per_page=1&anon=false";
            HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));
            ResponseEntity<Object[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Object[].class);

            List<String> linkHeaders = response.getHeaders().get("Link");
            if (linkHeaders != null && !linkHeaders.isEmpty()) {
                Matcher matcher = LAST_PAGE_PATTERN.matcher(linkHeaders.get(0));
                if (matcher.find()) {
                    return Integer.parseInt(matcher.group(1));
                }
            }
            return response.getBody() != null ? response.getBody().length : 0;
        } catch (Exception e) {
            // empty repos / repos with no accessible contributor data -> treat as 0, not a failure
            return 0;
        }
    }
}