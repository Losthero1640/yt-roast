---
phase: "01"
slug: "project-scaffolding-takeout-stream-ingestion"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-21"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (^3.0.0 or ^2.1.0) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test -- tests/unit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~6 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/unit`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | `INGEST-01`, `PRIV-01` | — | Zero database dependencies | unit | `npm test -- tests/unit/scaffolding.test.js` | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | `INGEST-02`, `INGEST-03` | — | Clean Unicode & deleted video filtering | unit | `npm test -- tests/unit/parser.test.js` | ✅ | ✅ green |
| 01-01-03 | 01 | 1 | `INGEST-04`, `AI-03` | — | Canonical schema match, zero LLM on demo | unit | `npm test -- tests/unit/demo.test.js` | ✅ | ✅ green |
| 01-02-01 | 02 | 2 | `NORM-01`, `NORM-02`, `NORM-03` | — | High-signal evidence extracted without bulk history | unit | `npm test -- tests/unit/normalizer.test.js` | ✅ | ✅ green |
| 01-02-02 | 02 | 2 | `NORM-04`, `NORM-05` | — | Deterministic scoring & graceful degradation matrix | unit | `npm test -- tests/unit/scoring.test.js` | ✅ | ✅ green |
| 01-02-03 | 02 | 2 | `PRIV-02`, `TEST-01`, `TEST-02` | — | Multi-layer zero-disk verification & <50MB peak heap | performance | `npm test -- tests/performance/memory-benchmark.test.js` | ✅ | ✅ green |

*Status: ⏳ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.js` — Vitest configuration
- [x] `fixtures/synthetic-takeout.json` — 350-record synthetic fixture
- [x] `tests/helpers/zero-disk-spy.js` — Multi-layer zero-disk verification helper (API spies + `os.tmpdir()` snapshots)

---

## Manual-Only Verifications

| Verification | When | What to Look For | Why Manual |
|--------------|------|------------------|------------|
| Comedic Tone of Demo Profile | After Plan 01 | "The 3 AM Productivity Goblin" profile reads authentically and hilariously | Tone and comedic resonance cannot be fully judged by automated regex |
