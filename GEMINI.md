<!-- GSD:project-start source:PROJECT.md -->

## Project

Project not yet initialized. Run /gsd-new-project to set up.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## 1. Backend & Runtime

* **Selected:** **Node.js (TypeScript) + Fastify (or Express with streaming parser)**

## 2. Ingestion & JSON Stream Parsing

* **Selected:** Streaming JSON parser (`stream-json` or SAX-style JSON parser) in-memory.
* *Why:* A 2-year YouTube Takeout history can be 50MB–200MB. Calling `JSON.parse(buffer)` would risk memory spikes or Node.js heap exhaustion. A streaming pipeline parses objects on the fly, aggregates watch frequency, top topics, and timestamps, and discards the raw JSON immediately.
* *Database Decision:* **NO DATABASE**.

## 3. AI Engine & Provider

* **Selected:** **Google Gemini API (via `@google/genai` or `@google/generative-ai`) with Gemini 2.5 Flash / 1.5 Flash**

## 4. Testing & Validation

* **Validation:** `zod` for request payloads, environment variables, and LLM output parsing.
* **Testing:** `vitest` for fast, lightweight unit and integration tests (testing Takeout ingestion with synthetic fixtures, prompt formatting, scoring algorithms, and error states).

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
