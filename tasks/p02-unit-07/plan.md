# Prototype 0.2 — Unit 07: Chat Orchestration Core

## Status

Complete.

## Goal

The canonical chat turn — AI interprets → Game Engine decides → AI performs the actual result — through `POST /api/v1/pet/chat` (`docs/20-prototype-02-implementation-plan.md` Phase 7).

## Scope

Tasks 7.1–7.13, 7.17, 7.18, 7.20 per the unit map. Because the turn is one flow, the minimum failure behavior needed for its invariants is also in place (7.14 fallback reply after an action, 7.15 interpretation failure → NONE, 7.16 AI_UNAVAILABLE for plain Talk, resume of a failed turn).

## Left for Unit 08 (failure hardening)

- Resume after a crash **between** a committed action and the stored reply (check `turnMessageId` action events before acting again).
- Broader failure matrix (both calls failing in each order, budget exhausted before the reply, duplicate append race across processes).
- Retry UX contract details for the web client.

## Required Verification

```text
pnpm typecheck
pnpm test        (chat suite runs on in-memory and PostgreSQL)
pnpm build
End-to-end: real server + test DB + local OpenAI-compatible stub
```

## Acceptance Criteria (Phase 7 Gate)

Canonical journey works entirely through application/API tests, no UI. ✓
