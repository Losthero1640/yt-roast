# Phase 2: Gemini Flash AI Roast Engine & Structured Validation - Context

**Gathered:** 2026-10-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 implements the AI roast generation engine connecting the normalized viewing profile and deterministic Brainrot score from Phase 1 to Google Gemini using the official `@google/genai` SDK in plain JavaScript (ES modules, `"type": "module"`). It delivers:
1. Configurable Gemini model client (`GEMINI_MODEL`, defaulting to `gemini-2.5-flash`, with `GEMINI_API_KEY` loaded exclusively from backend environment variables).
2. Size-capped prompt builder that transmits only selected high-signal evidence (capped creators, repeated titles, derived late-night hours, topics) with a hard 4 KB payload limit while strictly purging user PII, URLs, exact ISO timestamps, and bulk watch logs (`PRIV-03`).
3. Mandatory user consent enforcement prior to sending evidence (`consentGranted: true`).
4. Strict JSON schema structured output (`responseSchema`) with runtime Zod validation (`RoastReportSchema`), enforcing a minimum of 4 jokes across all 4 required styles (`pattern`, `combination`, `specific`, `archetype`), 3–5 red flags, and strict evidence grounding without hallucination.
5. Deterministic score immutability: Gemini cannot alter or recalculate the Brainrot score, tier, confidence, or subscores from Phase 1.
6. Resilient provider error handling with 15-second `AbortController` cancellation, HTTP 429 rate-limit mapping, and sanitized error reporting that never leaks API keys, prompts, or sensitive evidence.
7. Vitest integration test suite utilizing mocked `@google/genai` responses for 100% deterministic local verification without live API keys or outbound network requests.

All implementations strictly adhere to zero database persistence (`PRIV-01`), zero disk writes (`PRIV-02`), and plain JavaScript ES modules.
</domain>

<decisions>
## Implementation Decisions

