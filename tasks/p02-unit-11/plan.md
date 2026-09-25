# Prototype 0.2 — Unit 11: AI + Personality Debug Tooling

## Status

Complete. Automated checks pass; the AI-dependent browser gate awaits provider credentials (see
`verify.md`).

## Goal

Make AI and personality inspectable without polluting Player Mode
(`docs/20-prototype-02-implementation-plan.md` Phase 10, Tasks 10.1–10.8).

## Scope

Personality debug section (raw traits, dominant trait), personality daily delta display,
debug-only personality set/preset via `PATCH /api/v1/debug/personality`, AI turn debug via
`GET /api/v1/debug/ai` (last turn metadata sourced from the latest ASSISTANT message, plus context
inspection), and debug reset coverage for personality/conversation/messages.

## Out of Scope

Task 10.7 (optional "run test prompt" control) — plan marks it optional and it does not materially
speed tuning; deferred. No Memory, Search, Growth, or other Phase 11 hardening.

## Constraints

- Game Engine remains authority; debug never mutates state outside the normal load → simulate →
  save-with-retry flow.
- Debug routes registered only when `ENABLE_DEBUG_API=true` (existing gating).
- Presets reuse the deterministic domain presets (plan Task 8.1).
- Debug personality set uses `reason: "DEBUG"` and does not consume or modify daily delta tracking.

## Required Verification

```text
pnpm typecheck / test / build
```

## Phase 10 Gate

Set a preset → Talk → observe response; set another preset → same prompt → observe difference;
inspect intent, confidence, and action result — without database editing.
