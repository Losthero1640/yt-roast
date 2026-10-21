# Phase 1: Project Scaffolding & Takeout Stream Ingestion - Research

**Researched:** 2026-10-21  
**Domain:** In-memory streaming JSON parsing, multipart HTTP streaming, Node.js memory profiling  
**Confidence:** HIGH  

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Formula & Subscores):** Deterministic 0–100 composite score:
  $$\text{Score} = \text{round}(S_{\text{late}} \times w_{\text{late}} + S_{\text{rep}} \times w_{\text{rep}} + S_{\text{vel}} \times w_{\text{vel}})$$
  - $S_{\text{late}}$: $\le 5\%$ late-night is baseline ($0$ pts); $\ge 25\%$ is maximum ($100$ pts):
    $$S_{\text{late}} = \min(100, \max(0, \text{round}((R_{\text{late}} - 0.05) / 0.20 \times 100)))$$
  - $S_{\text{rep}}$: 20% Top-5 creator concentration ($C_{\text{top5}}$ over 15%–50%) + 15% title replays ($T_{\text{rep}}$ over 0%–12%).
  - $S_{\text{vel}}$: Rapid-fire session clustering ($V_{\text{cluster}}$, $\le 20$ min gap) over 15%–60%.
- **D-02 (Comedic Tiers):** 5 tiers: `0–19 Monk`, `20–44 Casual`, `45–69 Slime Brain`, `70–89 Deep Fried`, `90–100 Digital Zombie`.
- **D-03 (Missing Data & Renormalization Matrix):**
  - Case A (Full): $\ge 20$ records, timestamps valid $\ge 20 \implies w_{\text{late}}=0.35, w_{\text{rep}}=0.35, w_{\text{vel}}=0.30$, confidence `"high"`.
  - Case B (Degraded Timestamps): $<20$ valid timestamps $\implies S_{\text{rep}}$ only ($w_{\text{rep}}=1.00$), time metrics `null`, confidence `"low"` with explicit `degradedNotice`.
  - Case C (No Intervals): No consecutive timestamps $\implies w_{\text{late}}=0.50, w_{\text{rep}}=0.50$, velocity `null`, confidence `"medium"`.
  - Case D (Sparse): $<20$ valid records $\implies$ abort with honest fallback (`NORM-05`).
- **D-04–D-07 (Extraction Limits):** Top 5 creators with counts/shares, ranks 6–15 names only; Top 5 repeated titles ($\ge 3$ plays) + aggregate replay count; Top 5 late-night titles with derived hours; 20-min session clustering.
- **D-08–D-11 (Resilience & Zero-Disk Pipeline):** Strip `"Watched "` prefix defensively; allowlist for deleted placeholders; fast-fail on malformed JSON; zero disk writes throughout request lifecycle; memory benchmark on 50MB+ fixture ($<30$MB incremental, $<50$MB peak heap).
- **D-12–D-14 (Demo Profile & Schema):** "The 3 AM Productivity Goblin"; dual fixtures (synthetic Takeout JSON + precomputed module); canonical schema defined in `src/schemas/roast.js` matching `AI-03`.

### Deferred Ideas (OUT OF SCOPE)
- None.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Multipart Ingestion | API/Backend (Fastify) | — | Direct socket stream handling with no temporary files. |
| Stream JSON Parsing | API/Backend (`stream-json`) | — | Incremental chunk-by-chunk token emission under Node.js stream backpressure. |
| Statistical Normalizer | Domain Logic (`src/normalizer/`) | — | In-memory online reducer aggregating counts and capped evidence without buffering raw history. |
| Scoring Engine | Domain Logic (`src/scoring/`) | — | Deterministic mathematical evaluation with confidence grading. |
| Demo Profile Provider | API/Backend (`src/fixtures/`) | — | Bundled static fixtures serving zero-latency demo previews without LLM invocation. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 constructs the streaming foundation of YouTube Roast AI. The technical objective is to ingest large Takeout export arrays (`watch-history.json`, potentially 50MB–200MB) without memory spikes and with absolute zero disk writes.

