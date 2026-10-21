# Phase 1: Project Scaffolding & Takeout Stream Ingestion - Context

**Gathered:** 2026-10-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational TypeScript backend, Fastify HTTP server setup, in-memory streaming JSON parser (`stream-json`), deleted-video placeholder filter, UTF-8 character resilience, statistical normalizer with deterministic Brainrot scoring, synthetic demo viewing profile, and Vitest fixture test suite. It guarantees zero persistent database storage and zero disk writes throughout the ingestion and normalization lifecycle.
</domain>

<decisions>
## Implementation Decisions

### 1. Brainrot Scoring Algorithm
- **D-01 (Formula):** Deterministic multi-factor weighted composite:
  - **35% Late-Night Binge Ratio:** Proportion of views occurring between 12:00 AM and 5:00 AM over total valid-timestamp views.
  - **35% Creator & Title Repetition:** 20% allocated to top-5 creator watch concentration + 15% allocated to identical video title re-watches (titles with >=2 plays).
  - **30% Watch Velocity & Clustering:** Percentage of views occurring in rapid-fire succession within short configurable session intervals (<15–30 minutes), signaling doomscrolling and rabbit-holing.
  — **Reversibility:** reversible — weights and thresholds are isolated constants in the normalizer config.
- **D-02 (Comedic Tiers):** Normalizer assigns a 5-tier comedic classification based on the 0–100 score:
  - `0–19`: **Monk**
  - `20–44`: **Casual**
  - `45–69`: **Slime Brain**
  - `70–89`: **Deep Fried**
  - `90–100`: **Digital Zombie**
  — **Reversibility:** reversible — tier boundaries and labels are deterministic string mappings.
- **D-03 (Missing Data & Graceful Degradation):** Graceful degradation with explicit data-quality tracking:
  - Exclude records with missing or unparseable timestamps from time-based calculations, while retaining them for valid non-time metrics (creator concentration, replay counts).
  - Calculate each metric only when sufficient valid data exists, and renormalize weights across available metrics only.
  - If a metric lacks sufficient data, mark it unavailable (`null` with metadata flag) rather than treating it as zero (never infer that late-night viewing is absent merely because timestamps are missing).
  - Include data-quality flags in normalizer output (`dataQualityFlags: { hasValidTimestamps: boolean, missingTimestampCount: number, degradedMetrics: string[] }`).
  - Score stays 100% deterministic.
  - Test empty histories, malformed timestamps, duplicate records, and datasets with insufficient valid timestamps.
  — **Reversibility:** reversible — clean defensive logic in normalization reducer.

### 2. High-Signal Evidence Extraction Limits
- **D-04 (Top Creators):** Dynamic tiering: Top 5 creators highlighted with exact view counts and share percentages; ranks 6–15 listed as channel names only.
  — **Reversibility:** reversible — controls array slicing and shaping into the prompt context.
- **D-05 (Repeated Video Titles):** Extract Top 5 most-repeated video titles with exact play counts, requiring at least 3 plays per title to qualify. Also include aggregate count of replay events across history, calculated deterministically as sum of `(play count - 1)` for each distinct normalized video title with >= 2 plays. Titles below the 3-play threshold are excluded from the detailed list. Capped and strictly size-bounded.
  — **Reversibility:** reversible — filtering thresholds in evidence extractor.
- **D-06 (Late-Night Titles):** Extract at most Top 5 distinct late-night video titles watched between 12:00 AM and 5:00 AM. Deterministic selection priority:
  1. Repeated titles within the late-night window
  2. Titles from the peak goblin hours (2:00 AM–4:00 AM)
  3. Other late-night titles
  Include derived local viewing-hour context (e.g., "watched around 2 AM"), never exact ISO timestamps. No duplicate video titles. If fewer than 5 valid items exist, return fewer.
  — **Reversibility:** reversible — sorting and sampling rules in evidence extractor.
