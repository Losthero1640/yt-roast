---
phase: "03"
slug: "dual-mode-rest-api-live-google-oauth-privacy-hardening"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-21"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (^5.0.5) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test -- tests/integration/api-routes.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/integration`
- **After every plan wave:** Run full test suite `npm test`
- **Before phase completion:** Full suite must be 100% green with zero Phase 1 & 2 regressions
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | `SEC-01`, `SEC-02`, `PRIV-04` | — | Cache-Control: no-store, sanitized error responses, redacted logs | integration | `npm test -- tests/integration/api-routes.test.js` | ❌ W0 | ⏳ pending |
| 03-01-02 | 01 | 1 | `API-01`, `API-02`, `API-05` | — | 100MB body limit, pre-upload consent check, streaming ingestion | integration | `npm test -- tests/integration/api-routes.test.js` | ❌ W0 | ⏳ pending |
| 03-01-03 | 01 | 1 | `TEST-05` | — | End-to-end REST routes verification & error sanitization | integration | `npm test -- tests/integration/api-routes.test.js` | ❌ W0 | ⏳ pending |
| 03-02-01 | 02 | 2 | `API-03`, `API-04` | — | Ephemeral token lifecycle (zero persistence) & mandatory disclaimer badge | integration | `npm test -- tests/integration/oauth-flow.test.js` | ❌ W0 | ⏳ pending |
| 03-02-02 | 02 | 2 | `TEST-05` | — | OAuth callback exchange, mock fixtures, error states | integration | `npm test -- tests/integration/oauth-flow.test.js` | ❌ W0 | ⏳ pending |
| 03-02-03 | 02 | 2 | `TEST-04`, `PRIV-02` | — | HTTP 50MB+ streaming memory benchmark & zero-disk verification | performance | `npm test -- tests/performance/http-upload-benchmark.test.js` | ❌ W0 | ⏳ pending |

*Status: ⏳ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `fixtures/mock-oauth-data.js` — Mock YouTube subscriptions and likes fixtures
- [ ] Fastify multipart configured strictly in-memory

---

## Manual-Only Verifications

| Verification | When | What to Look For | Why Manual |
|--------------|------|------------------|------------|
| Prominence of Mode 1 Disclaimer Badge | After Plan 02 | Verify that the disclaimer badge is clear, prominent, and unambiguous in response payloads | Visual prominence and clarity cannot be fully judged by automated regex alone |
