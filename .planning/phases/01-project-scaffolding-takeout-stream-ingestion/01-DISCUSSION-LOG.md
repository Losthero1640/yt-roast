# Phase 1: Project Scaffolding & Takeout Stream Ingestion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-21  
**Phase:** 1-Project Scaffolding & Takeout Stream Ingestion  
**Areas discussed:** Brainrot scoring algorithm, High-signal evidence extraction limits, Takeout schema resilience & streaming architecture, Bundled demo profile archetype  

---

## 1. Brainrot Scoring Algorithm

| Option | Description | Selected |
|--------|-------------|:--------:|
| Multi-factor weighted composite | 35% late-night ratio (12 AM–5 AM), 35% creator/title repetition, 30% watch velocity | ✅ |
| Exponential late-night penalty | Baseline score with steep hockey-stick spike if >20% late night | |
| Threshold milestone scoring | Additive points awarded on crossing specific red-flag thresholds | |

**Follow-up: Watch Velocity Metric**
- User selected: Binge clustering / rapid-fire sessions (% of videos watched in short succession or rapid intervals <15–30 min).

**Follow-up: Repetition Metric**
- User selected: Combined concentration (20% top-5 creator dominance + 15% identical title re-watches).

**Follow-up: Score Tiers**
- User selected: 5 granular tiers (`0–19 Monk`, `20–44 Casual`, `45–69 Slime Brain`, `70–89 Deep Fried`, `90–100 Digital Zombie`).

**Follow-up: Missing Data Handling**
- User selected: Graceful degradation with explicit data-quality tracking. Exclude missing/unparseable timestamps from time calculations, renormalize weights over available metrics, do not infer absence of late-night viewing, return data-quality flags.

---

## 2. High-Signal Evidence Extraction Limits

| Option | Description | Selected |
|--------|-------------|:--------:|
| Dynamic tiering for creators | Top 5 highlighted with view counts & share %; ranks 6–15 listed as names only | ✅ |
| Top 10 creators with counts | Compact token footprint, top 10 with watch counts and shares | |
| Full Top 15 creators with counts | All 15 creators with full stats | |

**Follow-up: Repeated Titles Limit**
- User selected: Extract Top 5 most-repeated video titles with exact play counts (>=3 plays threshold) plus aggregate replay events across history `sum(play count - 1)` for titles with >=2 plays.

**Follow-up: Late-Night Titles Limit**
- User selected: Top 5 distinct late-night video titles (12 AM–5 AM) prioritizing repeat titles, then 2 AM–4 AM peak goblin hours, with derived local viewing hour (e.g. "watched around 2 AM"). No duplicates, no exact timestamps.

**Follow-up: Topic Clusters & Rabbit Holes**
- User selected: Hybrid approach — deterministic rapid-fire session clustering using configurable session-gap threshold + lightweight keyword heuristics; Gemini performs synthesis and contrasting pairings based only on supplied session evidence.

---

## 3. Takeout Schema Resilience & Streaming Architecture

| Option | Description | Selected |
|--------|-------------|:--------:|
| Defensive normalization | Strip leading 'Watched ' case-insensitively when followed by whitespace, extract creator from subtitles (fallback to 'Unknown Channel'), never reject on language | ✅ |
| Strict English-only | Reject or mark foreign-language Takeouts as unsupported | |
| Raw title preservation | Keep raw 'Watched ' prefix intact | |

**Follow-up: Deleted & Removed Video Placeholders**
- User selected: Explicit case-insensitive allowlist of recognized Takeout placeholder forms. Exclude from evidence; track count as aggregate metric `deletedVideoCount`. Preserve legitimate titles containing words like "removed" or "private".

**Follow-up: Malformed JSON Handling**
- User selected: Fast-fail on truncated or syntactically corrupted JSON. Abort parsing immediately, clean up streams/sockets, return `INVALID_JSON` error. Zero disk writes.

**Follow-up: Stream Pipeline Architecture**
- User selected: Incremental streaming JSON parser (`stream-json`) with bounded buffering, backpressure, and online reducer. Zero disk writes, bounded heap (<30MB incremental, <50MB peak heap on 50MB+ fixture). Verified via filesystem-write interception tests.

---

## 4. Bundled Demo Profile Archetype

| Option | Description | Selected |
|--------|-------------|:--------:|
| 'The 3 AM Productivity Goblin' | Late-night self-help, gaming speedruns, ambient lo-fi loops, rapid-fire meme binges, contrasting rabbit-hole clusters | ✅ |
| 'The Productivity Optimizer' | Morning routines, cold plunges, grindset podcasts, secret meme binges | |
| 'The Chronic Nostalgia Addict' | Early-2000s commercials, discontinued snacks, retro game soundtracks | |

**Follow-up: Fixture Architecture**
- User selected: Bundled dual fixture: synthetic Takeout JSON fixture for pipeline tests + pre-computed normalized profile module for zero-latency demo endpoint (no Gemini call on demo). Automated test asserts sync between the two.

**Follow-up: Record Volume**
- User selected: 300–500 records (spanning 60–90 days, ~60KB file size).

**Follow-up: Schema Alignment**
- User selected: Pre-baked demo roast report conforms 100% to the target Phase 2 Zod roast schema.

---

## Agent Discretion

- Standard Fastify plugins (helmet, CORS, pino logging configuration).
- Concrete implementation of synthetic Takeout fixture generation script.

## Deferred Ideas

- None — discussion stayed within Phase 1 scope.
