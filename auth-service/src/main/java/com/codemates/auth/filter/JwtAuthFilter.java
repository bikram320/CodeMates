package com.codemates.auth.filter;

import com.codemates.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        //  extract Authorization header
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // if no header or doesn't start with Bearer, skip this filter
        //    the request will hit SecurityConfig and be allowed or denied there
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        //  extract token from header
        String token = authHeader.substring(7);

        try {
            //  validate token
            if (jwtService.validateToken(token)) {

                // extract user info from token
                UUID userId = jwtService.extractUserId(token);
                String email = jwtService.extractEmail(token);

                //  only set authentication if not already set
                if (SecurityContextHolder.getContext().getAuthentication() == null) {

                    //  create authentication object
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,      // principal — who is this user
                                    null,        // credentials — we don't need password here
                                    new ArrayList<>()  // authorities — roles (empty for now)
                            );

                    //  attach request details to authentication
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    //  set authentication in security context
                    //    from this point Spring Security knows this request is authenticated
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT authenticated user: {} for path: {}",
                            email, request.getRequestURI());
                }
            }
        } catch (RuntimeException e) {
            // token is invalid — log it but don't throw
            // just let the request continue unauthenticated
            // SecurityConfig will reject it if the endpoint requires auth
            log.warn("JWT validation failed for path {}: {}",
                    request.getRequestURI(), e.getMessage());
        }

        //  always continue the filter chain
        filterChain.doFilter(request, response);
    }
}