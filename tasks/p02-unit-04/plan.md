# Prototype 0.2 — Unit 04: AI Provider Infrastructure

## Status

Complete, except the live Phase 4 gate call (needs 9router credentials in `.env`; see verify.md).

## Goal

Integrate one AI provider behind a replaceable boundary (`docs/20-prototype-02-implementation-plan.md` Phase 4, Tasks 4.1–4.8; DEC-061).

## Scope

- Provider interface (Task 4.1).
- OpenAI-compatible adapter for 9router (Task 4.2).
- Deterministic fake provider, scriptable per call kind (Task 4.3).
- Per-stage timeouts + turn budget (Task 4.4).
- Usage metadata (Task 4.5).
- 1000-character chat input limit in contracts (Task 4.6).
- One-in-flight chat guard + `CHAT_IN_PROGRESS` (Task 4.7).
- Tests (Task 4.8) and a development-only smoke script for the Phase 4 gate.

## Out of Scope

- Interpretation schema and prompts (Unit 05).
- `POST /api/v1/pet/chat` and orchestration (Units 07–08) — guard, budget, and chat request schema are built here and used there.
- Cost estimation (optional, not a blocker).

## Required Verification

```text
pnpm typecheck
pnpm test          (no AI key needed)
pnpm build
pnpm ai:smoke      (Phase 4 gate — real call, needs AI_BASE_URL / AI_MODEL / AI_API_KEY)
```

## Acceptance Criteria (Phase 4 Gate)

```text
Real call reaches configured OpenAI-compatible endpoint and returns Zod-valid JSON   ← pending credentials
Normal automated suite runs without a real API key                                  ✓
```
