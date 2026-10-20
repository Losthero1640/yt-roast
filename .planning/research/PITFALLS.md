# Technical Pitfalls & Mitigation Strategy

---

## 1. Large File Uploads & Memory Exhaustion (OOM)
* **Risk:** A user's Google Takeout file can span years, easily reaching 50MB to 300MB in JSON text. Calling `req.file.buffer.toString()` or `JSON.parse()` will duplicate memory strings and crash Node.js heap under concurrent load.
* **Mitigation:** Use streaming JSON parsers (`stream-json` / `stream-chain`) to process objects incrementally as the upload chunks arrive. Bounded max upload size (e.g., 100MB limit with 413 Payload Too Large).

## 2. Inconsistent Google Takeout Schemas
* **Risk:** If a video was removed or a channel deleted, fields like `subtitles` or `titleUrl` may be missing. Older Takeout exports might format channel names slightly differently or include `"Watched a video that has been removed"`.
* **Mitigation:** Resilient parsing rules with safe fallbacks: skip removed video placeholders, extract channel names safely with optional chaining, and validate against a Zod partial schema.

## 3. LLM Hallucinations vs. Truthful Grounding
* **Risk:** The AI model may invent titles the user never watched or state wild psychological claims as clinical facts.
* **Mitigation:**
  * Strict system prompt separating observed facts (e.g., "Observed: 42% of your watch time occurs between 2 AM and 5 AM watching Minecraft speedruns") from playful satirical roasts.
  * Explicit guardrail: The roast must cite at least 3 exact channel names or video themes from the provided aggregates.
  * Insufficient data handling: If fewer than 20 videos exist in the upload, return a graceful "Not enough data to roast you properly without making things up" response.

## 4. API Rate Limits & Timeouts
* **Risk:** Provider rate limits (429) or generation latency (>10s) leaving the user hanging.
* **Mitigation:** Short, focused prompt using aggregated statistics rather than huge token dumps; timeout handler (15s abort); structured fallback response if LLM fails.
