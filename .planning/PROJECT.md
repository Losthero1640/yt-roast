# YouTube Roast AI

## What This Is

A privacy-conscious, witty web application that analyzes a user's available YouTube viewing-related data to generate a personalized, brutally honest, humorous AI roast report. The roast calculates a "Brainrot score," flags recurring content rabbit holes, and provides an entertaining personality analysis grounded strictly in observed viewing data without persisting personal history.

## Core Value

Generate a savagely funny, authentic, and shareable AI roast of the user's YouTube habits while ensuring strict data privacy with zero persistent database storage.

## Core Product Principles

1. **Privacy by Design:** Privacy is a core architectural requirement, not an afterthought.
2. **Zero Raw Persistence:** Never persist raw viewing history, OAuth tokens, uploaded history files, or personal analysis in any database or disk cache.
3. **Data Minimization & Curated Evidence:** Compress raw viewing history into high-level aggregate metrics accompanied only by curated, high-signal evidence (notable repeated titles, creator names, and derived viewing hours) necessary for comedic punchlines, while strictly excluding bulk logs, channel URLs, user identifiers, and exact timestamps.
4. **Ephemeral Request Processing & Zero Disk Spooling:** Process incoming data strictly in-memory during the request lifecycle. Raw uploaded history is never written to disk at any point before, during, or after processing. Implementation and tests actively enforce zero filesystem writes.
5. **Comedic Grounding over Hallucination:** Anchor jokes in actual observed data; clearly distinguish comedic observations from speculative psychological conclusions.
6. **Truthful Source Disclosures:** Transparently disclose data source boundaries. Never claim to have analyzed full watch history if only analyzing public subscriptions or likes.
7. **Simplicity First:** Maintain a lightweight, lean stack. Reject unnecessary databases, message queues, Docker complexity, or microservices for MVP.

---

## Architecture & Dual-Mode Strategy

The application provides a dual-mode experience tailored to user preference and technical feasibility:

* **Mode 1: Quick Roast (Google OAuth)**
  * **User Experience:** One-click Google sign-in.
  * **Data Scope:** Analyzes legitimately accessible YouTube Data API v3 resources under the `https://www.googleapis.com/auth/youtube.readonly` scope (`subscriptions.list`, `videos.list` with `myRating='like'`, and `playlists.list`).
  * **Explicit Boundary:** Does **not** access private watch history (as YouTube Data API v3 does not expose watch history endpoints).
  * **Mandatory Disclosure:** Prominent UI badge and response disclosure: *"Roast based on your Subscriptions & Liked Videos Taste Profile. Does not reflect unliked or private viewing history."*
  * **Token Lifecycle:** The OAuth access token is held ephemerally in-memory strictly for the single request lifecycle required to query YouTube API endpoints. Tokens are never persisted to a database, session store, or disk cache, and are dereferenced immediately upon signal extraction. Credentials, authorization codes, and access tokens are strictly redacted from application logs.
  * **Development Setup:** Tested via mock fixtures first; live Google Cloud OAuth credentials configured via backend `.env` variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).

* **Mode 2: Full History Roast (Google Takeout Upload)**
  * **User Experience:** Guided drag-and-drop of Google Takeout export (`watch-history.json`). For MVP, strictly accepts the unzipped `watch-history.json` file only (ZIP extraction deferred to post-MVP).
  * **Data Scope:** Complete chronological watch history including late-night binges, repeated videos, and content patterns.
  * **Processing:** In-memory streaming JSON parser (`stream-json`), discarding raw objects on the fly, filtering deleted video placeholders, and normalizing into aggregate statistics (top channels, peak hours, repeat counts).
  * **Mandatory Disclosure:** *"Full Watch History Roast based on uploaded Google Takeout archive."*

* **Demo / Sample Mode:** Pre-loaded synthetic sample profiles allowing immediate exploration of the roast report without signing in or uploading files.

---

## Roast Quality, Variety & Report Design

The product generates a substantial, entertaining, personalized roast report—not a single joke, a list of raw statistics, or one generic paragraph. Available viewing history serves as evidence for comedic analysis, rather than a checklist to joke about every video.

### 1. Comedic Mix & Roast Styles
The roast engine produces a deliberate mix of distinct comedic angles:
* **Pattern-Based Roasts:** Broad observations about viewing habits, late-night activity, repeat watching, and topic preferences.
* **Combination Roasts:** Connects two or more independently supported patterns to create unexpected, clever punchlines (e.g. pairing 3 AM cooking tutorials with high-intensity workout binges).
* **Specific Roasts:** References actual video titles or creators when those details produce a genuinely funnier observation.
* **Recurring-Character Analysis:** Identifies humorous viewing archetypes and recurring content rabbit holes.
* **Coherent Final Verdict:** Brings together the strongest observations into a memorable comedic conclusion.

