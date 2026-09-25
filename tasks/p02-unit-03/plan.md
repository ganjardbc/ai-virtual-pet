# Prototype 0.2 — Unit 03: Conversation Persistence + Turn Idempotency

## Status

Complete.

## Goal

Conversation storage that works without any AI provider, with the storage guarantees chat retry depends on (`docs/20-prototype-02-implementation-plan.md` Phase 3, Tasks 3.1–3.8).

## Scope

- `conversations` and `messages` tables + migration (Tasks 3.1, 3.2, 3.3).
- `ConversationRepository` in Drizzle and in-memory stores (Task 3.4).
- Configurable limits: AI context window 12, visible history 50 (Tasks 3.5, 3.6).
- `GET /api/v1/pet/chat/history` without debug metadata (Task 3.6).
- Storage side of turn idempotency: unique `clientMessageId`, one reply per player message, turn lookup (Task 3.8).
- Tests (Task 3.7).

## Out of Scope

- `POST /api/v1/pet/chat` and turn resume logic (Units 07–08).
- AI provider, interpretation, Talk Bond, events.
- Web conversation UI (Unit 10).

## Required Verification

```text
pnpm typecheck
pnpm test        (PostgreSQL suites must run)
pnpm build
pnpm --filter @ai-virtual-pet/api db:migrate   (dev DB)
drizzle-kit generate → no schema changes
```

## Acceptance Criteria (Phase 3 Gate)

```text
Conversation storage works without any AI provider
Duplicate clientMessageId never creates a second player message
A player message can have at most one reply
History excludes debug metadata
History survives restart; debug reset clears it
```
