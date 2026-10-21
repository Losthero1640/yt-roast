# Phase 3: Dual-Mode REST API, Live Google OAuth & Privacy Hardening - Context

**Gathered:** 2026-10-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the production-ready HTTP REST API layer connecting Phase 1 (streaming Takeout parser, normalizer, Brainrot scoring) and Phase 2 (Gemini Flash AI roast engine) into a dual-mode web service. It delivers:
1. Standard REST endpoints (`POST /api/roast/upload`, `GET /api/roast/demo`, `GET /api/roast/oauth/url`, `GET /api/roast/oauth/callback`, `GET /api/health`).
2. Mode 2 (Full History Takeout Upload): Streaming multipart ingestion directly from HTTP socket to parser with a hard 100MB body limit (`HTTP 413 Payload Too Large`), explicit consent verification (`consent: true`), and zero disk temporary spooling (`PRIV-02`).
3. Mode 1 (Quick Roast): Google OAuth 2.0 flow (`https://www.googleapis.com/auth/youtube.readonly`) using lightweight native `fetch` without heavyweight SDK bloat, ephemeral memory handling (tokens dropped immediately after fetching subscriptions and likes; zero database/disk persistence), and prominent disclaimer badge (`API-04`).
4. Privacy & Security Hardening: Mandatory `Cache-Control: no-store, private, max-age=0` on all roast endpoints (`SEC-01`), global error handler that sanitizes all exceptions and strips stack traces/tokens/file lines (`SEC-02`), and log redaction across all levels (`PRIV-04`).
5. HTTP-layer streaming memory benchmark and zero-disk acceptance test streaming a 50MB+ synthetic fixture through the Fastify server (`TEST-04`).
6. Comprehensive Vitest API integration test suite covering all endpoints, error conditions, rate limits, and OAuth callback flows using `app.inject()` (`TEST-05`).

All code remains 100% plain JavaScript ES modules (`"type": "module"`, `.js`), zero TypeScript, zero database persistence, and zero disk writes.
</domain>

<decisions>
## Implementation Decisions

### 1. Route Architecture & Fastify Organization
- **D-22 (Route Structure & Fastify Setup):**
  - Group routes into modular Fastify plugins under `src/routes/`:
    - `src/routes/health.js`: `GET /api/health` returning service status, timestamp, and zero-persistence verification metadata.
    - `src/routes/roast.js`:
      - `POST /api/roast/upload` (Mode 2 Takeout upload)
      - `GET /api/roast/demo` (Instant demo roast)
      - `GET /api/roast/oauth/url` (OAuth auth URL generator)
      - `GET /api/roast/oauth/callback` (OAuth code exchange & Quick Roast)
  - The Fastify instance in `src/app.js` registers `@fastify/multipart` with `{ attachFieldsToBody: false, limits: { fileSize: 100 * 1024 * 1024 } }` to ensure incoming files are streamed in-memory without spooling to disk.

### 2. Mode 2: In-Memory Multipart Stream Pipeline & 100MB Limit
- **D-23 (Streaming Upload Pipeline & Consent Enforcement):**
  - Route: `POST /api/roast/upload`.
  - Body limit: Enforces 100MB max file size. If a client sends more than 100MB, Fastify's multipart limit rejects with HTTP 413 without buffering excess bytes into memory.
  - Consent validation: Requires query parameter or multipart field `consent=true`. If absent, rejects immediately with HTTP 400 Bad Request (`ConsentRequiredError`).
  - Streaming Pipeline:
    - Reads incoming file stream via `req.file()`.
    - Validates file field name (`file`) and filename extension (`.json`).
    - Feeds stream directly to `parseTakeoutStream(file.file, sink)` and `TakeoutNormalizer`.
    - If total valid records $< 20$, returns honest fallback per `NORM-05` (`{ isInsufficient: true, message: 'Insufficient viewing history (minimum 20 valid records required).' }`).
    - Computes deterministic score via `calculateBrainrotScore(profile)`.
    - Generates roast via `roastGeneratorService.generateRoastReport({ profile, scoreResult, consentGranted: true })`.
    - Returns HTTP 200 with `FullRoastResult` payload and `Cache-Control: no-store`.

### 3. Mode 1: Ephemeral OAuth Quick Roast & Disclaimer Badge
- **D-24 (Zero-Persistence OAuth Flow & Disclaimer):**
  - Endpoints:
    - `GET /api/roast/oauth/url`: Generates Google OAuth authorization URL with scope `https://www.googleapis.com/auth/youtube.readonly`, `access_type=online`, and CSRF `state` parameter.
    - `GET /api/roast/oauth/callback?code=...&state=...`:
      1. Validates code and state.
      2. Exchanges code for ephemeral access token via `https://oauth2.googleapis.com/token`.
      3. Uses access token with YouTube Data API v3:
         - `GET /youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50`
         - `GET /youtube/v3/videos?part=snippet&myRating=like&maxResults=50`
      4. Drops access token from memory immediately. Never stores token in session, cookie, database, or disk.
      5. Maps subscriptions and liked videos into a `NormalizedViewingProfile` (channels mapped to `topCreators`, liked video titles mapped to `repeatedTitles`).
      6. Computes baseline score and generates roast via `RoastGeneratorService`.
      7. Attaches mandatory prominent Mode 1 disclaimer badge (`API-04`):
         ```json
         "disclaimer": "This roast is based solely on your public subscriptions and liked videos, not complete viewing history."
         ```
      8. Returns HTTP 200 with roast and badge.

