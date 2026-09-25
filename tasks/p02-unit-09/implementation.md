# Prototype 0.2 — Unit 09: Implementation Record

## Status

Complete (live truth corpus pending provider availability).

## Implemented

- `packages/domain/src/personality-presets.ts` — `PERSONALITY_PRESETS`: `BALANCED` (all 0.45) and `HIGH_PLAYFUL` / `HIGH_CURIOUS` / `HIGH_SHY` / `HIGH_INDEPENDENT` / `HIGH_CLINGY` (one trait 0.80, rest 0.45). Reused by Phase 10 debug presets.
- `apps/api/src/ai/evaluation/character-checks.ts` — `checkReply(reply, expectation)`: BREVITY (> 3 sentences or > 280 chars), ASSISTANT_DRIFT (English + Indonesian assistant phrases, list formatting), LANGUAGE_MATCH, STATE_CONTRADICTION, FABRICATED_ACTION, FABRICATED_MEMORY, FABRICATED_CAPABILITY. Flags for review, not scores.
- `apps/api/src/ai/evaluation/character-corpus.ts` — 6 prompts × 6 presets; 11 truth scenarios (6 state, 2 memory, 3 injection) as synthetic snapshots.
- `apps/api/src/ai/evaluation/character-eval.ts` — `runCharacterEvaluation` (one reply call per case, interpretation also for injection; `groups` filter) and `renderCharacterReport` (flagged cases, side-by-side personality table, truth table).
- `pnpm ai:eval:character [--out file] [--groups …]`, `pnpm test:ai` (smoke + interpretation + character). None run in `pnpm test`.

### Adapter fix found by the live run

`OpenAICompatibleProvider` now sends `stream: false` (9router streams by default and returned `text/event-stream`, which the Unit 04 adapter reported as MALFORMED_OUTPUT). It also assembles an SSE body if an endpoint streams anyway. Two new adapter tests.

## Decisions

1. **Heuristics flag, humans judge.** Personality legibility is shown side by side, not scored (plan Task 8.3).
2. **Truth cases run the real prompt builders on synthetic snapshots**, not the database, so the live run is cheap and repeatable.
3. **Evaluation timeouts can be overridden by env** (`AI_INTERPRETATION_TIMEOUT_MS=10000`) without changing defaults.

## Files Changed

```text
packages/domain/src/personality-presets.ts (new), index.ts, personality.test.ts
apps/api/src/ai/evaluation/*                              (new)
apps/api/src/ai/openai-compatible.ts, openai-compatible.test.ts
apps/api/src/scripts/ai-eval-character.ts                 (new)
apps/api/package.json, package.json
tasks/p02-unit-09/*, tasks/p02-unit-04/verify.md, tasks/p02-unit-05/verify.md
```