Our research validates that:
1. **`stream-json` (v1.x)** combined with Node.js `stream.pipeline` (from `node:stream/promises`) provides genuine incremental parsing via `parser()` and `streamArray()`. Because each component is a standard Node.js `Transform` stream, backpressure is automatically propagated upstream to the socket reader, preventing memory accumulation.
2. **`@fastify/multipart`** uses `busboy` in-memory. In default stream mode (`attachFieldsToBody: false`), `await req.file()` exposes a raw `Readable` stream (`data.file`) that operates directly from network buffers. It writes zero bytes to disk unless the user explicitly pipes it to `fs.createWriteStream`.
3. **Multi-layer zero-disk verification** can be reliably achieved in Vitest by combining API spies (`vi.spyOn(fs, ...)`) with directory snapshots of `os.tmpdir()` and working directories before and after streaming.
4. **50MB+ memory benchmarking** can be executed deterministically in unit tests using a custom on-the-fly `Readable` generator stream that yields synthetic Takeout JSON chunks without ever buffering 50MB in memory at once.

**Primary recommendation:** Assemble the ingestion pipeline strictly with `stream.pipeline(fileStream, parser(), streamArray(), onlineReducer)` wrapped in a try/catch block that terminates with `data.file.resume()` to guarantee clean socket teardown on malformed JSON errors.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fastify` | `^5.0.0` or `^4.28.0` | HTTP Server | High throughput, first-class stream support, low overhead. |
| `@fastify/multipart` | `^9.0.0` or `^8.3.0` | Multipart streaming | Built on Busboy, native streaming without disk-spooling. |
| `stream-json` | `^1.9.0` | Streaming JSON parser | Defacto Node.js standard for streaming large JSON documents without full heap loading. |
| `zod` | `^3.24.0` | Schema validation | Runtime validation for Takeout records and roast schemas directly in plain JavaScript. |
| `vitest` | `^3.0.0` or `^2.1.0` | Test Runner | Native ESM and plain JavaScript test runner with built-in spying (`vi.spyOn`). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `stream-chain` | `^2.2.5` | Stream composition helper | Simplifies pipeline creation with `stream-json`. |

### Installation Command
```bash
npm install fastify @fastify/multipart stream-json stream-chain zod
npm install -D vitest
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Ingestion & Stream Processing Pipeline

```
HTTP Multipart Request
        │ (socket stream chunks: 64KB)
        ▼
req.file() (Fastify multipart part stream - NO DISK SPOOL)
        │
        ▼
stream.pipeline()
        ├──► parser() (stream-json: tokenizes byte chunks)
        ├──► streamArray() (stream-json/streamers/StreamArray.js: emits { key, value } objects)
        └──► onlineReducerTransform (Writable/Transform: updates counters, discards raw record)
```

### Stream Pipeline Implementation Pattern
```javascript
import { pipeline } from 'node:stream/promises';
import { parser } from 'stream-json';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import { Writable } from 'node:stream';

export async function processTakeoutStream(inputStream, accumulator) {
  const jsonParser = parser();
  const arrayStream = StreamArray.withParser();

  const reducerSink = new Writable({
    objectMode: true,
    write(chunk, _encoding, callback) {
      try {
        accumulator.processItem(chunk.value);
        callback(); // releases backpressure for next item
      } catch (err) {
        callback(err);
      }
    }
  });

  await pipeline(inputStream, jsonParser, arrayStream, reducerSink);
}
```

