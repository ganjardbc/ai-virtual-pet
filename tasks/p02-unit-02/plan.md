# Prototype 0.2 — Unit 02: Personality Persistence

## Status

Complete.

## Goal

Personality survives the real application lifecycle and evolves from real care actions (`docs/20-prototype-02-implementation-plan.md` Phase 2, Tasks 2.1–2.8).

## Scope

- `pet_personalities` table + Drizzle migration (Tasks 2.1, 2.2).
- Repository boundary for personality, in both Drizzle and in-memory stores (Task 2.3).
- Application orchestration: load, initialize if missing, apply signal, persist (Task 2.4).
- Accepted Play → PLAY, accepted Feed → CARE, Sleep → none, rejected → none (Tasks 2.5, 2.6).
- Autonomous Independent signal from simulation output, at most once per catch-up run (Task 2.7).
- Persistence tests (Task 2.8).

## Out of Scope

- `PERSONALITY_CHANGED` event (plan Task 7.20, Unit 07).
- Debug personality view / set route (Phase 10).
- Conversation, AI, Talk Bond, UI.

## Required Verification

```text
pnpm typecheck
pnpm test        (PostgreSQL suites must run)
pnpm build
pnpm --filter @ai-virtual-pet/api db:migrate   (dev DB)
drizzle-kit generate → no schema changes
```

## Acceptance Criteria (Phase 2 Gate)

```text
Reload / server restart preserves personality
Daily cap survives reload
Existing pet receives personality without state reset
Play affects personality; rejected Play does not
Prototype 0.1 behavior unchanged apart from tiny personality evolution
```