### 1. Official `@google/genai` SDK & Model Configuration
- **D-15 (SDK & Configuration):**
  - Use the official Google Gen AI SDK (`@google/genai`), which supersedes the deprecated `@google/generative-ai` package (per official Google AI docs, 2025/2026).
  - Credentials: `GEMINI_API_KEY` is read strictly from backend environment configuration (`process.env.GEMINI_API_KEY`). It is never exposed in frontend bundles, never logged, and never committed to source control.
  - Model ID: `GEMINI_MODEL` environment variable, defaulting to `gemini-2.5-flash` (Google's recommended flagship Flash model for fast multimodal/text tasks and structured outputs). Alternate supported Flash models like `gemini-2.0-flash` can be configured via environment variable without code changes.
  - Client instance: `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 15000 } })`.
  - Structured Output: Configured via `config: { responseMimeType: 'application/json', responseSchema: ... }` on `ai.models.generateContent`.
  - Provider Abstraction: All Gemini SDK-specific code is encapsulated inside `src/ai/roast-generator-service.js` behind a standard service interface (`generateRoastReport({ profile, scoreResult, consentGranted })`) so future providers can be plugged in without refactoring core business logic.

### 2. Prompt Limits, Evidence Capping & Privacy Boundaries
- **D-16 (Prompt Builder & Hard Serialization Limits):**
  - Input: `NormalizedViewingProfile` (from `TakeoutNormalizer`) + `BrainrotScoreResult` (from `calculateBrainrotScore`).
  - Evidence Caps:
    - Primary creators: max 5 (with view count & share percentage).
    - Secondary creators: max 10 (names only, ranks 6–15).
    - Repeated titles: max 5 (only qualifying titles with $\ge 3$ plays, plus overall replay ratio).
    - Late-night titles: max 5 (distinct titles with derived hour strings, e.g. `"watched around 2 AM"`).
    - Topic candidates: max 8 keywords.
  - Hard Serialization Ceiling:
    - Target payload size: ~1.5–3 KB.
    - Strict hard ceiling: **4,096 bytes (4 KB)** for the assembled prompt text.
    - Defensive length clamping: Every individual video title and creator name is clamped to a maximum of 80 characters before prompt interpolation to eliminate prompt bloat from abnormally long titles.
  - Data Purging (`PRIV-03`):
    - Zero user profile names, Google account IDs, email addresses.
    - Zero channel URLs or video URLs (`titleUrl` is completely stripped).
    - Zero exact ISO timestamps (`2026-03-14T03:22:19.412Z` is purged; only derived hours like `"watched around 3 AM"` or duration spans like `"over 90 days"` are included).
    - Zero bulk watch logs (never dumps raw histories).
    - Zero client IP addresses, user agents, or request headers.
  - Sensitive Logging Ban:
    - The server must never log raw prompt strings, user evidence payloads, or API keys in standard or debug logs.
- **D-17 (User Consent Enforcement):**
  - Prior to dispatching any evidence payload to the Gemini API, `RoastGeneratorService` validates that explicit user consent was granted (`consentGranted === true`).
  - If consent is missing, false, or undefined, the service immediately throws a `ConsentRequiredError` and terminates the operation before making any outbound API call.

### 3. Report Quality, Comedic Guardrails & Schema Validation
- **D-18 (Canonical Schema Enforcement & Joke Quality Rules):**
  - The model output must validate against the canonical `RoastReportSchema` from Phase 1 (`src/schemas/roast.js`):
    - `brainrotScore`: integer (0–100)
    - `viewingArchetype`: string
    - `roastSummary`: string (substantive opening monologue)
    - `roasts`: array of structured jokes
    - `redFlags`: array of 3–5 recurring behavioral patterns
    - `finalVerdict`: string
    - `cardPayload`: shareable card metadata (`brainrotScore`, `tier`, `headline`, `topCrime`)
  - Quality Refinements:
    - Minimum joke count: At least **4 jokes** total (`roasts.length >= 4`).
    - Joke style representation: The report must include at least one joke for every required style in `RoastJokeStyleEnum`:
      1. `"pattern"` (habits, creator concentration, or velocity)
      2. `"combination"` (linking at least two distinct viewing behaviors)
      3. `"specific"` (grounded in a specific title or creator)
      4. `"archetype"` (critiquing the user's comedic persona)
    - Grounding & Anti-Hallucination:
      - Specific jokes (`style: "specific"`) must populate `referencedItem` with a creator name or title that actually exists in the provided evidence.
      - Combination jokes (`style: "combination"`) must cite at least two distinct patterns in `supportingEvidence`.
      - Gemini is explicitly instructed that fabricating creators, titles, or viewing habits outside the provided evidence is strictly forbidden.
    - Satirical Tone Guardrails:
      - Distinguish factual viewing observations from satirical exaggeration.
      - Forbid repetitive templates (e.g. repeated "You know you're..." formulas).
      - Forbid clinical diagnostic assertions (e.g., "you have clinical ADHD/insomnia" $\rightarrow$ convert to satirical behavioral exaggeration).
- **D-19 (Deterministic Score Immutability):**
  - The deterministic `BrainrotScoreResult` (score, tier, confidence, subscores, dataQuality) calculated in Phase 1 is the single source of truth.
  - The prompt passes the calculated score and tier to Gemini as context so jokes match the severity.
  - Upon receiving Gemini's response, `RoastGeneratorService` overrides the returned `brainrotScore` and `cardPayload.brainrotScore` / `cardPayload.tier` with the deterministic values from Phase 1.
  - The service returns a composite payload pairing the validated `roast` report with the full deterministic `scoreDetails` (`BrainrotScoreResult`).

### 4. Resilient Error Handling & Cancellation
- **D-20 (15-Second Timeout & Sanitized Domain Errors):**
  - Request Timeout: Every Gemini request is bound to an `AbortController` with a 15,000 ms (15s) timer. If the timer expires before Gemini responds, the controller aborts the request and throws `GeminiTimeoutError`.
  - Rate Limiting (429): If Gemini returns HTTP 429 (Resource Exhausted), the service catches the error and throws `GeminiRateLimitError` with a user-friendly retry message.
  - Schema & Truncation Failures: If Gemini returns truncated JSON, invalid JSON, or fails Zod validation, the service catches the error and throws `GeminiValidationError`.
  - Service Availability (5xx / Network): Mapped to `GeminiServiceError`.
  - Sanitization: All error classes ensure that error messages and stack traces never echo the API key, full prompt, or user viewing evidence.

### 5. Deterministic Testing Strategy
- **D-21 (Mocked Testing & Test Matrix):**
  - Vitest integration tests mock `@google/genai` using `vi.mock('@google/genai')` to test all success and failure branches without requiring live API keys or making external network calls (`TEST-03`).
  - Test suites:
    1. `tests/unit/prompt-builder.test.js`: Validates prompt assembly, evidence capping, title clamping, hard 4 KB payload limit, PII/URL stripping, and score injection.
    2. `tests/integration/roast-generator.test.js`: Validates successful roast generation, schema validation, evidence grounding, score immutability, 15s timeout aborts, 429 rate limit mapping, missing consent rejection, and sanitized error formatting.
  - Phase 1 test suite (30 tests) must continue to pass 100% green without regressions.
</decisions>

<verification_matrix>
## Phase 2 Verification Matrix

| Requirement | Description | Verified By |
|---|---|---|
| `AI-01` | Google Gemini API integration with configurable `GEMINI_MODEL` (default `gemini-2.5-flash`) and `GEMINI_API_KEY` | `tests/integration/roast-generator.test.js` |
| `AI-02` | Strict structured output via `responseSchema` and Zod validation | `tests/integration/roast-generator.test.js` |
| `AI-03` | Canonical multi-joke roast report schema (score, archetype, summary, roasts, 3–5 red flags, verdict, cardPayload) | `tests/integration/roast-generator.test.js` |
| `AI-04` | Comedic variety guardrails (4 required styles, combination rules, specific grounding, anti-hallucination) | `tests/unit/prompt-builder.test.js`, `tests/integration/roast-generator.test.js` |
| `AI-05` | Resilient error handling, 15s abort controller, HTTP 429 rate limit mapping, service failure handling | `tests/integration/roast-generator.test.js` |
| `PRIV-03` | Outbound payload privacy boundary: purge PII, URLs, exact timestamps, and bulk logs; hard 4 KB limit | `tests/unit/prompt-builder.test.js` |
| `TEST-03` | Vitest integration test suite with mocked Gemini responses covering success, schemas, timeouts, and errors | `tests/integration/roast-generator.test.js` |
</verification_matrix>
