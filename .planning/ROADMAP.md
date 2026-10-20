# Roadmap: YouTube Roast AI

## Overview

A phased journey to construct a privacy-first, backend-first MVP for YouTube Roast AI. The application implements an in-memory streaming ingestion engine for Google Takeout exports, a statistical signal normalizer, a Gemini Flash AI roast engine with strict JSON schema enforcement, a dual-mode REST API (Takeout upload + YouTube OAuth for Likes/Subs), and end-to-end verification without any database persistence.

---

## Phases

- [ ] **Phase 1: Project Scaffolding & Takeout Stream Ingestion** — Node.js/TypeScript setup, in-memory streaming Takeout parser, and demo data loader with bounded memory guarantees.
- [ ] **Phase 2: Signal Normalization & Brainrot Metrics Engine** — Statistical aggregation of viewing hours, binge-patterns, top creators, repeated titles, and deterministic Brainrot scoring.
- [ ] **Phase 3: Gemini Flash AI Roast Engine & Structured Output** — Gemini Flash client integration, strict JSON Schema generation, and satirical guardrails.
- [ ] **Phase 4: Dual-Mode REST API & OAuth Handlers** — Fastify/Express HTTP endpoints (`/upload`, `/oauth`, `/demo`, `/health`), multipart streaming, and OAuth test fixtures.
- [ ] **Phase 5: End-to-End Verification, Security Hardening & UAT** — Vitest automated test suite, memory/leak audit, PII redaction checks, and acceptance sign-off.

---

## Phase Details

### Phase 1: Project Scaffolding & Takeout Stream Ingestion
**Goal**: Establish a lightweight TypeScript backend project and implement a streaming in-memory parser for Google Takeout `watch-history.json` exports that runs safely under bounded memory.
**Depends on**: Nothing
**Requirements**: INGEST-01, INGEST-02, INGEST-05, PRIV-01, PRIV-02, PRIV-04
**Success Criteria**:
  1. Project initializes with TypeScript, Fastify/Express, and Vitest with zero database dependencies.
  2. Streaming parser consumes simulated 50MB+ Takeout files in-memory without exceeding 50MB process heap or writing to disk.
  3. Parser handles missing fields, deleted video notices, and malformed objects gracefully without crashing.
  4. Demo synthetic profile can be loaded instantly without file upload.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Project structure, package.json, TypeScript, config, and logger with token/PII redaction.
- [ ] 01-02: Streaming Takeout JSON parser with edge-case handling and demo profile loader.

---

### Phase 2: Signal Normalization & Brainrot Metrics Engine
**Goal**: Transform parsed watch events into a compact, anonymized statistical profile containing peak viewing hours, repeated content velocity, creator histograms, and deterministic Brainrot metrics.
**Depends on**: Phase 1
**Requirements**: NORM-01, NORM-02, NORM-03, NORM-04, NORM-05, PRIV-03
**Success Criteria**:
  1. Signal normalizer collapses raw history arrays down to a <4KB summary payload containing top 15 creators, late-night binge ratios, and repeat clusters.
  2. Deterministic baseline Brainrot index is calculated with transparent rule weights.
  3. Datasets with fewer than 20 records trigger an honest "insufficient data" signal instead of fabricated stats.
  4. All personal identifiers (channel URLs, timestamps down to the second, user identifiers) are stripped.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Aggregator logic for time distributions (12 AM–5 AM binge detection), creator frequencies, and repeat views.
- [ ] 02-02: Deterministic Brainrot scoring formula and insufficient data detector with unit tests.

---

### Phase 3: Gemini Flash AI Roast Engine & Structured Output
**Goal**: Connect the normalized viewing signal to Google Gemini Flash (`gemini-3.8-flash`) and enforce strict JSON Schema output validating the roast report, Brainrot score, red flags, and personality verdict.
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria**:
  1. Gemini Flash API client connects securely via `GEMINI_API_KEY` with schema-enforced structured output.
  2. Generated report validates 100% against the Zod roast schema (brainrot score, archetype, roast summary, red flags, personality verdict, card payload).
  3. Roast commentary cites at least 3 concrete observed creators or themes and avoids clinical diagnostic claims.
  4. Timeout (15s abort) and rate-limit error handling return uniform structured error responses.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Gemini Flash client setup, prompt builder, and Zod response schema definition.
- [ ] 03-02: Error handling, timeout abort, retry logic, and fallback responses.

---

### Phase 4: Dual-Mode REST API & OAuth Handlers
**Goal**: Wire the ingestion, normalization, and AI engines into clean HTTP endpoints supporting both Mode A (OAuth Likes/Subs) and Mode B (Takeout upload).
**Depends on**: Phase 3
**Requirements**: INGEST-03, INGEST-04, API-01, API-02, API-03
**Success Criteria**:
  1. `POST /api/roast/upload` accepts multipart file upload, streams to memory, and returns the roast report.
  2. `GET /api/roast/demo` returns an instant roast based on the synthetic demo profile.
  3. `GET /api/roast/oauth/url` and `/callback` implement Mode A (Subscriptions & Likes roast) with test fixture support.
  4. Payloads exceeding 100MB immediately trigger a 413 Payload Too Large error without buffering into memory.
**Plans**: 2 plans

Plans:
- [ ] 04-01: REST API server setup, `/upload`, `/demo`, and `/health` endpoints with multipart streaming.
- [ ] 04-02: Mode A OAuth flow integration, token exchange, and Subscriptions/Likes normalizer with test fixtures.

---

### Phase 5: End-to-End Verification, Security Hardening & UAT
**Goal**: Validate the entire backend pipeline against the product principles, verify zero disk retention, run comprehensive Vitest tests, and finalize the backend MVP milestone.
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria**:
  1. Comprehensive Vitest suite passes 100% across parser, normalizer, AI service, and API routes.
  2. Privacy audit confirms zero temporary files created in `/tmp`, workspace, or memory leaks after processing 5 consecutive uploads.
  3. Backend MVP is documented with curl examples and ready for Phase 2 frontend integration.
**Plans**: 1 plan

Plans:
- [ ] 05-01: End-to-end integration tests, privacy/retention audit, and milestone acceptance verification.
