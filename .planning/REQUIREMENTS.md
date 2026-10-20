# Requirements: YouTube Roast AI

**Defined:** October 2026  
**Core Value:** Generate a savagely funny, authentic, and shareable AI roast of the user's YouTube habits while ensuring strict data privacy with zero persistent database storage.

---

## v1 Requirements

### Phase 1: Ingestion, Stream Parsing & Signal Normalization

- [ ] **INGEST-01**: Application parses unzipped Google Takeout `watch-history.json` files using an in-memory streaming JSON parser (`stream-json`), processing chunks as they arrive.
- [ ] **INGEST-02**: Parser filters deleted-video placeholders (e.g. `title: "Watched a video that has been removed"`, null `subtitles`, null `titleUrl`) without raising unhandled exceptions.
- [ ] **INGEST-03**: Parser and normalizer support UTF-8 character encoding, correctly handling international titles, non-Latin scripts, and emojis without offset or decoding crashes.
- [ ] **INGEST-04**: Application provides pre-loaded synthetic demo viewing profiles for instant preview without live file upload or OAuth login.
- [ ] **NORM-01**: Normalizer aggregates total video counts, active date ranges, and the top 15 most-watched creators/channels.
- [ ] **NORM-02**: Normalizer computes viewing-hour distributions, specifically calculating late-night binge ratios between 12 AM and 5 AM.
- [ ] **NORM-03**: Normalizer extracts selective high-signal evidence for comedic analysis (top repeated video titles, notable late-night video titles paired with derived viewing-hour context such as "watched around 2 AM" rather than unnecessary exact ISO timestamps, top creators, and recurring topic clusters) without accumulating bulk history logs in memory.
- [ ] **NORM-04**: Normalizer computes a deterministic baseline Brainrot score (0–100) based on repeat view velocity and high-frequency content patterns.
- [ ] **NORM-05**: Normalizer detects datasets with fewer than 20 valid records and triggers an honest, graceful fallback message rather than fabricating insights.
- [ ] **PRIV-01**: Zero database persistence: raw watch history is never stored in any persistent database or disk file.
- [ ] **PRIV-02**: Zero disk writes throughout request lifecycle: Raw uploaded history is never spooled, buffered, or written to disk at any point before, during, or after streaming ingestion. Implementation uses in-memory request streaming directly from socket to parser (`@fastify/multipart` configured strictly in memory stream mode, with no disk temp adapters). Verification requires both: (1) an architectural audit of the multipart pipeline configuration, and (2) automated test verification via filesystem interception (spying on `fs.writeFile`, `fs.createWriteStream`, etc.) and directory inspection. (Note: Automated interception verifies application and library Node.js calls; configuration audit verifies no native disk-spooling adapters are enabled).
- [ ] **TEST-01**: Vitest unit test suite verifies streaming parser against synthetic valid, empty, deleted-item, and malformed Takeout fixtures.
- [ ] **TEST-02**: Vitest unit tests verify normalizer aggregation logic, deterministic Brainrot scoring, and the <20 record threshold.

### Phase 2: Gemini Integration, Schema Validation & Satirical Guardrails

- [ ] **AI-01**: Roast service integrates Google Gemini API using a model ID configured via the `GEMINI_MODEL` environment variable (defaulting to a supported Flash model, e.g. `gemini-2.5-flash`), with credentials loaded from `GEMINI_API_KEY`.
- [ ] **AI-02**: Roast engine enforces strict JSON Schema generation using Gemini's native structured output (`responseSchema`) and validates returned payloads with Zod.
- [ ] **AI-03**: Structured output schema validates a substantial, multi-section roast report containing:
  - `brainrotScore`: integer (0–100)
  - `viewingArchetype`: string (recurring-character classification and comedic persona)
  - `roastSummary`: string (substantial opening critique)
  - `roasts`: array of individual structured jokes, each specifying:
    - `style`: string enum (`"pattern"` | `"combination"` | `"specific"` | `"archetype"`)
    - `joke`: string (the comedic punchline/roast text)
    - `supportingEvidence`: string (factual observation grounding the joke)
    - `referencedItem`: optional string (creator name or video title that made the joke specific)
  - `redFlags`: array of 3–5 specific recurring behavioral patterns
  - `finalVerdict`: string (coherent, memorable concluding takeaway)
  - `cardPayload`: metadata object formatted for shareable card rendering
