# api-gateway

Single entry point for all 9 CodeMates services. Spring Cloud Gateway
Server WebFlux, reactive, on port 8080.

## What's new / not DB-first
Nothing DB-related — this module has no entities. Everything here is
new code (no existing files to preserve).

## ⚠️ Action required before this runs

1. **Fix `JwtCookieExtractor` in every service that has a copy.**
   `AuthController` sets the cookie as `access_token` (snake_case). Every
   `JwtCookieExtractor` I've seen (social-service, at minimum) reads
   `accessToken` (camelCase) — a mismatch that means
   `extractUserId()` currently always throws
   `"No access token cookie found"`, in every service, regardless of the
   gateway. This isn't something the gateway can fix for you — it's baked
   into each service's copy of the class. The gateway's own
   `JwtValidator`/`JwtAuthenticationGlobalFilter` already use the correct
   `access_token` name.

2. **Set real values in `application.properties`:**
   - `jwt.secret` — same value as every other service, byte-for-byte.
   - `spring.data.redis.host` / `port` — confirmed same Redis instance as
     the other services; defaults to `localhost:6379`.

3. **Confirm messaging-service's REST path.** Route `messaging-service-rest`
   currently matches both `/api/messages/**` and `/api/conversations/**`
   because I don't have the real `@RequestMapping` and the module notes
   ("conversation list/get/read/mute") suggest the real base path might be
   `/api/conversations`, not `/api/messages` as your original config had
   it. Trim whichever prefix doesn't actually exist once you check the
   controller.

## Design decisions made per your answers

- **JWT: gateway validates AND passes through.** The
  `JwtAuthenticationGlobalFilter` rejects requests with a missing/invalid
  `access_token` cookie before they ever reach a backend service (401,
  fail-fast at the edge) — but the cookie itself is left untouched on the
  proxied request, so every service's own `JwtCookieExtractor` still runs
  and validates independently too. Belt and suspenders, not a replacement
  for existing per-service checks.
- **Rate limiting: Redis-backed**, via `RequestRateLimiter` as a
  `default-filter` (applies to every route). Keyed by resolved userId
  (`X-User-Id` header, set by the JWT filter) when authenticated, or
  remote IP for public endpoints like `/api/auth/login` — 20 req/sec
  sustained, burst 40. These numbers are placeholders; tune after real
  load testing.
- **WebSocket: gateway proxies it.** Route `messaging-service-ws` matches
  `/ws/**` with a `ws://` scheme URI, so Spring Cloud Gateway's
  WebSocket routing filter handles the STOMP upgrade automatically — no
  custom code needed for that part. The JWT filter still runs on the
  handshake request first (same 401-before-proxy behavior as REST
  routes), on top of messaging-service's own `JwtHandshakeInterceptor`.

## Public (no-JWT-required) paths
Sourced from auth-service's `SecurityConfig` `permitAll()` list:
`/api/auth/register`, `/login`, `/refresh`, `/forgot-password`,
`/reset-password`, `/github`, `/github/callback`, `/health`. If that list
changes in auth-service, update `PUBLIC_PATHS` in
`JwtAuthenticationGlobalFilter` to match — nothing keeps these in sync
automatically.

Every other service's paths require a valid `access_token` cookie. I
don't know whether services other than auth-service expose their own
`/health`-style endpoint, so none are added to the public list — if they
exist and you want them reachable without a token, add them.

## Version notes (Spring Boot 4.1.0)
- Spring Cloud **2025.1.2 ("Oakwood")** is the release train — earlier
  2025.0.x/2025.1.0/2025.1.1 trains don't support Boot 4.1.0.
- This pulls in **Spring Cloud Gateway 5.0.x**, which renamed the
  property prefix from `spring.cloud.gateway.*` to
  `spring.cloud.gateway.server.webflux.*`. Your originally pasted
  properties file used the old prefix — it likely still works via
  Spring Boot's deprecated-property shim, but everything here uses the
  new prefix directly so it's not depending on that shim.
- Artifact is `spring-cloud-starter-gateway-server-webflux` (new name;
  the old `spring-cloud-starter-gateway` is deprecated).

## Unverified assumptions (flagged, not guessed silently)
- JWT subject claim holds `userId` — same assumption `JwtCookieExtractor`
  already makes (comment there says "adjust if... a custom claim
  instead"). If that's wrong, fix it in `JwtValidator.extractUserId()`.
- The 401 response body shape (`{"success":false,"message":...,"data":null}`)
  is a best-effort guess at your `ApiResponse<T>` convention — the gateway
  has no dependency on the real class since it's not a shared library.
  Paste the real `ApiResponse<T>` if you want the gateway's error
  responses to match it exactly.
- `messaging-service-rest` route path — see action item #3 above.

## Structure
```
api-gateway/
├── build.gradle
├── settings.gradle
└── src/main/
    ├── java/com/codemates/apigateway/
    │   ├── ApiGatewayApplication.java
    │   ├── config/
    │   │   ├── CorsConfig.java          (localhost:3000, credentialed)
    │   │   └── RateLimiterConfig.java   (userId-or-IP KeyResolver)
    │   ├── filter/
    │   │   └── JwtAuthenticationGlobalFilter.java
    │   └── security/
    │       └── JwtValidator.java        (jjwt 0.11.5, mirrors JwtCookieExtractor)
    └── resources/
        └── application.properties       (all 10 routes + rate limiter)
```