### 2. Evidence Strategy & Payload Boundary
* **No Indiscriminate Dumps:** The server does not send the entire raw watch history to Gemini.
* **Selective High-Signal Evidence Extraction:** The normalizer extracts the most relevant, high-signal evidence—such as top repeated video titles, notable late-night video titles paired with derived viewing-hour context (e.g. "watched around 2 AM" rather than unnecessary exact ISO timestamps), top creators, and unexpected topic pairings—while discarding user identifiers, channel URLs, IP addresses, and bulk logs. This bounded extraction ensures evidence supports combination jokes and specific references while avoiding bulk-history transmission and unnecessary memory accumulation.
* **Balanced Specificity:** Detailed video-level evidence is used when it improves a joke, but is never forced into every section. A broad pattern is preferred over a specific title when it produces a better punchline.
* **Strict Grounding:** Every factual observation must be grounded in analyzed data. Factual viewing statistics are clearly distinguished from comedic interpretation. The model is strictly instructed never to fabricate a creator, video, viewing time, or connection unsupported by the evidence.

### 3. Report Structure & Multi-Joke Schema
The output schema is structured and validated to support multiple well-developed sections:
* `brainrotScore`: Integer (0–100) reflecting repeat velocity and late-night patterns.
* `viewingArchetype`: Recurring-character classification and comedic persona.
* `roastSummary`: Substantial, multi-paragraph opening critique.
* `roasts`: Array of individual structured jokes, each specifying:
  * `style`: `"pattern" | "combination" | "specific" | "archetype"`
  * `joke`: The comedic punchline/roast text.
  * `supportingEvidence`: The factual observation grounding the joke.
  * `referencedItem`: Optional creator name or video title that made the joke specific.
* `redFlags`: Array of 3–5 recurring behavioral content rabbit holes.
* `finalVerdict`: Coherent, memorable concluding takeaway.
* `cardPayload`: Compact summary object formatted for shareable cards.

---

## AI Model & Data Retention Reality

* **Model Configuration:** Configurable via environment variable (`GEMINI_MODEL`, defaulting to a supported Flash model such as `gemini-2.5-flash`). Avoids hardcoding specific model identifiers.
* **Structured Output:** Enforced using native Gemini JSON Schema output (`responseSchema`) with backend Zod validation.
* **Verified Provider Terms & Retention Risks:**
  * **Free Tier (Google AI Studio):** Google's terms state that submitted content (prompts and completions) may be used to train Google models and can be read by human reviewers. *Free tier must never receive sensitive or personal data.*
  * **Paid Tier (Google AI Studio / Cloud Billing enabled):** Google does not use customer data to train AI models.
  * **Residual Risk on Paid Tier:** Even under paid terms, Google retains prompts and completions temporarily for abuse monitoring, safety checks, and legal compliance (typically up to 30 days). Zero Data Retention (ZDR) is not available on standard AI Studio endpoints.
  * **Mitigation & Outbound Payload Boundary:** The application scrubs all personal identifiers (usernames, channel URLs, IP addresses, exact ISO timestamps) and sends **curated, high-signal evidence** (top creators, selected repeated video titles, notable late-night titles with derived viewing-hour context such as "watched around 2 AM", viewing-hour histograms, and broad topic categories). Full raw history logs, exact second-level timestamps, and non-salient entries are discarded before prompt assembly.

---

## Scope & Phasing Overview

### Active (MVP Scope — 3 Condensed Phases)
- **Phase 1:** Project scaffolding, Takeout JSON streaming ingestion, deleted-video filtering, UTF-8 normalization, selective high-signal evidence extraction (creator counts, repeat titles, late-night titles, topic clusters), deterministic Brainrot scoring, and unit tests with synthetic fixtures.
- **Phase 2:** Gemini integration, prompt builder with comedic guardrails, structured multi-joke roast output schema, validation, and AI engine tests.
- **Phase 3:** HTTP API (Fastify), Demo profile, live Google OAuth integration (Quick Roast), privacy hardening (`no-store`, error sanitization), memory consumption verification, and end-to-end acceptance tests.

### Out of Scope / Post-MVP Backlog
- Automated `.zip` file streaming extraction (deferred until user feedback justifies dependency overhead).
- Persistent user accounts, authentication databases, or saved report databases.
- Multi-provider fallback (OpenAI integration deferred until demonstrated necessity).
- Client-side WebAssembly/WebWorker Takeout stream parser.
- Video duration calculations (Google Takeout does not track video duration).
