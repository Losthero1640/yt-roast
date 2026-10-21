# Phase 1: Project Scaffolding & Takeout Stream Ingestion - Context

**Gathered:** 2026-10-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational TypeScript backend, Fastify HTTP server setup, in-memory streaming JSON parser (`stream-json`), deleted-video placeholder filter, UTF-8 character resilience, statistical normalizer with deterministic Brainrot scoring, synthetic demo viewing profile, and Vitest fixture test suite. It guarantees zero persistent database storage and zero disk writes throughout the ingestion and normalization lifecycle.
</domain>

<decisions>
## Implementation Decisions

### 1. Brainrot Scoring Algorithm & Precise Subscores
- **D-01 (Formulas & Weighting):** The deterministic 0–100 Brainrot score is calculated from three normalized 0–100 subscores:
  $$\text{Score} = \text{round}(S_{\text{late}} \times 0.35 + S_{\text{rep}} \times 0.35 + S_{\text{vel}} \times 0.30)$$
  - **Late-Night Subscore ($S_{\text{late}}$, 35% weight):**
    - $R_{\text{late}} = (\text{views between 12:00 AM and 4:59 AM}) / (\text{total valid-timestamp views})$
    - Normal baseline $\le 5\%$, severe threshold $\ge 25\%$:
    - $S_{\text{late}} = \min(100, \text{round}((R_{\text{late}} / 0.25) \times 100))$
  - **Creator & Title Repetition Subscore ($S_{\text{rep}}$, 35% weight):**
    - Composed of 20% Top-5 Creator concentration + 15% Title Re-watches:
    - $C_{\text{top5}} = (\text{views of top 5 creators}) / (\text{total valid views})$. Normal $\le 15\%$, high $\ge 50\%$:
      $S_{\text{creator}} = \min(100, \max(0, \text{round}(((C_{\text{top5}} - 0.15) / 0.35) \times 100)))$
    - $T_{\text{rep}} = (\sum(\text{playCount} - 1) \text{ for titles with } \ge 2 \text{ plays}) / (\text{total valid views})$. Normal $\le 2\%$, high $\ge 12\%$:
      $S_{\text{title}} = \min(100, \text{round}((T_{\text{rep}} / 0.12) \times 100))$
    - Combined: $S_{\text{rep}} = \text{round}((S_{\text{creator}} \times 20 + S_{\text{title}} \times 15) / 35)$
  - **Watch Velocity Subscore ($S_{\text{vel}}$, 30% weight):**
    - $V_{\text{cluster}} = (\text{views watched within } \le 20 \text{ min of previous view}) / (\text{total valid-timestamp views} - 1)$
    - Normal $\le 15\%$, severe doomscrolling $\ge 60\%$:
    - $S_{\text{vel}} = \min(100, \max(0, \text{round}(((V_{\text{cluster}} - 0.15) / 0.45) \times 100)))$
  — **Reversibility:** reversible — all normalization coefficients and thresholds are isolated constants.
- **D-02 (Comedic Tiers):** Normalizer assigns a 5-tier comedic classification based on the 0–100 score:
  - `0–19`: **Monk**
  - `20–44`: **Casual**
  - `45–69`: **Slime Brain**
  - `70–89`: **Deep Fried**
  - `90–100`: **Digital Zombie**
  — **Reversibility:** reversible.
- **D-03 (Missing Data & Explicit Quality / Confidence Tracking):**
  - Distinguish a genuinely low score from a score calculated on incomplete evidence.
  - The scoring output structure must include:
    ```typescript
    export interface BrainrotScoreResult {
      score: number;
      tier: "Monk" | "Casual" | "Slime Brain" | "Deep Fried" | "Digital Zombie";
      confidence: "high" | "medium" | "low";
      subscores: {
        lateNight: number | null;
        repetition: number;
        velocity: number | null;
      };
      dataQuality: {
        totalRecords: number;
        validRecords: number;
        missingTimestampCount: number;
        timestampValidityRate: number;
        isDegraded: boolean;
        degradedNotice?: string;
      };
    }
    ```
  - If timestamps are missing/insufficient (<20 valid timestamps), $S_{\text{late}}$ and $S_{\text{vel}}$ are `null`, weights are renormalized over $S_{\text{rep}}$, `confidence` is forced to `"low"`, and `degradedNotice` explicitly states that time metrics were omitted rather than assuming zero late-night activity.
  — **Reversibility:** reversible.

