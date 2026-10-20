# Feasibility Research: YouTube Data Sources

**Investigation Date:** October 2026  
**Status:** Completed & Grounded in Official Documentation

---

## 1. Executive Summary & Critical Discovery

> [!WARNING]
> **Critical Feasibility Finding:** The official **YouTube Data API v3 does NOT provide access to user watch history**.  
> The `watchHistory` playlist (`HL` playlist ID) was deprecated and fully disabled by Google years ago. Any attempt to retrieve watch history via `playlistItems.list` returns an empty array or 403 Forbidden. There is **no OAuth scope** that unlocks private watch history via the public API.

Therefore:
- **Recommended Primary MVP Source:** **Google Takeout (`watch-history.json`) Export Upload**. Provides 100% complete, unredacted, chronological viewing history with zero OAuth setup, zero Google app verification delays, zero API quotas, and zero database persistence requirements.
- **Recommended Fallback / Secondary Source:** **YouTube Data API v3 OAuth (`youtube.readonly`) for User Subscriptions & Liked Videos**. If users prefer a zero-file-upload 1-click experience, the app can roast their "Subscribed Channels & Liked Videos Taste Profile" rather than raw viewing history.

---

## 2. In-Depth Comparison Matrix

| Criteria | Source A: YouTube API Watch History | Source B: YouTube API Likes & Subscriptions | Source C: Google Takeout Export (`watch-history.json`) | Source D: Browser Extension / Client Interceptor |
| :--- | :--- | :--- | :--- | :--- |
| **Data Actually Accessible** | **None** (Disabled by Google) | Subscriptions list (`mine=true`), Liked videos (`myRating='like'`), Created playlists | Complete video watch log (`title`, `titleUrl`, channel name, ISO timestamps) | Real-time videos watched while extension is active |
| **OAuth Scopes Required** | N/A (Endpoint dead) | `https://www.googleapis.com/auth/youtube.readonly` | **None** (Local file upload) | None (Browser extension permissions) |
| **API Quotas & Limitations** | N/A | 10,000 units/day default project quota. Fetching 500 likes/subs requires pagination costs. | **None** (Zero API calls) | None |
| **Google Verification** | Impossible for watch history | Requires OAuth Consent Screen & verification if public (>100 unverified users). | **None** (No Google compliance or review needed) | Chrome Web Store review |
| **Data Completeness** | 0% (Infeasible) | ~30% (Proxy signals: reveals subscriptions/likes, not actual late-night rabbit hole views) | **100% Complete** (Full chronological history) | Incomplete (Only watches recorded while extension installed) |
| **User Friction** | N/A | **Low** (1-click Google OAuth login) | **Medium** (User goes to `takeout.google.com`, downloads JSON, uploads file) | **High** (Requires installing a separate extension) |
| **Implementation Complexity** | Infeasible | Moderate (OAuth dance, state token, refresh tokens, backend secret) | **Low** (Standard file upload, fast stream parser, schema validation) | High (Separate extension codebase + backend API) |
| **Privacy & Security** | N/A | Access tokens handled on server, Google access logging | Client-side/in-memory stream parsing; no tokens; no database needed | Extension has broad browser permissions |

---

## 3. Deep Dive per Source

### Source A: YouTube Data API v3 (Watch History via OAuth)
* **Official Reality:** Google deliberately sunset user watch history and watch later playlist endpoints for privacy and regulatory reasons.
* **Verdict:** **REJECTED / INFEASIBLE**.

### Source B: User-Authorized YouTube Resources (Likes, Subscriptions, Playlists)
* **How it works:** User completes OAuth 2.0 flow granting `https://www.googleapis.com/auth/youtube.readonly`.
* **Endpoints:**
  * `subscriptions.list(mine=true, part='snippet')`
  * `videos.list(myRating='like', part='snippet')`
  * `playlists.list(mine=true, part='snippet')`
* **Pros:** Smooth UX, single click.
* **Cons:** Doesn't reflect true watch history (many users watch hundreds of videos without clicking "Like" or subscribing). Requires Google Cloud Console project and OAuth credentials.
* **Verdict:** **VIABLE AS FALLBACK / ALTERNATIVE MODE ("Channel & Subscription Roast")**.

### Source C: Google Takeout Export (`watch-history.json`)
* **How it works:** The user downloads their YouTube History archive from `takeout.google.com` (which takes ~1-2 minutes) and drags the `watch-history.json` into the application.
* **Schema Anatomy:**
  ```json
  [
    {
      "header": "YouTube",
      "title": "Watched Some Random Video Title",
      "titleUrl": "https://www.youtube.com/watch?v=...",
      "subtitles": [
        {
          "name": "Channel Name",
          "url": "https://www.youtube.com/channel/..."
        }
      ],
      "time": "2026-03-15T03:42:11.000Z",
      "products": ["YouTube"],
      "activityControls": ["YouTube watch history"]
    }
  ]
  ```
* **Pros:**
  1. Access to **real** late-night binge watching, obscure rabbit holes, Shorts addiction, and repeated views.
  2. **100% Privacy Preservation:** Can be processed entirely in-memory with streaming JSON parsers (e.g., `stream-json` / `oboe` or client-side filtering) without storing a single byte on disk or database.
  3. No OAuth setup, no API quotas, no Google Cloud verification friction.
* **Cons:** Slightly higher user friction (requires manual Takeout export).
* **Verdict:** **RECOMMENDED PRIMARY MVP DATA SOURCE**.

---

## 4. Privacy & Processing Architecture

```
User uploads watch-history.json (in browser memory)
       │
       ▼
In-Memory Fast Aggregator & Sanitizer (Node.js backend or Web Worker)
  - Drops titleUrls, channels links, user identifiers
  - Aggregates: Top channels, watch time distribution (e.g., 3 AM binges),
    recurring keywords/topics, Shorts vs longform velocity, repeat view counts
  - Reduces 10,000+ entries -> compact normalized viewing signal (~2-4 KB JSON)
       │
       ▼
AI Roast Engine (Gemini 2.5 Flash / OpenAI)
  - Sends ONLY sanitized summary metrics & sample titles (no PII, no full history)
  - Strict JSON Schema output (Brainrot score, roast report, red flags, personality verdict)
       │
       ▼
Client receives structured report & renders roast card + shareable visual
       │
       ▼
Deterministic In-Memory GC: Zero database, zero persistent disk files
```

---

## 5. Recommendation for MVP
1. **Primary MVP Input:** Google Takeout `watch-history.json` upload with in-memory parsing. Also provide a "Sample Profile / Demo Data" toggle so users can preview the roast experience instantly without uploading their own data.
2. **Post-MVP / Phase 2:** Add Google OAuth for "Quick Roast" based on public Subscriptions and Likes for users who don't want to export Takeout files.
