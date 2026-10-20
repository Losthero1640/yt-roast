# YouTube Roast AI

## What This Is

A privacy-conscious, witty web application that analyzes a user's available YouTube viewing-related data to generate a personalized, brutally honest, humorous AI roast report. The roast calculates a "Brainrot score," flags recurring content rabbit holes, and provides an entertaining personality analysis grounded strictly in observed viewing data without persisting personal history.

## Core Value

Generate a savagely funny, authentic, and shareable AI roast of the user's YouTube habits while ensuring 100% data privacy with zero persistent database storage.

## Core Product Principles

1. **Privacy by Design:** Privacy is a core architectural requirement, not an afterthought.
2. **Zero Raw Persistence:** Never persist raw viewing history, OAuth tokens, uploaded history files, or personal analysis in any database or disk cache.
3. **Data Minimization:** Compress thousands of video entries into compact, anonymized aggregate metrics before invoking the AI model.
4. **Isolated Processing:** Ephemeral, in-memory processing only during request lifecycles. Immediate garbage collection after roast generation.
5. **No Speculation as Fact:** Distinguish comedic observations from speculative psychological conclusions; anchor jokes in actual observed data.
6. **No Phantom Access:** Transparently disclose the data source. Never claim to have analyzed full watch history if only analyzing public subscriptions/likes.
7. **Simplicity First:** Maintain a lightweight, lean stack. Reject unnecessary databases, message queues, Docker complexity, or microservices for MVP.

## Architecture & Dual-Mode Strategy

The application provides a dual-mode experience tailored to user preference and technical feasibility:

* **Mode A: Instant Roast (Google OAuth)**
  * **User Experience:** One-click Google sign-in.
  * **Data Scope:** Analyzes accessible YouTube Data API v3 resources (`subscriptions`, `liked videos`, and `playlists`) using `https://www.googleapis.com/auth/youtube.readonly`.
  * **Disclosure:** Clear UI badge explicitly stating: *"Roast based on your Subscriptions & Liked Videos Taste Profile"*.
  * **Development Setup:** Tested via mock fixtures first; live Google Cloud OAuth credentials configured via backend `.env`.

* **Mode B: Full History Roast (Google Takeout Upload)**
  * **User Experience:** Guided drag-and-drop of Google Takeout export (`watch-history.json`).
  * **Data Scope:** Complete chronological watch history including late-night binges, repeated videos, and obscure rabbit holes.
  * **Processing:** In-memory streaming JSON parser (`stream-json`), discarding raw objects on the fly, summarizing into top channels, peak watching hours, content clusters, and repeat counts.
  * **Disclosure:** *"Full Watch History Roast"*.

* **Demo / Sample Mode:** Pre-loaded synthetic sample profiles allowing immediate exploration of the roast report without signing in or uploading files.

## AI Model & Provider Specification

* **Primary Engine:** Google Gemini API — Gemini Flash (`gemini-3.8-flash` / `gemini-2.5-flash`) via Google AI Studio API key.
* **Structured Output:** Enforced JSON schema generation via native `responseSchema` and validated via Zod on the backend.
* **Safety & Resilience:** Rate-limiting handlers, graceful degradation on insufficient data (<20 entries), and strict prompt grounding rules.

## Requirements

### Validated
(None yet — milestone 1 in progress)

### Active (v1 Scope)
- [ ] Ingestion: Streaming in-memory JSON parser for Takeout `watch-history.json` with malformed/deleted entry resilience.
- [ ] Ingestion: OAuth 2.0 flow for YouTube Data API v3 (`subscriptions.list`, `videos.list` likes) with fixture tests.
- [ ] Aggregator: Statistical normalizer calculating channel frequencies, binge-hour ratios, repeat views, and brainrot metrics.
- [ ] AI Engine: Gemini Flash prompt builder and strict JSON schema generator.
- [ ] Report Schema: Structured output featuring Brainrot score (0-100), personalized roast, red flags, personality archetype, and verdict.
- [ ] API Contract: Backend REST endpoints (`/api/roast/upload`, `/api/roast/oauth`, `/api/roast/demo`, `/api/health`).
- [ ] Test Suite: Vitest unit and integration suite covering synthetic Takeout data, edge cases, and mocked LLM responses.

### Out of Scope for MVP
- Frontend UI generation (deferred to Phase 2/3 after backend contract verification).
- Persistent user accounts, authentication databases, or saved report databases.
- Multi-provider fallback (OpenAI integration deferred until demonstrated necessity).
- Native browser extension client.
- Video duration calculations (Google Takeout does not track video duration).