### 4. Privacy, Security & Logging Sanitization
- **D-25 (Global Cache-Control Headers):**
  - Register an `onSend` Fastify hook for all `/api/roast/*` routes setting:
    `Cache-Control: no-store, private, max-age=0`
    `Pragma: no-cache`
    `Surrogate-Control: no-store`
  - Prevents browsers, CDNs, proxies, or intermediate caches from persisting roast reports or metadata to disk (`SEC-01`).
- **D-26 (Global Error Handler & Log Redaction):**
  - Implement custom error handler in Fastify:
    - Intercepts all unhandled errors.
    - Sanitizes response payload: returns standard structured `{ error: { code, message } }`.
    - Strips stack traces, file system paths, authorization codes, OAuth tokens, client secrets, and raw file line snippets (`SEC-02`).
    - Maps domain errors to HTTP statuses:
      - `ConsentRequiredError` $\rightarrow$ 400
      - `PayloadTooLargeError` $\rightarrow$ 413
      - `TakeoutParseError` $\rightarrow$ 400
      - `GeminiRateLimitError` $\rightarrow$ 429
      - `GeminiTimeoutError` $\rightarrow$ 504
      - `GeminiValidationError` $\rightarrow$ 502
  - Custom logging redaction utility (`src/utils/logger.js`) ensures OAuth codes, tokens, credentials, and uploaded payloads are redacted before printing (`PRIV-04`).

### 5. HTTP Memory Acceptance Benchmark & Integration Test Suite
- **D-27 (HTTP-Layer Memory Acceptance Test):**
  - `tests/performance/http-upload-benchmark.test.js`:
    - Launches Fastify app in test process.
    - Streams a 52MB+ synthetic Takeout fixture via HTTP multipart upload (`POST /api/roast/upload?consent=true`).
    - Verifies streaming memory bounds: incremental heap $< 30$ MB, peak heap $< 50$ MB (`TEST-04`).
    - Verifies zero filesystem writes occurred throughout the HTTP request lifecycle via `setupZeroDiskSpies()`.
- **D-28 (Vitest API Integration Suite):**
  - `tests/integration/api-routes.test.js` & `tests/integration/oauth-flow.test.js`:
    - Fast testing using `app.inject()` without binding ephemeral TCP ports.
    - Tests:
      - `/api/health` status check.
      - `/api/roast/demo` returning instant profile with `no-store` headers.
      - `/api/roast/upload` with valid fixture, missing consent (400), malformed JSON (400), $>100$MB file (413), and $<20$ records fallback.
      - `/api/roast/oauth/url` and `/api/roast/oauth/callback` with mocked Google token exchange and YouTube API responses.
      - Error sanitization: verifies zero leaks of stack traces or credentials in error responses.
</decisions>

<verification_matrix>
## Phase 3 Verification Matrix

| Requirement | Description | Verified By |
|---|---|---|
| `API-01` | REST endpoints: `/upload`, `/demo`, `/oauth/url`, `/oauth/callback`, `/health` | `tests/integration/api-routes.test.js` |
| `API-02` | Enforce 100MB max body size on upload with HTTP 413 without buffering excess | `tests/integration/api-routes.test.js` |
| `API-03` | Mode 1 OAuth 2.0 flow with ephemeral token lifecycle (zero token persistence) | `tests/integration/oauth-flow.test.js` |
| `API-04` | Prominent disclaimer badge on Mode 1 Quick Roast response | `tests/integration/oauth-flow.test.js` |
| `API-05` | Pre-upload user consent verification on Takeout upload flow | `tests/integration/api-routes.test.js` |
| `SEC-01` | `Cache-Control: no-store, private, max-age=0` on all roast API responses | `tests/integration/api-routes.test.js` |
| `SEC-02` | Global error handler sanitizing exceptions and stripping stack traces/tokens | `tests/integration/api-routes.test.js` |
| `PRIV-04` | Application logging redacting tokens, credentials, and file payloads | `tests/integration/api-routes.test.js` |
| `TEST-04` | HTTP streaming memory benchmark on 50MB+ fixture (<30MB inc, <50MB peak, 0 disk writes) | `tests/performance/http-upload-benchmark.test.js` |
| `TEST-05` | Vitest API integration suite covering all routes, multipart, OAuth, and error states | `tests/integration/api-routes.test.js`, `tests/integration/oauth-flow.test.js` |
</verification_matrix>