- **D-07 (Topic Clusters & Rabbit Holes):** Hybrid session clustering:
  - Deterministically cluster viewing records into rapid-fire sessions using timestamps with a documented, configurable session-gap threshold (e.g., 15–30 minutes).
  - Extract candidate topic and creator patterns from selected high-signal titles and creator names using lightweight keyword heuristics without requiring a full taxonomy.
  - Pass only selected titles, creator names, session-level summaries, and derived topic candidates to Gemini (Phase 2) for thematic synthesis and contrasting pairings. No hallucinated connections outside supplied session evidence.
  — **Reversibility:** reversible — modular session segmentation function.

### 3. Takeout Schema Resilience & Streaming Architecture
- **D-08 (Title & Creator Normalization):** Defensive normalization while preserving original values in memory for debugging only. Strip leading `"Watched "` case-insensitively only when it is a known Takeout activity prefix followed by whitespace; preserve remaining title exactly, including Unicode and non-English text. Never reject exports based on language. Extract creator names from `subtitles` when valid; fallback to `"Unknown Channel"` rather than crashing.
  — **Reversibility:** reversible — regex title cleaner and extractor helper.
- **D-09 (Deleted & Removed Video Placeholders):** Explicit, case-insensitive allowlist of recognized Takeout placeholder forms (`"Watched a video that has been removed"`, `"Watched a video that is no longer available"`, `"Watched a private video"`). Exclude confirmed placeholders from title/creator/time evidence. Track their count as a separate aggregate metric (`deletedVideoCount`). Preserve legitimate titles that merely contain words like "removed" or "private".
  — **Reversibility:** reversible — allowlist regex/set filter in streaming parser.
- **D-10 (Malformed JSON & Truncation):** Fast-fail on truncated or syntactically corrupted JSON. Abort parsing immediately, clean up streams/sockets, and return a clear user-friendly error (`INVALID_JSON`). Do not write partial history to disk or retain partial results.
  — **Reversibility:** reversible — stream error handler in parser pipeline.
- **D-11 (Stream Pipeline & Memory Budget):** Genuinely incremental streaming JSON parser (`stream-json`) using an online reducer with backpressure. Never load full upload or parsed history into memory; keep only running aggregates and capped evidence. Zero disk writes throughout request lifecycle (multipart stream directly into parser; verify with fs write interception tests). Bounded heap (<30MB incremental, <50MB peak heap on 50MB+ fixture).
  — **Reversibility:** costly — changing stream ingestion architecture would touch core pipeline and test harnesses.

### 4. Bundled Demo Profile Archetype
- **D-12 (Comedic Archetype):** "The 3 AM Productivity Goblin" — synthetic persona combining late-night self-help/productivity videos, repeated gaming speedruns, long ambient/lo-fi loops, rapid-fire meme binges, contrasting topic clusters (productivity vs gaming vs memes), and at least 2 repeated video titles with realistic play counts. Internally consistent with timestamps, creator concentration, replay counts, and deterministic Brainrot score.
  — **Reversibility:** reversible — synthetic fixture file.
- **D-13 (Dual Fixture Architecture):**
  - Synthetic Takeout JSON fixture (`fixtures/synthetic-takeout.json`) containing 300–500 records (spanning 60–90 days, ~60KB) for streaming pipeline and normalizer tests.
  - Pre-computed normalized profile module (`fixtures/demo-profile.ts`) for the zero-latency demo endpoint.
  - Automated test running the synthetic fixture through the real normalizer to assert that the pre-computed profile matches.
  - Demo endpoint does NOT invoke Gemini or parse raw JSON on each request.
  — **Reversibility:** reversible — fixture maintenance and test validator.
- **D-14 (Schema Alignment):** Pre-baked demo roast report conforms 100% to the Phase 2 Zod roast schema (`brainrotScore`, `viewingArchetype`, `roastSummary`, `roasts` array with style/joke/evidence, `redFlags`, `finalVerdict`, `cardPayload`) so frontend and API consumers treat demo and live roasts identically.
  — **Reversibility:** costly — aligns Phase 1 mock contract with Phase 2 LLM output schema.

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
