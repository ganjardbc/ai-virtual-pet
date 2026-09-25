# Prototype 0.2 — Phase 0: Baseline Verification

## Status

Complete.

## Goal

Confirm Prototype 0.1 is healthy before adding AI and personality (`docs/20-prototype-02-implementation-plan.md` §7–§10).

## Scope

- Task 0.1 — Existing test baseline: typecheck, tests (incl. PostgreSQL integration), build, migrations current.
- Task 0.2 — Existing architecture inspection: confirm real locations of the systems Prototype 0.2 extends.
- Initialize git and commit the Prototype 0.1 baseline.

## Out of Scope

- Any Prototype 0.2 code (personality, conversation, AI).
- Refactors or fixes to Prototype 0.1.

## Required Verification

```text
pnpm typecheck
pnpm test          (TEST_DATABASE_URL set → PostgreSQL suites run, not skipped)
pnpm build
pnpm --filter @ai-virtual-pet/api db:check
drizzle-kit generate → "No schema changes"
```

## Acceptance Criteria

```text
Prototype 0.1 tests pass
Web builds
API builds
Database migrations current
Architecture inspected
Prototype 0.1 baseline committed to git
```