### 2. High-Signal Evidence Extraction Limits
- **D-04 (Top Creators):** Dynamic tiering: Top 5 creators highlighted with exact view counts and share percentages; ranks 6–15 listed as channel names only.
  — **Reversibility:** reversible.
- **D-05 (Repeated Video Titles):** Extract Top 5 most-repeated video titles with exact play counts, requiring at least 3 plays per title to qualify. Also include aggregate count of replay events across history, calculated deterministically as sum of `(play count - 1)` for each distinct normalized video title with >= 2 plays. Titles below the 3-play threshold are excluded from the detailed list. Capped and strictly size-bounded.
  — **Reversibility:** reversible.
- **D-06 (Late-Night Titles):** Extract at most Top 5 distinct late-night video titles watched between 12:00 AM and 5:00 AM. Deterministic selection priority:
  1. Repeated titles within the late-night window
  2. Titles from the peak goblin hours (2:00 AM–4:00 AM)
  3. Other late-night titles
  Include derived local viewing-hour context (e.g., "watched around 2 AM"), never exact ISO timestamps. No duplicate video titles. If fewer than 5 valid items exist, return fewer.
  — **Reversibility:** reversible.
- **D-07 (Topic Clusters & Rabbit Holes):** Hybrid session clustering:
  - Deterministically cluster viewing records into rapid-fire sessions using timestamps with a documented, configurable session-gap threshold (20 minutes).
  - Extract candidate topic and creator patterns from selected high-signal titles and creator names using lightweight keyword heuristics without requiring a full taxonomy.
  - Pass only selected titles, creator names, session-level summaries, and derived topic candidates to Gemini (Phase 2) for thematic synthesis and contrasting pairings. No hallucinated connections outside supplied session evidence.
  — **Reversibility:** reversible.

### 3. Takeout Schema Resilience & Zero-Disk Streaming Pipeline
- **D-08 (Title & Creator Normalization):** Defensive normalization while preserving original values in memory for debugging only. Strip leading `"Watched "` case-insensitively only when it is a known Takeout activity prefix followed by whitespace; preserve remaining title exactly, including Unicode and non-English text. Never reject exports based on language. Extract creator names from `subtitles` when valid; fallback to `"Unknown Channel"` rather than crashing.
  — **Reversibility:** reversible.
- **D-09 (Deleted & Removed Video Placeholders):** Explicit, case-insensitive allowlist of recognized Takeout placeholder forms (`"Watched a video that has been removed"`, `"Watched a video that is no longer available"`, `"Watched a private video"`). Exclude confirmed placeholders from title/creator/time evidence. Track their count as a separate aggregate metric (`deletedVideoCount`). Preserve legitimate titles that merely contain words like "removed" or "private".
  — **Reversibility:** reversible.
- **D-10 (Malformed JSON & Truncation):** Fast-fail on truncated or syntactically corrupted JSON. Abort parsing immediately, clean up streams/sockets, and return a clear user-friendly error (`INVALID_JSON`). Do not write partial history to disk or retain partial results.
  — **Reversibility:** reversible.
- **D-11 (Zero-Disk Multipart & Stream Pipeline Architecture):**
  - **Multipart Configuration:** `@fastify/multipart` is configured with `attachFieldsToBody: false` and zero disk-temp adapters. The file stream is piped directly into `stream-json` parser via `stream.pipeline()`. Using a streaming JSON parser alone does not prevent disk writes; multipart middleware must never spool to disk.
  - **Memory Bounds & 50MB+ Benchmark:** Incremental streaming JSON parser (`stream-json`) using an online reducer with backpressure. Never load full upload or parsed history into memory.
  - **Automated Memory & Disk Verification:** Dedicated test suite executes against a **50MB+ synthetic fixture** asserting:
    1. Incremental heap usage $< 30$ MB (`peakHeap - baselineHeap < 30MB`)
    2. Peak heap usage $< 50$ MB
    3. Filesystem-write interception (`vi.spyOn(fs, 'writeFile')`, `createWriteStream`, etc.) verifying zero disk calls.
  — **Reversibility:** costly — core streaming architectural contract.

