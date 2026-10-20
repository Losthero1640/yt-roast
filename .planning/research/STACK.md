# Technology Stack Trade-Offs & Decisions

**Philosophy:** *Ponytail Senior Dev Principles — Minimal dependencies, zero unnecessary infrastructure, zero databases for MVP.*

---

## 1. Backend & Runtime

* **Selected:** **Node.js (TypeScript) + Fastify (or Express with streaming parser)**
  * *Why:* Native stream handling for large file uploads (`watch-history.json` can be 10MB–100MB+), excellent JSON schema validation (`zod`), lightweight, instant local startup.
  * *Alternatives Rejected:*
    * Python (FastAPI): Good, but TypeScript provides unified typing between backend schemas and future React/Vite frontend.
    * Rust/Go: Unnecessary development overhead for an MVP.

---

## 2. Ingestion & JSON Stream Parsing

* **Selected:** Streaming JSON parser (`stream-json` or SAX-style JSON parser) in-memory.
* *Why:* A 2-year YouTube Takeout history can be 50MB–200MB. Calling `JSON.parse(buffer)` would risk memory spikes or Node.js heap exhaustion. A streaming pipeline parses objects on the fly, aggregates watch frequency, top topics, and timestamps, and discards the raw JSON immediately.
* *Database Decision:* **NO DATABASE**.
  * Complete compliance with principle #2 ("Do not persist raw viewing history in the application database") and principle #4 ("Temporary backend processing is acceptable").
  * All calculations happen ephemerally in-memory during the request lifecycle. Once the roast JSON is returned to the client, the memory is garbage-collected.

---

## 3. AI Engine & Provider

* **Selected:** **Google Gemini API (via `@google/genai` or `@google/generative-ai`) with Gemini 2.5 Flash / 1.5 Flash**
  * *Why:*
    1. Native structured output (`responseSchema` enforcing exact JSON schema).
    2. Huge context window (up to 1M tokens) easily handles edge cases where extensive summaries are needed.
    3. Extremely cost-effective and low-latency for rapid, punchy roasts.
  * *Provider Abstraction:* Simple interface (`RoastGeneratorService`) so OpenAI (`gpt-4o-mini`) can be plugged in via configuration if desired, without coupling the application.

---

## 4. Testing & Validation

* **Validation:** `zod` for request payloads, environment variables, and LLM output parsing.
* **Testing:** `vitest` for fast, lightweight unit and integration tests (testing Takeout ingestion with synthetic fixtures, prompt formatting, scoring algorithms, and error states).
