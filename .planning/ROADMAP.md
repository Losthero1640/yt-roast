# Roadmap: YouTube Roast AI

## Overview

A condensed 3-phase journey to construct a privacy-first, backend-first MVP for YouTube Roast AI. The application implements an in-memory streaming ingestion engine for Google Takeout exports, a statistical normalizer, a Gemini Flash AI roast engine with strict JSON schema enforcement, a dual-mode REST API (Mode 1: Quick Roast via OAuth; Mode 2: Full History Roast via unzipped Takeout upload), and strict privacy verification without any persistent database storage.

---

## Phases

- [x] **Phase 1: Project Scaffolding & Takeout Stream Ingestion** — Node.js (plain JavaScript ES modules) backend foundation, streaming Takeout JSON parser, deleted-video filtering, UTF-8 normalization, deterministic Brainrot scoring, and demo profile loader.
- [x] **Phase 2: Gemini Flash AI Roast Engine & Structured Validation** — Gemini Flash integration with configurable model ID, prompt builder with PII stripping, schema enforcement (`responseSchema` + Zod), satirical guardrails, and error handling.
- [ ] **Phase 3: Dual-Mode REST API, Live Google OAuth & Privacy Hardening** — Fastify REST endpoints (`/upload`, `/demo`, `/oauth`, `/health`), Mode 1 Quick Roast (OAuth likes/subs), `no-store` headers, sanitized errors, memory acceptance verification, and end-to-end acceptance tests.

---

## Phase Details

### Phase 1: Project Scaffolding & Takeout Stream Ingestion
**Goal**: Establish a lightweight Node.js (plain JavaScript ES modules) backend project and implement a streaming in-memory parser and statistical normalizer for unzipped Google Takeout `watch-history.json` exports with bounded memory usage.
**Depends on**: Nothing
**Requirements**: `INGEST-01`, `INGEST-02`, `INGEST-03`, `INGEST-04`, `NORM-01`, `NORM-02`, `NORM-03`, `NORM-04`, `NORM-05`, `PRIV-01`, `PRIV-02`, `TEST-01`, `TEST-02`
**Success Criteria**:
  1. Node.js project initializes with Fastify, stream parsers, Zod runtime validation, and Vitest with zero database dependencies and no TypeScript build step.
  2. Streaming parser consumes unzipped `watch-history.json` entries on the fly, correctly filtering deleted-video placeholders (`title: "Watched a video that has been removed"`) and missing subtitles without crashing.
  3. Parser and normalizer process multi-language titles, non-Latin scripts, and emojis with correct UTF-8 decoding.
  4. Normalizer extracts selective high-signal evidence (top 15 creators, repeated video titles, notable late-night titles paired with derived viewing-hour context such as "watched around 2 AM", topic pairings) and computes a deterministic baseline Brainrot score (0–100) without accumulating full history logs.
  5. Synthetic demo profile loads on demand; datasets with fewer than 20 entries trigger an honest fallback message.
**Plans**: 2 plans

Plans:
- [x] 01-01: Project scaffolding, config, streaming Takeout JSON parser, deleted-video filter, and demo profile loader.
- [x] 01-02: Statistical normalizer, viewing-hour bins, deterministic Brainrot formula, and Vitest fixture test suite.

---

### Phase 2: Gemini Flash AI Roast Engine & Structured Validation
**Goal**: Connect the normalized viewing signals to the Google Gemini API, enforcing strict structured JSON output for a multi-section, varied roast report (pattern roasts, combination roasts, specific title/creator roasts, recurring-character archetype, and coherent final verdict) with satirical grounding guardrails.
**Depends on**: Phase 1
**Requirements**: `AI-01`, `AI-02`, `AI-03`, `AI-04`, `AI-05`, `PRIV-03`, `TEST-03`
**Success Criteria**:
  1. Roast service connects to Gemini API using a model ID configured via `GEMINI_MODEL` (defaulting to a supported Flash model, e.g. `gemini-2.5-flash`), with credentials loaded from `GEMINI_API_KEY`.
  2. Prompt builder constructs high-signal comedic evidence context (creator frequencies, repeated titles, derived viewing-hour context, and unexpected topic pairings) while strictly purging user identifiers, channel URLs, exact ISO timestamps, and bulk logs.
  3. Output validates 100% against the multi-joke Zod schema (`brainrotScore`, `viewingArchetype`, `roastSummary`, structured `roasts` array with style/joke/evidence/reference, `redFlags`, `finalVerdict`, `cardPayload`).
  4. Comedic guardrails enforce variety across joke styles, prevent repetitive templates, and strictly distinguish observed viewing facts from satirical interpretation.
  5. Abort controller terminates generation if response exceeds 15 seconds; provider rate limits (429) return uniform structured error payloads.
**Plans**: 2 plans

Plans:
- [x] 02-01: Gemini API client integration, prompt builder with PII stripping, and Zod response schema definition.
- [x] 02-02: Satirical guardrails, timeout/rate-limit handlers, and Vitest suite with mocked Gemini responses.

---

### Phase 3: Dual-Mode REST API, Live Google OAuth & Privacy Hardening
**Goal**: Wire the ingestion, normalization, and AI roast engines into clean Fastify HTTP routes supporting both Mode 1 (OAuth Likes/Subs) and Mode 2 (Takeout Upload), with strict privacy headers, sanitized errors, and empirical memory verification.
**Depends on**: Phase 2
**Requirements**: `API-01`, `API-02`, `API-03`, `API-04`, `API-05`, `SEC-01`, `SEC-02`, `PRIV-04`, `TEST-04`, `TEST-05`
**Success Criteria**:
  1. REST endpoints (`POST /api/roast/upload`, `GET /api/roast/demo`, `GET /api/roast/oauth/url`, `GET /api/roast/oauth/callback`, `GET /api/health`) are operational, incorporating explicit pre-upload user consent and disclosures that selected viewing details are transmitted under Google Gemini retention terms.
  2. Upload endpoint rejects payloads exceeding 100MB with HTTP 413 without buffering excess bytes into memory.
  3. Mode 1 Quick Roast retrieves subscriptions and likes via YouTube Data API v3 (`https://www.googleapis.com/auth/youtube.readonly`) using environment variables for live credentials and fixtures for local testing, returning a roast with a mandatory disclosure badge.
  4. All roast responses include `Cache-Control: no-store, private, max-age=0`; global error handlers sanitize exceptions and strip stack traces.
  5. Memory and zero-disk acceptance test measures baseline heap, peak heap, incremental heap usage, and total process RSS during streaming of a 50MB+ synthetic fixture (reporting measured evidence if thresholds require revision), and verifies zero filesystem write calls occurred during request processing.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Fastify REST server, multipart streaming upload, security headers, demo route, and error sanitization.
- [ ] 03-02: Mode 1 OAuth flow integration, mock test fixtures, memory/disk acceptance test, and end-to-end UAT.
