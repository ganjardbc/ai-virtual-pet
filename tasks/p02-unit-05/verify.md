# Prototype 0.2 — Unit 05: Verification Record

## Status

Automated verification passed. Live evaluation **pending** credentials. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass |
| Tests | `pnpm test` | Pass — 492 tests (api 253), no AI key |
| Build | `pnpm build` | Pass |
| Eval script, local always-PLAY stub | `pnpm ai:eval:interpretation` | Runs 25 cases; reports 3 pass / 22 false positive — scoring and report work |
| **Live evaluation** | `pnpm ai:eval:interpretation` with 9router | **Not run — no credentials** |

## Phase 5 Gate Coverage (`ai/interpretation.test.ts`, 40 tests)

| Gate item | Tests |
| --- | --- |
| schema validated | all 40 intent × classification pairs accepted; unsupported intent, lowercase, unknown classification, confidence > 1, string confidence, missing field, intent list rejected; extra keys stripped |
| confidence enforced | each care intent executes at 0.80, becomes NONE at 0.79 with raw intent kept; TALK/NONE unaffected; configurable |
| one action enforced | schema has a single intent; two JSON objects in output → fallback; prompt: several care actions → NONE |
| malformed output safe | unsupported intent, non-JSON, timeout, provider error, unconfigured → `NONE / 0 / CASUAL / fallbackUsed` |
| ambiguous cases safe | corpus expects NO_ACTION for all ambiguous, multi-action, injection cases; below-threshold scores as no action |
| prompt | message kept out of instructions; pet named; exactly the supported enums, no SEARCH/REMIND/MEMORY; plan rules and traps present |
| scoring | PASS / FALSE_POSITIVE (incl. wrong action) / FALSE_NEGATIVE table |

## To Complete the Live Evaluation

1. Add `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` to `.env` (see Unit 04 verify.md).
2. `pnpm ai:eval:interpretation`
3. Record here: model, pass / false positive / false negative counts, average latency, and each false positive. Any false positive is fixed (prompt or threshold) before false negatives.

Next: Unit 06 — Context Builder.
