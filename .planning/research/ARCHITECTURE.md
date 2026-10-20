# System Architecture: Zero-Persistence In-Memory Pipeline

---

## 1. Pipeline Overview

```
[User Browser]
       │
       ▼ (multipart/form-data: watch-history.json)
[HTTP Ingestion Endpoint /api/roast/upload]
       │
       ▼ (in-memory streaming)
[Streaming JSON Parser & Normalizer]
       │
       ├─► Validates schema entries (title, subtitles, time)
       ├─► Aggregates Signals:
       │     - Total videos watched, date range
       │     - Top 10 most watched creators/channels
       │     - Peak watching hours (e.g. 1 AM – 4 AM binge ratio)
       │     - Repeatedly re-watched video titles
       │     - Keyword frequency clusters (e.g., "skibidi", "tutorial", "crypto", "asmr")
       │     - Brainrot baseline metric calculation (deterministic rule-based factor)
       │
       ▼ (Compressed Normalized Summary ~2-3 KB JSON)
[Roast LLM Prompt Builder]
       │
       ▼ (External Call with zero personal identifiers)
[AI Provider API - Gemini 2.5 Flash / OpenAI]
       │
       ▼ (Strict JSON Schema validation via Zod)
[Roast Report Payload]
       │
       ▼ (200 OK)
[User Browser Response]
       │
       ▼
[Deterministic Memory GC: Buffer dropped, Zero Persistence]
```

---

## 2. Privacy & Data Minimization Rules

1. **No Disk Spooling:** Request bodies are streamed through memory and not written to temporary disk files.
2. **PII Stripping:** User Google account IDs, names, channel URLs, and IP addresses are never extracted or passed to the AI prompt.
3. **Prompt Condensation:** We never send tens of thousands of raw video lines to the LLM. We only send a pre-computed aggregate histogram (e.g., top 15 channels, watch time distribution by hour, top repeated titles, content tags).
4. **Third-Party Retention:** Gemini API enterprise terms stipulate that data sent via API is not used to train Google models.