- [ ] **AI-04**: Prompt engineering enforces comedic variety (pattern-based roasts, combination roasts connecting 2+ distinct patterns, specific title/creator roasts, and recurring-character analysis), avoids repetitive templates, forbids clinical assertions, and strictly distinguishes factual observations from satirical interpretation.
- [ ] **AI-05**: Service implements resilient error handling for AI API timeouts (15s abort controller), rate limits (HTTP 429), and service unreachability.
- [ ] **PRIV-03**: Outbound Gemini payload boundary: While the server temporarily reads records in-memory, the outbound AI payload transmits only curated high-signal evidence (aggregated counts, viewing-hour histograms, top creators, selected salient repeated/late-night titles, and derived viewing-hour context such as "watched around 2 AM"). User identifiers, channel URLs, IP addresses, exact ISO timestamps, and bulk raw history are strictly stripped.
- [ ] **TEST-03**: Vitest integration tests verify the roast prompt builder and schema validation using mocked Gemini responses and failure states.

### Phase 3: Dual-Mode REST API, Live Google OAuth & Privacy Hardening

- [ ] **API-01**: Backend exposes standard REST endpoints:
  - `POST /api/roast/upload` (multipart streaming for unzipped `watch-history.json`)
  - `GET /api/roast/demo` (instant roast from bundled synthetic profile)
  - `GET /api/roast/oauth/url` (generates Google OAuth authorization URL)
  - `GET /api/roast/oauth/callback` (exchanges authorization code and executes Quick Roast)
  - `GET /api/health` (service readiness and configuration health check)
- [ ] **API-02**: Ingestion endpoint enforces a strict maximum body size of 100MB, returning HTTP 413 Payload Too Large without buffering excess bytes.
- [ ] **API-03**: Quick Roast implements OAuth 2.0 retrieval for `subscriptions.list` and `videos.list` (likes) under scope `https://www.googleapis.com/auth/youtube.readonly`, backed by mock fixtures for local tests and environment variables for live credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`). Access tokens are held strictly in ephemeral memory for the request duration and immediately discarded; no tokens are stored in a database or disk session.
- [ ] **API-04**: Quick Roast output explicitly includes a prominent disclaimer that the analysis is based solely on subscriptions and likes, not complete viewing history.
- [ ] **API-05**: Full History Roast upload flow requires explicit user consent and provides a clear pre-upload disclosure stating that selected viewing details (top creators, notable video titles, and derived viewing hours) are transmitted to Google Gemini for roast generation and are subject to the AI provider's applicable data-retention and abuse-monitoring terms.
- [ ] **SEC-01**: All roast API responses include the HTTP header `Cache-Control: no-store, private, max-age=0` to prevent intermediate or browser disk caching.
- [ ] **SEC-02**: Global error handling sanitizes all exceptions, returning structured error objects without echoing raw file lines, stack traces, or authorization tokens.
- [ ] **PRIV-04**: Application logging redacts authorization codes, OAuth tokens, client credentials, and file content payloads across all log levels.
- [ ] **TEST-04**: Memory and zero-disk acceptance test: Measures baseline heap, peak heap, incremental heap usage, and total process RSS during streaming ingestion of a 50MB+ synthetic fixture. Thresholds (<30MB incremental heap, <50MB peak heap) are preserved as acceptance targets; if unachievable in the test environment, the test logs empirical measurements and requires explicit user review and approval before any threshold modification. Verifies zero filesystem write calls occurred during request processing.
- [ ] **TEST-05**: Vitest API integration suite covers all endpoints, multipart handling, OAuth callback error states, and rate-limiting responses.

---

## v2 Requirements (Post-MVP Backlog)

- **V2-01**: Automated streaming `.zip` extraction supporting raw `takeout-*.zip` uploads.
- **V2-02**: Interactive frontend dashboard with glassmorphic cards, animated Brainrot gauge, and PNG card export.
- **V2-03**: Google Cloud OAuth production app verification and CASA Tier 2 assessment if expanding beyond standard developer limits.
- **V2-04**: Secondary AI provider integration (e.g. OpenAI `gpt-4o-mini`) via adapter interface.
- **V2-05**: Client-side WebWorker/WASM streaming parser for 100% in-browser pre-aggregation.

---

## Traceability Matrix

| Requirement IDs | Phase | Deliverables |
| :--- | :--- | :--- |
| `INGEST-01`, `INGEST-02`, `INGEST-03`, `INGEST-04`, `NORM-01`, `NORM-02`, `NORM-03`, `NORM-04`, `NORM-05`, `PRIV-01`, `PRIV-02`, `TEST-01`, `TEST-02` | **Phase 1** | Scaffolding, streaming parser, normalizer, Brainrot scoring, fixture tests |
| `AI-01`, `AI-02`, `AI-03`, `AI-04`, `AI-05`, `PRIV-03`, `TEST-03` | **Phase 2** | Gemini client, prompt builder, Zod/responseSchema, satirical guardrails, tests |
| `API-01`, `API-02`, `API-03`, `API-04`, `API-05`, `SEC-01`, `SEC-02`, `PRIV-04`, `TEST-04`, `TEST-05` | **Phase 3** | Fastify routes, Mode 1 OAuth, Demo loader, privacy hardening, memory verification |
