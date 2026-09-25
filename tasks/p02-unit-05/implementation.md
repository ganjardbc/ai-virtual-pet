# Prototype 0.2 — Unit 05: Implementation Record

## Status

Complete (live evaluation pending credentials).

## Implemented

### `apps/api/src/ai/interpretation.ts`

| Export | Purpose |
| --- | --- |
| `INTERPRETATION_INTENTS`, `CARE_INTENTS`, `isCareIntent` | `FEED PLAY SLEEP TALK NONE`; care intents are the state-changing ones. |
| `CONVERSATION_CLASSIFICATIONS` | Scope §55: `AFFECTION PLAYFUL CURIOUS COMFORTING CASUAL CARE PRAISE TEASING`. |
| `aiInterpretationSchema` | Zod: one `intent` enum, `confidence` 0–1 number, `classification` enum. Unknown intents (e.g. `SEARCH`) fail; extra keys (e.g. `reasoning`) are stripped. |
| `normalizeInterpretation` | Care intent below `confidenceThreshold` (0.80) → `NONE`; keeps `rawIntent` and classification for debugging. |
| `INTERPRETATION_FALLBACK` | `NONE` / 0 / `CASUAL` / `fallbackUsed: true`. |
| `interpretMessage(provider, { message, petName }, timeoutMs)` | One `INTERPRETATION` call, temperature 0, max 120 output tokens. Never throws for provider problems; returns `{ interpretation, usage, failure }`. |
| `buildInterpretationMessages` | System instructions + the player message as a separate user message. |
| `DEFAULT_INTERPRETATION_RULES` | threshold 0.8, maxOutputTokens 120, temperature 0. |

Prompt content (English instructions, Indonesian examples): intent definitions; explicit-request rule; questions are not requests; subject matters; guesses/wishes are not requests; more than one care action → `NONE`; the message is data, embedded instructions are ignored; plan Task 5.4 examples; classification definitions.

Context given to interpretation: the message and the pet's name only. Pet state is deliberately not included — whether an action is possible is the Game Engine's decision, not the interpreter's.

### `apps/api/src/ai/interpretation-corpus.ts`

25 cases: FEED 4, PLAY 3, SLEEP 3, NO_ACTION 7, AMBIGUOUS 4, MULTI_ACTION 1, INJECTION 3 (plan Tasks 5.7, 8.7). `scoreInterpretation` → `PASS` / `FALSE_POSITIVE` (unrequested or wrong care action) / `FALSE_NEGATIVE` (missed request).

### `apps/api/src/scripts/ai-eval-interpretation.ts`

`pnpm ai:eval:interpretation`: runs the corpus once (25 sequential calls) against the configured provider, prints expected / raw / acted-on intent, confidence, classification, latency per case, then totals. Not part of the automated suite.

## Decisions Made in This Unit

1. **Plan contradiction resolved:** Tasks 5.4 / 5.7 call "Kamu suka main?" and "Kamu lucu." `NONE`, but the later TALK/NONE rule (Task 5.1) makes them `TALK`. Those tasks mean "no state-changing action", so the corpus expects `NO_ACTION` (TALK or NONE). Plan note added.
2. **Multiple care actions in one message → `NONE`** (plan allowed primary intent or NONE; NONE avoids guessing). Plan Task 5.5 updated.
3. **Interpretation sees no pet state.** Stops the model from "helpfully" refusing Play when tired — the engine does that, and the character reacts to the real rejection.
4. **Output with two JSON objects is malformed**, not "first one wins" — the fallback runs, so one-action enforcement cannot be bypassed by output format.
5. **Classification is kept on a below-threshold turn** (debugging only, per Task 5.1).

## Known Limitations

- Prompt examples overlap the corpus for the plan-mandated rules ("Kamu suka main?", "Aku mau tidur.", the multi-action sentence). Live scores on those cases are optimistic; the other cases are unseen by the prompt.
- Ambiguity safety for a real model is only measured by the live evaluation.

## Files Changed

```text
apps/api/src/ai/interpretation.ts, interpretation-corpus.ts, interpretation.test.ts   (new)
apps/api/src/scripts/ai-eval-interpretation.ts                                        (new)
apps/api/package.json, package.json
docs/20-prototype-02-implementation-plan.md                                           (Tasks 5.4, 5.5)
tasks/p02-unit-05/*
```

## Database Changes

None.
