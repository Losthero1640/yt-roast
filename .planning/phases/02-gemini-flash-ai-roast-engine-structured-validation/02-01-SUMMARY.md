# Plan 02-01 Summary: SDK Setup, Schema Augmentation & Size-Capped Prompt Builder

**Executed:** 2026-10-21  
**Status:** Complete  
**Wave:** 1 of 2  
**Test Suite:** 39 passed (9 new prompt-builder unit tests, 30 existing Phase 1 tests)

---

## 1. Accomplishments

### Task 02-01-01: Install `@google/genai`
- Added `@google/genai` (`^2.30.0`) to `package.json` dependencies.
- Verified plain JavaScript ES modules (`"type": "module"`) with zero TypeScript and zero database dependencies.
- Installed cleanly with 0 vulnerabilities; existing Phase 1 test suite passed with 30/30 green.

### Task 02-01-02: Schema Augmentation & Joke Grounding (`src/schemas/roast.js`)
- Defined `EnhancedRoastReportSchema`:
  - Enforces minimum 4 jokes (`.min(4)`).
  - Asserts representation of all 4 required styles in `RoastJokeStyleEnum`: `"pattern"`, `"combination"`, `"specific"`, `"archetype"`.
  - Asserts specific jokes have a non-empty `referencedItem`.
  - Enforces 3 to 5 `redFlags` (`.min(3).max(5)`).
- Defined `FullRoastResultSchema`:
  - Pairs `roast: EnhancedRoastReportSchema` with `scoreDetails: BrainrotScoreResultSchema`, permanently binding the deterministic Phase 1 score, tier, confidence, subscores, and data quality metadata.
- Implemented `validateJokeGrounding(report, allowedEvidence)`:
  - Verifies that every `referencedItem` in specific jokes matches a creator or title provided in the evidence summary, preventing hallucinated references.

### Task 02-01-03: Size-Capped Prompt Builder (`src/ai/prompt-builder.js`)
- Enforces strict evidence caps:
  - Top 5 primary creators (clamped to 80 chars, view count, share %).
  - Top 10 secondary creators (clamped names).
  - Top 5 repeat titles with $\ge 3$ plays (clamped to 80 chars, replay ratio).
  - Top 5 late-night titles with derived hour labels (e.g., `"watched around 2 AM"`).
  - Up to 8 candidate topics.
  - Injects locked deterministic score, tier, and subscores.
- Defensive length clamping: `clampText(str, 80)` sanitizes null bytes/control characters and trims to 80 characters.
- Privacy boundary (`PRIV-03`):
  - Completely strips URLs (`titleUrl`, channel URLs, `http://`, `https://`).
  - Purges exact ISO timestamps (relative day spans and derived hour strings only).
  - Purges Google account IDs, emails, IP addresses, and bulk logs.
- Hard serialization ceiling: Measures `Buffer.byteLength(prompt, 'utf8')` and immediately throws `PayloadTooLargeError` (`code: 'PROMPT_TOO_LARGE'`) if $> 4,096$ bytes, rejecting oversized payloads prior to any outbound network calls.
- Helper `extractAllowedEvidence(profile)` returns sets of valid creators and titles for post-generation hallucination verification.

---

## 2. Verification Results

All 9 unit tests in `tests/unit/prompt-builder.test.js` pass:
- Prompt assembly under 4KB with locked score injection.
- URL, ISO timestamp, and identifier purging (`PRIV-03`).
- 80-character title and creator clamping.
- Malformed/malicious script and unicode sanitization.
- Hard 4,096-byte measurement and rejection with `PayloadTooLargeError`.
- Allowed evidence extraction.
- Enhanced schema validation & joke grounding.
- Rejection of reports missing required joke styles.
- Detection of hallucinated specific joke references.
