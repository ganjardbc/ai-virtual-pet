# Prototype 0.2 — Unit 08: Chat Failure Hardening

## Status

Complete.

## Goal

AI failures and crashes at any step of a chat turn never duplicate an action, Bond, personality change, or message, and never roll back a committed action (`docs/20-prototype-02-implementation-plan.md` Tasks 7.14–7.16, 3.8 resume, 11.8).

## Scope

- Resume a turn whose care action committed but whose reply was never stored.
- Failure matrix: both AI calls failing, spent turn budget, unexpected provider exception, reply race from another process, buttons during AI failure.
- Client retry contract documented in contracts.

## Out of Scope

- Web retry UI (Unit 10).

## Required Verification

```text
pnpm typecheck
pnpm test        (failure suite on in-memory and PostgreSQL)
pnpm build
```

## Acceptance Criteria

```text
Crash after committed action → Retry reacts to the real result, never acts again   ✓
Crash after Talk Bond → Retry never applies Bond / personality again                ✓
AI failure never rolls back an action                                               ✓
Guard always released                                                               ✓
Buttons work while Talk fails                                                       ✓
```
