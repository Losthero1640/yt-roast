# YouTube Roast AI — Design System & Craft Guidelines

> **Design Objective:** Create a minimalist, high-quality, witty web experience that feels intentionally art-directed—not a generic AI SaaS template.

---

## 1. Visual Personality & Principles

- **Minimal & Editorial:** Restrained neutral palette, sharp typography, generous whitespace, razor-precise alignment.
- **Witty & Internet-Native:** Playful, slightly chaotic humor in microcopy and stamps, balanced by clean layout discipline.
- **Anti-Patterns Strictly Avoided:**
  - ❌ No generic neon purple-blue gradients or glossy glassmorphism.
  - ❌ No uniform rounded pill-soup cards.
  - ❌ No decorative emojis as icons (all icons are clean, precise SVGs).
  - ❌ No unnecessary continuous animations on static text.
  - ❌ No fake loading bars; use real stream progress and humorous stage tickers.

---

## 2. Color Palette Tokens

```css
:root {
  /* Surface & Background */
  --bg-primary: #090a0c;         /* Deep obsidian background */
  --bg-surface: #121316;         /* Elevated panel surface */
  --bg-surface-raised: #181a1f;  /* Cards, modals, elevated controls */
  --bg-subtle: #202228;          /* Input fields, dropzone idle state */
  --bg-subtle-hover: #282a32;    /* Interactive hover state */

  /* Hairline Borders */
  --border-subtle: #23252b;      /* 1px structural dividing lines */
  --border-medium: #33363f;      /* Card edges & input borders */
  --border-focus: #525666;       /* Keyboard focus & active states */

  /* Typography */
  --text-primary: #f4f4f6;       /* Crisp off-white headline & body */
  --text-secondary: #9ea3b0;     /* Editorial subheaders & secondary text */
  --text-tertiary: #636773;      /* Monospace labels, stamps, timestamps */

  /* Accents & Signals */
  --accent-flame: #e11d48;       /* Roast flame crimson */
  --accent-flame-subtle: rgba(225, 29, 72, 0.12);
  --accent-flame-glow: rgba(225, 29, 72, 0.25);
  
  --accent-amber: #f59e0b;       /* Caution, 3 AM late-night warnings */
  --accent-amber-subtle: rgba(245, 158, 11, 0.12);

  --accent-emerald: #10b981;     /* Privacy shields, zero-disk confirmations */
  --accent-emerald-subtle: rgba(16, 185, 129, 0.12);

  /* Elevation */
  --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-modal: 0 24px 64px rgba(0, 0, 0, 0.8);
}
```

---

## 3. Typography Architecture

- **Headings & Display:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (tight tracking `-0.03em`, weights `700`, `800`).
- **Body & Editorial:** `Inter`, `system-ui`, `sans-serif` (relaxed leading `1.6`, weight `400`, `500`).
- **Monospace Technical Data & Badges:** `JetBrains Mono`, `Space Mono`, `ui-monospace`, `monospace` (weight `500`, tracking `0.06em`).

---

## 4. Motion & Tactility (Emil Kowalski Philosophy)

- **Interaction Feedback:** Buttons depress with `transform: scale(0.98)` on `:active` with `120ms` ease-out.
- **Card Hover:** Subtle elevation lift `transform: translateY(-2px)` with border highlight in `180ms ease-out`. Never use `transition: all`.
- **Modals / Drawers:** Enter with `transform: scale(0.97); opacity: 0` → `transform: scale(1); opacity: 1` over `200ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Reduced Motion Support:** Fully honored via `@media (prefers-reduced-motion: reduce)` disabling non-essential transitions.

---

## 5. Screen Progression

1. **Header & Navigation:** Minimalist wordmark (`YT ROAST // AI`), Privacy Shield badge ("0 Database · Pure In-Memory"), and Demo Roast trigger.
2. **Hero:** High-impact editorial headline, sharp premise summary, and two side-by-side mode cards.
3. **Dual Mode Selection:**
   - **Mode 1: Quick Roast (Google Sign-In)** — 1-click OAuth with prominent taste profile disclaimer.
   - **Mode 2: Full Watch History (Takeout)** — Drag-and-drop unzipped `watch-history.json` with mandatory pre-upload consent checkbox.
4. **Progress & Processing State:** Sequential witty status ticker with real animated progress indicators.
5. **Roast Results Dashboard:**
   - **Top Summary:** Brainrot Score Dial, Tier Stamp, Viewing Archetype banner.
   - **Grounded Punchlines:** 4 distinct comedic styles (Pattern, Combo, Specific Creator, Archetype).
   - **Digital Red Flags:** 3–5 recurring content rabbit holes.
   - **Final Verdict:** Concluding punchline callout.
   - **Shareable Card:** High-contrast graphic card with Copy Image / Download button.
6. **Footer:** Technical privacy transparency statement, GitHub link, and disclaimer notes.