### On-The-Fly 50MB+ Synthetic Stream Generator Pattern
To test the 50MB+ fixture without consuming 50MB of heap RAM:
```javascript
import { Readable } from 'node:stream';

export function createSyntheticTakeoutStream(targetSizeBytes) {
  let bytesEmitted = 0;
  let isFirst = true;
  let index = 0;

  return new Readable({
    read(size) {
      if (bytesEmitted === 0) {
        this.push('[\n');
        bytesEmitted += 2;
        return;
      }

      if (bytesEmitted >= targetSizeBytes) {
        this.push('\n]');
        this.push(null); // End of stream
        return;
      }

      const record = JSON.stringify({
        header: "YouTube",
        title: `Watched Synthetic Video Title Number ${index}`,
        titleUrl: `https://www.youtube.com/watch?v=synthetic_${index}`,
        subtitles: [{ name: `Creator Channel ${(index % 25)}`, url: `https://youtube.com/channel/${index % 25}` }],
        time: new Date(Date.now() - index * 60000).toISOString(),
        products: ["YouTube"]
      });

      const chunk = (isFirst ? '' : ',\n') + record;
      isFirst = false;
      index++;
      bytesEmitted += Buffer.byteLength(chunk);
      this.push(chunk);
    }
  });
}
```

### Multi-Layer Zero-Disk-Write Verification Pattern
```javascript
import { vi, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';

export function setupZeroDiskSpies() {
  const writeSpy = vi.spyOn(fs, 'writeFile');
  const writeStreamSpy = vi.spyOn(fs, 'createWriteStream');
  const appendSpy = vi.spyOn(fs, 'appendFile');
  const promisesWriteSpy = vi.spyOn(fs.promises, 'writeFile');

  const tmpBefore = fs.readdirSync(os.tmpdir());

  return {
    assertZeroWrites() {
      expect(writeSpy).not.toHaveBeenCalled();
      expect(writeStreamSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
      expect(promisesWriteSpy).not.toHaveBeenCalled();

      const tmpAfter = fs.readdirSync(os.tmpdir());
      expect(tmpAfter.length).toBe(tmpBefore.length);
    }
  };
}
```
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON stream parsing | Custom regex or string slicing on chunks | `stream-json` | Handling split JSON tokens, escaped Unicode, nested arrays across chunk boundaries is notoriously error-prone. |
| Multipart decoding | Custom boundary regex parser | `@fastify/multipart` | RFC 7578 multipart specifications, boundary padding, character encodings, and headers are subtle and security-sensitive. |
| Schema validation | Hand-written `typeof` checks | `zod` | Provides safe runtime parsing and data stripping directly in plain JavaScript. |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Unconsumed Multipart Stream Hanging Connections
* **What goes wrong:** Fastify request hangs indefinitely if `req.file()` is awaited but parsing fails or errors out before consuming the stream.
* **Why it happens:** In Node.js streams, if the readable socket is not consumed or explicitly resumed/destroyed, the underlying HTTP request connection cannot finish reading the body and hangs.
* **How to avoid:** In error handlers, always execute `if (filePart?.file && !filePart.file.destroyed) filePart.file.resume();`.

### Pitfall 2: ESM Extension Requirement with `stream-json`
* **What goes wrong:** `Cannot find module 'stream-json/streamers/StreamArray'` runtime crash in Node.js ESM.
* **Why it happens:** `stream-json` subpath exports require the explicit `.js` extension under Node.js ESM (`"type": "module"`).
* **How to avoid:** Always import from `'stream-json/streamers/StreamArray.js'`.

### Pitfall 3: Inadvertent Memory Retention in Reducer
* **What goes wrong:** Heap memory steadily climbs to hundreds of megabytes during 50MB+ ingestion.
* **Why it happens:** The accumulator reducer accidentally pushes full `TakeoutItem` objects into an array (e.g. `items.push(item)`) instead of extracting primitive counts and incrementing map keys.
* **How to avoid:** Never retain the raw item reference. Extract `cleanTitle`, `channel`, `timestamp`, update frequency counters, and let the item be garbage collected immediately.
</common_pitfalls>

<metadata>
## Metadata
**Research date:** 2026-10-21  
**Confidence:** HIGH  
**Valid until:** 2026-11-20  
</metadata>

---
*Phase: 01-project-scaffolding-takeout-stream-ingestion*  
*Research completed: 2026-10-21*  
*Ready for planning: yes*
