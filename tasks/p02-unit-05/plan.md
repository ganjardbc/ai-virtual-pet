# Prototype 0.2 — Unit 05: Structured Interpretation

## Status

Complete, except the live corpus evaluation (needs 9router credentials; see verify.md).

## Goal

Convert a player message into one bounded, validated intent plus a conversation classification, safely (`docs/20-prototype-02-implementation-plan.md` Phase 5, Tasks 5.1–5.8).

## Scope

- Interpretation schema: 5 intents, 8 classifications, confidence (Task 5.1).
- 0.80 confidence threshold for FEED / PLAY / SLEEP (Task 5.2).
- Dedicated interpretation prompt with rules and false-positive traps (Tasks 5.3, 5.4).
- One-action enforcement (Task 5.5).
- Safe fallback for invalid output and provider failure (Task 5.6).
- Evaluation corpus + scoring (Task 5.7).
- Opt-in live evaluation script (Task 5.8).

## Out of Scope

- Calling interpretation from chat, executing actions (Unit 07).
- Classification → personality signal mapping (Task 7.7, Unit 07).
- Character response prompt (Unit 07) and character corpus (Unit 09).

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
pnpm ai:eval:interpretation   (live, needs credentials)
```

## Acceptance Criteria (Phase 5 Gate)

```text
schema validated           ✓
confidence enforced        ✓
one action enforced        ✓
ambiguous cases safe       ✓ by design (threshold + NO_ACTION corpus); live rate pending
malformed output safe      ✓
```
