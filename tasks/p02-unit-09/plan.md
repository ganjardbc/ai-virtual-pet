# Prototype 0.2 — Unit 09: Character Performance / Evaluation Harness

## Status

Complete. Live truth-corpus run pending a 9router outage (see verify.md).

## Goal

Make AI output recognizably belong to this pet, and give developers a bounded way to check it (`docs/20-prototype-02-implementation-plan.md` Phase 8, Tasks 8.1–8.8).

## Scope

- Personality evaluation presets (Task 8.1).
- Shared prompt corpus across presets (Task 8.2).
- Heuristic defect checks: brevity, assistant drift, language, state contradiction, fabricated action / memory / capability (Tasks 8.3, 8.4).
- State truth, memory hallucination, and prompt injection corpora (Tasks 8.5–8.7).
- Opt-in live suite with a Markdown report (Task 8.8).
- Also: the pending live gates of Units 04 and 05.

## Required Verification

```text
pnpm typecheck / test / build
pnpm ai:smoke
pnpm ai:eval:interpretation
pnpm ai:eval:character
```

## Phase 8 Gate

```text
short pet-like responses            ✓ (live)
state awareness                     partial (live, very-hungry ✓; rest pending outage)
noticeable personality differences  ✓ (live)
safe intent interpretation          ✓ (live, 0 false positives)
no routine memory fabrication       pending outage
```
