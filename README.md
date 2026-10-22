# 🔥 YouTube Roast AI

> **A privacy-first, merciless AI standup comic that analyzes your YouTube viewing habits and roasts your digital soul — with ZERO persistent data storage.**

[![Privacy: Zero-Persistence](https://img.shields.io/badge/Privacy-Zero--Persistence-059669.svg)](#-zero-persistence-privacy-guarantee)
[![Architecture: In--Memory Streaming](https://img.shields.io/badge/Architecture-In--Memory%20Streaming-10b981.svg)](#-how-the-data-pipeline-works)
[![AI Engine: Gemini 3.8 Flash](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash-38bdf8.svg)](#-ai-roast-engine)
[![Frontend: React 19 + Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-6366f1.svg)](#-tech-stack)
[![Backend: Fastify 5](https://img.shields.io/badge/Backend-Fastify%205-f59e0b.svg)](#-tech-stack)

---

## 🛡️ Zero-Persistence Privacy Guarantee (Read This First!)

Most web apps harvest your viewing habits into a database to build user profiles. **YouTube Roast AI was engineered from line one with zero databases, zero disk caching, and zero persistent storage.**

| Guarantee | How It Works |
| :--- | :--- |
| **No Database** | There is **no MongoDB, SQL, PostgreSQL, Redis, or cloud bucket**. Your data cannot be leaked because it is never saved. |
| **Volatile RAM Streaming** | Uploaded Google Takeout files (`watch-history.json` up to 100MB+) stream strictly through memory (`stream-json`). Once metrics are calculated, raw objects are garbage-collected immediately. |
| **Ephemeral OAuth Tokens** | Google OAuth access tokens are held transiently in RAM only for the few seconds required to fetch public subscriptions and likes. They are never written to disk, database, or logs. |
| **PII-Purged AI Prompts** | Google Gemini receives only aggregated frequency counts (e.g. *Chai aur Code: 42 views*). Your email, account ID, exact timestamps, and video URLs are completely stripped before AI synthesis. |
| **Instant Revocation** | You can revoke OAuth access at any time with a single click at [Google Permissions](https://myaccount.google.com/permissions). |

---

## ✨ Features & Roast Modes

YouTube Roast AI provides two ways to get roasted, plus an instant preview:

### 1. ⚡ Mode 1: Quick Roast (Google Sign-In)
- **Time:** ~5 seconds.
- **How it works:** Sign in with your Google account. With your explicit consent, it ephemerally inspects your public channel subscriptions and liked videos to diagnose your comedic archetype.
- **Privacy:** Ephemeral token discarded immediately; zero history saved.

### 2. 📂 Mode 2: Full History Roast (Google Takeout)
- **Time:** Complete lifetime or multi-year analysis.
- **How it works:** Download your official `watch-history.json` from [Google Takeout](https://takeout.google.com) and upload it.
- **Deep Insights:** Analyzes late-night binges (12 AM–5 AM), rapid-fire doomscrolling velocity (<20 min intervals), and replay addictions.
- **Performance:** Handles 100MB+ (200,000+ videos) with under 50MB peak heap memory and 0 disk writes.

### 3. 🧪 Sample Demo Mode
- Curious what a roast looks like before connecting an account or uploading a file? Click **"Try Demo Roast"** on the home page for an instant, real-world report generated from realistic viewing data.

---

## 🎭 What You Get in Your Roast Report

Every report is a personalized, lethal standup comedy set containing:

- **Comedic Archetype:** Your digital persona (e.g., *The Unemployed FAANG Architect*, *The 3 AM Productivity Goblin*).
- **Opening Roast Monologue:** Brutally honest character assassination contrasting who you pretend to be vs. what you actually watch.
- **Deterministic Brainrot Score (0–100):** Calculated from a mathematical formula combining late-night binge ratios, repetition loops, and doomscroll velocity:
  - `0–20`: **Monk** (Digital ascetic)
  - `21–40`: **Casual** (Normal human)
  - `41–65`: **Slime Brain** (Brainrot territory)
  - `66–85`: **Deep Fried** (Terminal algorithm victim)
  - `86–100`: **Digital Zombie** (Beyond salvation)
- **4-Part Structured Roasts:**
  - 🔄 **Habit Pattern:** Burns your repetition and coping mechanisms.
  - ⚡ **Unholy Combo:** Attacks the absurd clash between two unrelated genres on your feed.
  - 🎯 **Specific Item Roast:** Surgical burn targeting an exact video or creator from your history.
  - 🧠 **Archetype Dissection:** Deep dive into your delusions.
- **Red Flags & Final Verdict:** Bullet points of your worst viewing crimes and a concluding roast punchline.
- **Exportable Certificate Card:** A shareable badge displaying your score, tier, and top crime for social media.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js:** v20.6.0+ (recommended: v22 LTS)
- **Google Gemini API Key:** Free from [Google AI Studio](https://aistudio.google.com/)
- **(Optional) Google OAuth Credentials:** From [Google Cloud Console](https://console.cloud.google.com/) if testing Mode 1 locally.

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/yt-roast-ai.git
cd yt-roast-ai
```

### 2. Configure Backend Environment
```bash
cd backend
cp ../.env.example .env
```
Open `backend/.env` and insert your credentials:
```env
PORT=3000
HOST=0.0.0.0
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Optional for Mode 1 Google Sign-In:
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173
```

### 3. Install & Start Backend
```bash
npm install
npm run dev
```
*(Runs at `http://localhost:3000`)*

### 4. Install & Start Frontend (in a new terminal)
```bash
cd ../frontend
npm install
npm run dev
```
*(Runs at `http://localhost:5173`)*

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, Vite, Vanilla CSS design tokens (Obsidian/Emerald cyberpunk aesthetic), Lucide React icons.
- **Backend:** Node.js (ES modules), Fastify 5, `@fastify/multipart` (volatile memory streaming), `@fastify/cors`.
- **Parsing:** `stream-json` & `stream-chain` (O(1) memory streaming parser).
- **AI Engine:** Google Gemini API (`@google/genai`) using `gemini-3.8-flash` with strict JSON Schema output.
- **Validation:** Zod schemas enforcing score immutability, joke grounding, and evidence validation.
- **Testing:** Vitest (89 unit, integration, and performance benchmarks passing).

---

## 📖 In-Depth Documentation

For the complete technical breakdown, step-by-step Google Takeout download guide, deployment instructions for Vercel & Render, and OAuth configuration details, read the [Complete User & Architecture Guide (GUIDE.md)](./GUIDE.md).

---

## 📄 License & Disclaimer

This project is for entertainment purposes. We are not affiliated with Google or YouTube. Your data is processed entirely in volatile memory and never saved.
