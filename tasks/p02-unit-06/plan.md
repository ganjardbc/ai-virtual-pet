# Prototype 0.2 — Unit 06: Context Builder

## Status

Complete.

## Goal

Give the AI enough reality to perform the pet without inventing it (`docs/20-prototype-02-implementation-plan.md` Phase 6, Tasks 6.1–6.8).

## Scope

- Provider-independent `AICharacterContext` (Task 6.1).
- Relationship level from Bond (Task 6.2).
- Recent events, max 5, authoritative only (Task 6.3).
- Recent conversation, last 12 (Task 6.4).
- Character contract (Task 6.5).
- Personality guidance from the prompt profile (Task 6.6).
- Context size guard with usage observability (Task 6.7).
- Tests (Task 6.8).

## Out of Scope

- Loading context inside a chat turn, action-result section, response schema / output format (Unit 07).
- Character evaluation corpus (Unit 09).

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
```

## Acceptance Criteria (Phase 6 Gate)

Context construction is testable without provider network calls. ✓
