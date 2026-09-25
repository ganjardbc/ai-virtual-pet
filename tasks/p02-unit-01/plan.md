# Prototype 0.2 — Unit 01: Personality Domain

## Status

Complete.

## Goal

Introduce persistent behavioral tendencies as pure, deterministic domain rules, with no AI and no database (`docs/20-prototype-02-implementation-plan.md` Phase 1, Tasks 1.1–1.13).

## Scope

- Personality model, trait constants, signals (Tasks 1.1, 1.2, 1.5).
- Initialization with injected `Random` (Task 1.3).
- Base signal deltas in configuration (Task 1.6).
- Autonomous Independent signal, once per day (Task 1.7).
- Daily cap per trait on the injected-clock UTC day (Task 1.8).
- Clamp and Independent/Clingy normalization (Tasks 1.4, 1.9).
- Structured update result (Task 1.10).
- Profile and prompt-profile derivation (Tasks 1.11, 1.12).
- Pure tests (Task 1.13).

## Out of Scope

- Database schema, migration, repositories (Unit 02).
- Wiring signals into Play/Feed or simulation (Unit 02).
- Talk Bond, conversation, AI, UI, debug presets.

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
```

## Acceptance Criteria (Phase 1 Gate)

```text
Personality model             ✓
Initialization                ✓
Mutation rules                ✓
Daily cap                     ✓
Trait consistency             ✓
Prompt profile                ✓
Pure tests                    ✓
No AI dependency              ✓
```
