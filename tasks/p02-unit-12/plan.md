# Prototype 0.2 — Unit 12: Integration & Hardening

## Status

Complete. Automated checks pass; live-AI/browser items await 9router credentials (see `verify.md`).

## Goal

Make Prototype 0.2 reliable enough for internal evaluation
(`docs/20-prototype-02-implementation-plan.md` Phase 11, Tasks 11.1–11.10).

## Scope

End-to-end flow, Prototype 0.1 regression, AI-failure regression, state-truth tests, duplicate
submission, long conversation, AI call budget, conversation error recovery, migration safety, and a
speculative-system scope audit.

## Out of Scope

Phase 11's live provider cost/latency measurement and the browser-level manual pass (need a
configured AI provider). No new product features.

## Required Verification

```text
pnpm typecheck / test / build
```

## Phase 11 Gate

All technical completion criteria from `docs/19-prototype-02-scope.md` must pass.
