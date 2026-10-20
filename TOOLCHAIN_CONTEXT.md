# AI Toolchain & Skills Context

Quick reference guide summarizing all active skills, toolchains, and extensions available for this workspace.

---

## 1. Core Toolchain Matrix

| Tool | Role / Persona | Status / Usage Rule |
| :--- | :--- | :--- |
| **GSD (Get Shit Done)** | **Technical PM & Architect** | **Active Core:** Scope management, phase planning (`/gsd-plan-phase`), execution (`/gsd-execute-phase`), rapid delivery (`/gsd-quick`), and UAT (`/gsd-verify-work`). |
| **Ponytail** | **Pragmatic Senior Dev (YAGNI)** | **Active Core:** Anti-bloat reviews, eliminating over-engineering, code audits (`/ponytail-audit`), diff reviews (`/ponytail-review`), and tracking shortcuts (`/ponytail-debt`). |
| **Roo Code** *(Zoo Code)* | **Interactive IDE Pair Programmer** | **Active Core:** Hands-on scaffolding, iterative coding, interactive debugging, environment setups, and live file tweaks in the editor. |
| **Ralph Loop** | **Autonomous Batch Worker** | **Conditional:** Reserved for well-defined, repetitive batch tasks and test-passing loops once architecture is frozen. Not used for early architecture or sensitive security phases. |
| **CodeRabbit** | **Pre-Merge PR Quality Gate** | **Active Core:** Automated PR reviews, catching regressions, security audits, and pull request compliance before merging. |

---

## 2. Specialized Skills & Engines

### UI/UX & Design Intelligence (Deferred to Post-MVP Frontend Phase)
* **UI/UX Pro Max**: Design systems, color palettes, typography pairings, stack guides, and search scripts in [`.agent/skills/ui-ux-pro-max`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/.agent/skills/ui-ux-pro-max).
* **Impeccable & Emil Kowalski**: High-polish interaction design, micro-animations, Apple-style physics, gesture handling, and web interface guidelines.
* **Taste Skill (`design-taste-frontend`)**: Anti-slop frontend art direction based on curated award-winning sites.
* **Motion & Testing**: `animate`, `animate-expo`, `animation-performance`, `vitest-best-practices`, `frontend-testing`, `e2e-tester`.

### Reverse Engineering & Deep Inspection
* **REA (Reverse Engineer Anything)**: Decompilation, binary analysis, web runtime inspection, and reverse engineering workflows.

### Backend, Data & Cloud
* **Databases**: `postgres`, `mysql` schema planning and performance tuning *(Note: yt roast MVP uses zero databases)*.
* **Data Pipelines & GCP**: BigQuery SQL, dbt, Dataform, GCP Spark/Dataflow, and Cloud Composer orchestration.

---

## 3. Reference Documentation Paths

* Master End-to-End Workflow Guide: [`AI_DEV_WORKFLOW_README.md`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/AI_DEV_WORKFLOW_README.md)
* GSD Command Manual: [`GSD_README.md`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/GSD_README.md)
* Ponytail Senior Dev Guide: [`PONYTAIL_README.md`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/PONYTAIL_README.md)
* Ralph Loop Automation: [`RALPH_LOOP_README.md`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/RALPH_LOOP_README.md)
* Reverse Engineer Anything: [`REA_README.md`](file:///C:/Users/ayush/OneDrive/Documents/projects/extensions/REA_README.md)
* Global Skills Store: [`C:/Users/ayush/.gemini/config/skills`](file:///C:/Users/ayush/.gemini/config/skills)
* Global Plugins Store: [`C:/Users/ayush/.gemini/config/plugins`](file:///C:/Users/ayush/.gemini/config/plugins)
