# 📘 Complete Guide: YouTube Roast AI

Welcome to the comprehensive user and developer guide for **YouTube Roast AI**. This document provides an in-depth breakdown of how the application works, its privacy guarantees, step-by-step instructions for every feature, and instructions for deploying your own instance to the cloud.

---

## 📑 Table of Contents
1. [Security & Privacy Blueprint (Why It's Safe)](#1-security--privacy-blueprint)
2. [Feature Breakdown & How to Use](#2-feature-breakdown--how-to-use)
   - [Mode 1: Quick Roast (Google Sign-In)](#mode-1-quick-roast-google-sign-in)
   - [Mode 2: Full History Roast (Google Takeout)](#mode-2-full-history-roast-google-takeout)
   - [Mode 3: Instant Demo Preview](#mode-3-instant-demo-preview)
3. [How the Brainrot Scoring Engine Works](#3-how-the-brainrot-scoring-engine-works)
4. [Step-by-Step Google Takeout Guide](#4-step-by-step-google-takeout-guide)
5. [Production Deployment Guide (Render + Vercel)](#5-production-deployment-guide)
6. [Troubleshooting & FAQ](#6-troubleshooting--faq)

---

## 1. Security & Privacy Blueprint

Most AI services require you to trust that they won't abuse your personal history stored in their database. **YouTube Roast AI eliminates the risk by physically possessing no database.**

```
+---------------------------------------------------------------------------------+
|                                 USER BROWSER                                    |
|   (Explicit Consent Checkbox -> Ephemeral Google OAuth / Takeout File Upload)   |
+---------------------------------------------------------------------------------+
                                      |
                                      | Streamed directly into volatile RAM
                                      v
+---------------------------------------------------------------------------------+
|                             FASTIFY BACKEND (RAM ONLY)                          |
|  - Zero disk writes: No temp files, no spooling, no database tables.            |
|  - Aggregation pipeline: Calculates topic tallies, late-night & replay ratios.   |
|  - Strips all PII: User email, Google IDs, exact timestamps & URLs are purged.  |
|  - Discards raw watch objects immediately from heap memory.                     |
+---------------------------------------------------------------------------------+
                                      |
                                      | Purged statistical metrics only (<4KB)
                                      v
+---------------------------------------------------------------------------------+
|                               GOOGLE GEMINI AI                                  |
|  - Receives only frequency tallies (e.g., "Chai aur Code: 42 views").           |
|  - Generates lethal, structured comedy roasts conforming to strict JSON schema.  |
|  - Validates joke grounding to prevent hallucinations.                         |
+---------------------------------------------------------------------------------+
                                      |
                                      | Ephemeral JSON response (Cache-Control: no-store)
                                      v
+---------------------------------------------------------------------------------+
|                                 USER BROWSER                                    |
|             (Report rendered, Certificate Card ready for sharing)               |
+---------------------------------------------------------------------------------+
```

### Key Technical Privacy Safeguards:
1. **Volatile RAM Streaming (`stream-json`):** When you upload a 100MB Takeout file, it is parsed as a continuous memory stream. No temporary `.json` or buffer files are written to the server's hard drive.
2. **Ephemeral OAuth Credentials:** When you use Google Sign-In, the OAuth access token is held in transient memory only for the ~3 seconds required to query YouTube's read-only endpoints. The token is never saved and is purged as soon as the roast is generated.
3. **Zero Logs Policy:** Server logs redact authorization codes, access tokens, and sensitive URLs (`[REDACTED_CREDENTIAL]`).
4. **No-Store Caching Headers:** All API responses include `Cache-Control: no-store, private, max-age=0` to ensure your browser or intermediate proxies do not cache your viewing report.
5. **Instant Revocation:** You can disconnect YouTube Roast AI at any moment by visiting your [Google Account Permissions](https://myaccount.google.com/permissions).

---

## 2. Feature Breakdown & How to Use

### Mode 1: Quick Roast (Google Sign-In)
- **Best For:** Users who want instant gratification without downloading files.
- **Speed:** ~5 seconds.
- **What It Uses:** Public subscriptions and liked videos from your YouTube account.
- **How to Use:**
  1. Click **Quick Roast (Google Sign-In)** on the home screen.
  2. Review the privacy disclaimer and check the **explicit consent checkbox**.
  3. Sign in with your Google Account.
  4. Your roast report and Brainrot card are displayed instantly.

### Mode 2: Full History Roast (Google Takeout)
- **Best For:** A savage, complete psychological breakdown based on years of actual watch history.
- **Speed:** ~10–15 seconds.
- **What It Uses:** Your official `watch-history.json` file from Google Takeout.
- **Deep Analytics Unlocked:**
  - **Late-Night Ratio (12 AM–5 AM):** Quantifies your midnight insomnia binges.
  - **Doomscroll Velocity:** Detects rapid-fire video starts (<20 minutes apart).
  - **Replay Loops:** Flags the exact tutorials or comfort videos you obsessively re-watch.
- **How to Use:**
  1. Download your `watch-history.json` from [Google Takeout](https://takeout.google.com) (see Section 4).
  2. Drag and drop the `watch-history.json` file into the upload zone.
  3. Check the consent box and click **Analyze & Roast My History**.

### Mode 3: Instant Demo Preview
- **Best For:** Anyone wanting to see what the report looks like before connecting an account.
- **How to Use:** Click the **Try Demo Roast** link in the header or hero section.

---

## 3. How the Brainrot Scoring Engine Works

Your **Brainrot Score (0–100)** is calculated deterministically via an immutable mathematical algorithm before being passed to Gemini. The AI cannot invent or alter this score.

$$\text{Brainrot Score} = 0.40 \times \text{LateNight} + 0.35 \times \text{Repetition} + 0.25 \times \text{Velocity}$$

### The Subscores:
- **Late-Night Subscore (40% Weight):** Measures the percentage of timestamped views between 12:00 AM and 5:00 AM.
- **Repetition Subscore (35% Weight):** Calculates the replay ratio (how many times you watch the same videos repeatedly).
- **Velocity Subscore (25% Weight):** Identifies rapid-fire viewing sessions where videos start within 20 minutes of each other.

### The Comedic Tiers:
- **0–20 | Monk:** Digital ascetic. You watch educational videos with surgical discipline.
- **21–40 | Casual:** Normal human. Healthy balance of entertainment and productivity.
- **41–65 | Slime Brain:** Brainrot territory. Late-night spirals and comfort re-watches.
- **66–85 | Deep Fried:** Terminal algorithm victim. Hoarding coding tutorials while watching drama roasts.
- **86–100 | Digital Zombie:** Beyond salvation. Continuous rapid-fire doomscrolling at 4 AM.

---

## 4. Step-by-Step Google Takeout Guide

To get your `watch-history.json` from Google:

1. Go to **[takeout.google.com](https://takeout.google.com)** while signed in to your Google account.
2. At the top of the list, click **Deselect all** (do not export your entire Google Drive or Photos!).
3. Scroll down to **YouTube and YouTube Music** and check the box.
4. Click the button labeled **Multiple formats** and ensure History is set to **JSON** (not HTML).
5. Click **All YouTube data included**, uncheck everything except **history**, and click **OK**.
6. Scroll to the bottom and click **Next step**.
7. Choose **Send download link via email** and click **Create export**.
8. Within a few minutes (or hours for massive accounts), Google will email you a `.zip` file.
9. Download and unzip the file. Inside the `YouTube and YouTube Music/history/` folder, find **`watch-history.json`**.
10. Upload that file into YouTube Roast AI!

---

## 5. Production Deployment Guide

Deploying this full-stack application for free takes less than 10 minutes:

### Part A: Deploy Backend on Render (Free)
1. Fork or push this repository to your GitHub.
2. Create a new **Web Service** on [Render](https://render.com) connected to your repository.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `PORT`: `3000`
   - `HOST`: `0.0.0.0`
   - `GEMINI_API_KEY`: *(Your key from Google AI Studio)*
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `GOOGLE_CLIENT_ID`: *(Your Google OAuth Client ID)*
   - `GOOGLE_CLIENT_SECRET`: *(Your Google OAuth Client Secret)*
   - `GOOGLE_REDIRECT_URI`: `https://placeholder.vercel.app` *(Update in Part C)*
5. Click **Deploy**. Copy your backend URL (e.g., `https://yt-roast-backend.onrender.com`).

### Part B: Deploy Frontend on Vercel (Free)
1. Import your repository on [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework:** `Vite`
   - **Root Directory:** `frontend`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://yt-roast-backend.onrender.com` *(Your Render URL without trailing slash)*
4. Click **Deploy**. Copy your live Vercel URL (e.g., `https://yt-roast.vercel.app`).

### Part C: Authorize Google OAuth & Publish
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click your OAuth 2.0 Client ID:
   - Add your Vercel URL to **Authorized JavaScript origins**: `https://yt-roast.vercel.app`
   - Add your Vercel URL to **Authorized redirect URIs**: `https://yt-roast.vercel.app`
3. In your Render Dashboard, update `GOOGLE_REDIRECT_URI` to `https://yt-roast.vercel.app`.
4. Navigate to **Google Auth Platform ➔ Branding**:
   - App name: `YouTube Roast AI`
   - Support email: your email
   - **App logo:** Keep empty *(prevents mandatory manual audit)*
   - Home page: `https://yt-roast.vercel.app`
   - Privacy policy: `https://yt-roast.vercel.app/privacy.html`
   - Authorized domain: `vercel.app`
5. Go to **Audience** and click **Publish App**!

---

## 6. Troubleshooting & FAQ

#### Q: Why do I see "Google hasn't verified this app" during Google Sign-In?
**A:** Because this app requests read-only YouTube data (`youtube.readonly`), Google displays an informational screen for non-enterprise apps. Click **Advanced ➔ Go to yt roast (unsafe)** to continue. Your data is processed only in RAM and discarded immediately.

#### Q: What if my YouTube liked videos or subscriptions are private?
**A:** Mode 1 gracefully falls back to whichever data points are public. If both are completely empty or hidden, the app notifies you to either make a few subscriptions public or use **Mode 2 (Google Takeout)**, which analyzes your private watch history file safely without needing public channels.

#### Q: How does Mode 2 handle huge 100MB+ Takeout files without crashing?
**A:** Rather than loading the entire file into memory with `JSON.parse()`, the backend uses Node.js streaming transforms (`stream-json`). It aggregates statistics on the fly and immediately garbage-collects parsed records, keeping peak heap memory under 50MB.

#### Q: Can I self-host this entirely on my local machine?
**A:** Yes! Simply clone the repo, follow the [Quickstart instructions in README.md](./README.md), and run `npm run dev` in both the backend and frontend directories.
