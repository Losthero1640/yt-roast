# Requirements: YouTube Roast AI

**Defined:** October 2026  
**Core Value:** Generate a savagely funny, authentic, and shareable AI roast of the user's YouTube habits while ensuring 100% data privacy with zero persistent database storage.

---

## v1 Requirements

### Data Ingestion & Streaming

- [ ] **INGEST-01**: Application parses Google Takeout `watch-history.json` files using an in-memory streaming JSON parser (`stream-json`), keeping heap memory usage bounded under 50MB regardless of upload file size (tested up to 100MB).
- [ ] **INGEST-02**: Takeout parser handles missing or deleted video entries gracefully (e.g. missing `subtitles`, `"Watched a video that has been removed"`, null `titleUrl`) without throwing unhandled exceptions.
- [ ] **INGEST-03**: Application implements an OAuth 2.0 flow for YouTube Data API v3 requesting `https://www.googleapis.com/auth/youtube.readonly`, backed by mock test fixtures for local testing.
- [ ] **INGEST-04**: OAuth ingestion extracts user subscriptions and liked videos, aggregating channel names and titles into a normalized profile.
- [ ] **INGEST-05**: Application provides pre-loaded demo/sample viewing profiles so the roast engine can be executed immediately without live uploads or OAuth.

### Normalization & Signal Extraction

- [ ] **NORM-01**: Normalizer aggregates total video count, active date ranges, and top 15 most-watched channels/creators.
- [ ] **NORM-02**: Normalizer computes time-of-day viewing distribution (specifically flagging late-night binge ratios between 12 AM and 5 AM).
- [ ] **NORM-03**: Normalizer computes repeated video view counts and recurring topic/keyword clusters.
- [ ] **NORM-04**: Normalizer calculates a deterministic baseline "Brainrot index" based on repeat view velocity and high-frequency content patterns.
- [ ] **NORM-05**: Normalizer detects insufficient input data (<20 valid records) and triggers an honest, graceful fallback response rather than hallucinating insights.

### AI Roast Engine & Structured Output

- [ ] **AI-01**: Roast service integrates Google Gemini Flash (`gemini-3.8-flash` / `gemini-2.5-flash`) via Google AI Studio API key stored securely in environment variables.
- [ ] **AI-02**: Roast engine enforces a strict JSON Schema output using Gemini's structured output (`responseSchema`) and validates results via Zod.
- [ ] **AI-03**: Structured output includes:
  - `brainrotScore`: integer (0–100)
  - `archetype`: string (humorous categorization, e.g. "3 AM Doomscroller", "Tutorial Collector Who Never Builds")
  - `roastSummary`: string (witty, brutal, entertaining roast paragraph)
  - `redFlags`: array of 3–5 specific recurring behavioral patterns
  - `observedEvidence`: array of 3+ concrete cited channels/topics from input
  - `personalityVerdict`: string (comedic personality takeaway clearly labeled as satire)
  - `cardPayload`: metadata object formatted for shareable card rendering
- [ ] **AI-04**: Prompt engineering strictly anchors comedic claims to observed evidence and distinguishes satire from speculative psychological facts.
- [ ] **AI-05**: Engine handles AI API timeouts (15s abort), rate limits (429), and provider connection failures gracefully.

### Privacy & Ephemeral Security

- [ ] **PRIV-01**: Zero database persistence: neither raw watch history, normalized signals, nor generated roast reports are stored in any persistent database or disk cache.
- [ ] **PRIV-02**: Memory scrubbing: Ingestion buffers and parsed objects are scoped to the request lifecycle and discarded immediately after response dispatch.
- [ ] **PRIV-03**: Personal Identifiable Information (PII) including user names, email addresses, channel URLs, and IP addresses are completely stripped before sending data to the AI model.
- [ ] **PRIV-04**: Server logs explicitly redact OAuth tokens, authorization codes, prompts containing user data, and file contents.

### API Service & Architecture

- [ ] **API-01**: Backend exposes REST endpoints:
  - `POST /api/roast/upload` (multipart/form-data for Takeout JSON upload)
  - `GET /api/roast/oauth/url` (initiates Google OAuth flow)
  - `GET /api/roast/oauth/callback` (handles code exchange and executes Instant Roast)
  - `GET /api/roast/demo` (returns roast from pre-configured synthetic profile)
  - `GET /api/health` (service and model readiness check)
- [ ] **API-02**: Maximum upload body size is bounded (100MB limit with HTTP 413 response if exceeded).
- [ ] **API-03**: Error responses follow a uniform structured JSON format (`{ error: string, code: string, message: string }`).

### Verification & Testing

- [ ] **TEST-01**: Vitest unit test suite covering the streaming Takeout parser with synthetic good, edge-case, and malformed JSON fixtures.
- [ ] **TEST-02**: Vitest unit tests verifying signal normalization, Brainrot scoring, and threshold checks (<20 items).
- [ ] **TEST-03**: Vitest integration tests for API endpoints (`/upload`, `/demo`, `/health`) with mocked Gemini API responses.
- [ ] **TEST-04**: Privacy verification test ensuring no temporary files remain on disk post-request.

---

## v2 Requirements (Post-MVP)

- **V2-01**: Interactive frontend with glassmorphic dashboard, Brainrot gauge animation, and shareable card export (PNG/image generation).
- **V2-02**: Live Google OAuth Production App Verification & CASA Tier 2 assessment if scaling beyond unverified user limits.
- **V2-03**: Secondary AI provider integration (OpenAI `gpt-4o-mini`) toggle.
- **V2-04**: Client-side WebAssembly/WebWorker Takeout stream parser to enable 100% in-browser preprocessing.

---

## Out of Scope for MVP

| Feature | Reason |
| :--- | :--- |
| **Persistent User Accounts & Database** | Explicitly violates Core Product Principle #2 & Privacy Architecture. Zero persistence required. |
| **Frontend UI Code Generation** | Initial milestone is a backend-first, verifiable, API-complete MVP before UI construction. |
| **Full Watch History via YouTube OAuth** | Technically infeasible — Google deprecated and disabled watch history in Data API v3. |
| **Video Duration / Watch-time (Minutes)** | Google Takeout `watch-history.json` does not capture video playback duration or view completion percentage. |
| **Microservices / Docker Compose / Redis** | Unjustified complexity for MVP; standard single Node.js runtime process is simpler, faster, and cheaper. |

---

## Traceability Matrix

| Requirement | Phase |
| :--- | :--- |
| `INGEST-01`, `INGEST-02`, `INGEST-05`, `PRIV-01`, `PRIV-02`, `PRIV-04` | Phase 1: Ingestion Engine & Takeout Stream Parser |
| `NORM-01`, `NORM-02`, `NORM-03`, `NORM-04`, `NORM-05`, `PRIV-03` | Phase 2: Normalization & Signal Extraction |
| `AI-01`, `AI-02`, `AI-03`, `AI-04`, `AI-05` | Phase 3: Gemini Flash AI Roast Engine & Structured Output |
| `INGEST-03`, `INGEST-04`, `API-01`, `API-02`, `API-03` | Phase 4: API Service & Dual-Mode Integration |
| `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04` | Phase 5: End-to-End Verification & Hardening |