### 4. Bundled Demo Profile Archetype & Schema Timing
- **D-12 (Comedic Archetype):** "The 3 AM Productivity Goblin" — synthetic persona combining late-night self-help/productivity videos, repeated gaming speedruns, long ambient/lo-fi loops, rapid-fire meme binges, contrasting topic clusters (productivity vs gaming vs memes), and at least 2 repeated video titles with realistic play counts. Internally consistent with timestamps, creator concentration, replay counts, and deterministic Brainrot score.
  — **Reversibility:** reversible.
- **D-13 (Canonical Schema Defined in Phase 1 — No Interim Throwaways):**
  - Phase 1 defines the canonical TypeScript interfaces and Zod schema in `src/types/roast.ts` matching requirement `AI-03` exactly (`brainrotScore`, `viewingArchetype`, `roastSummary`, `roasts` array with style/joke/evidence, `redFlags`, `finalVerdict`, `cardPayload`).
  - Phase 1 does NOT invent a separate or interim demo schema. The bundled demo report uses the final Phase 2 schema contract from day one.
- **D-14 (Dual Fixture Architecture):**
  - Synthetic Takeout JSON fixture (`fixtures/synthetic-takeout.json`) containing 300–500 records (spanning 60–90 days, ~60KB) for streaming pipeline and normalizer tests.
  - Pre-computed normalized profile module (`fixtures/demo-profile.ts`) matching the canonical schema for the zero-latency demo endpoint without calling Gemini or reparsing JSON on each request.
  - Automated test asserts that streaming the synthetic fixture through the normalizer yields matching metrics to the precomputed profile.
  — **Reversibility:** costly — locks schema timing and dual-fixture sync.

### Agent Discretion
- Exact configuration of Fastify server plugins (logger levels, CORS setup, helmet headers) left to agent discretion following standard Node.js best practices.
- Specific fixture generation script to create the 300–500 record synthetic Takeout dataset left to agent discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Roadmap Contracts
- `.planning/PROJECT.md` — Core vision, zero-database principle, dual-mode specifications, and roast comedic guidelines.
- `.planning/REQUIREMENTS.md` — Requirements `INGEST-01` to `INGEST-04`, `NORM-01` to `NORM-05`, `PRIV-01`, `PRIV-02`, `TEST-01`, `TEST-02`.
- `.planning/ROADMAP.md` — Phase 1 success criteria and execution boundaries.
- `.planning/research/STACK.md` — Streaming parser rationale, Fastify selection, Vitest testing strategy.
- `.planning/research/ARCHITECTURE.md` — In-memory stream pipeline diagram and normalizer design.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (brand new repository, Phase 1 establishes the initial TypeScript codebase).

### Established Patterns
- Zero-database and zero disk writes architecture: ephemeral RAM processing only.
- Strict PII sanitization: no raw history, URLs, or exact timestamps forwarded downstream.

### Integration Points
- Normalizer output provides the structured high-signal payload consumed by the Gemini Roast Service in Phase 2.
- Streaming parser interfaces directly with Fastify multipart upload stream in Phase 3.

</code_context>

<specifics>
## Specific Ideas

- Synthetic persona "The 3 AM Productivity Goblin" balances self-help hubris (e.g. "Morning Routine of a CEO" watched at 3:45 AM) with dopamine loops (Minecraft parkour, lo-fi beats, meme compilations), providing immediate comedic contrast for testing and preview.
- Deterministic Brainrot tiers (`Monk`, `Casual`, `Slime Brain`, `Deep Fried`, `Digital Zombie`) give instant intuitive gamification to the score.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope.

</deferred>

---

*Phase: 1-Project Scaffolding & Takeout Stream Ingestion*  
*Context gathered: 2026-10-21*
