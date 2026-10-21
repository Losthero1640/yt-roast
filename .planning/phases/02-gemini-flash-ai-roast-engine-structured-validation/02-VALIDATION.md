---
phase: "02"
slug: "gemini-flash-ai-roast-engine-structured-validation"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-21"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (^5.0.5) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test -- tests/unit/prompt-builder.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~6 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/unit` and targeted integration test
- **After every plan wave:** Run full test suite `npm test`
- **Before phase completion:** Full suite must be 100% green with zero Phase 1 regressions
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | `AI-01` | — | Zero TypeScript / database dependencies | unit | `npm test` | ❌ W0 | ⏳ pending |
| 02-01-02 | 01 | 1 | `AI-03`, `AI-04` | — | Canonical schema, min 4 jokes, 4 styles, evidence grounding | unit | `npm test -- tests/unit/prompt-builder.test.js` | ❌ W0 | ⏳ pending |
| 02-01-03 | 01 | 1 | `PRIV-03`, `AI-04` | — | PII/URL/timestamp purging, 4 KB hard ceiling, score injection | unit | `npm test -- tests/unit/prompt-builder.test.js` | ❌ W0 | ⏳ pending |
| 02-02-01 | 02 | 2 | `AI-05`, `PRIV-03` | — | Error hierarchy sanitizing API keys, prompts, and evidence | unit | `npm test -- tests/integration/roast-generator.test.js` | ❌ W0 | ⏳ pending |
| 02-02-02 | 02 | 2 | `AI-01`, `AI-02`, `AI-05` | — | Service interface, structured output, 15s abort controller, score immutability | integration | `npm test -- tests/integration/roast-generator.test.js` | ❌ W0 | ⏳ pending |
| 02-02-03 | 02 | 2 | `TEST-03`, `AI-01`, `AI-05` | — | Mocked Gemini suite, consent enforcement, timeouts, 429s | integration | `npm test -- tests/integration/roast-generator.test.js` | ❌ W0 | ⏳ pending |

*Status: ⏳ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `@google/genai` added to `package.json` dependencies
- [ ] `tests/helpers/mock-gemini.js` — Mock Gemini fixtures and generator helper

---

## Manual-Only Verifications

| Verification | When | What to Look For | Why Manual |
|--------------|------|------------------|------------|
| Comedic Nuance & Satirical Voice | After Plan 02 | Verify that generated roast copy maintains dry, witty observational satire without clinical diagnostic phrasing | Tone, comedic pacing, and subtext cannot be fully judged by automated regex alone |
