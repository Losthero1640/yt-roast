# Research Summary: YouTube Roast AI

**Date:** October 2026

## Key Discoveries
1. **API Feasibility:** YouTube Data API v3 has deprecated and disabled watch history playlists. Programmatic OAuth fetching of watch history is impossible via the official public API.
2. **Primary Data Ingestion:** Google Takeout `watch-history.json` upload is the only legitimate, privacy-compliant way to access complete historical viewing data.
3. **Architecture:** A zero-database, in-memory streaming backend architecture fulfills all privacy requirements. Memory is immediately released post-response.
4. **AI Generation:** Google Gemini (Gemini 2.5 Flash / 1.5 Flash) with native JSON schema guarantees structured roast output with high speed, low cost, and large context safety.
