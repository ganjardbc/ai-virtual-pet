# Prototype 0.2 — Unit 12: Integration & Hardening — Implementation

## Status

Complete. Automated checks green; live provider/browser steps pending (see `verify.md`).

## What was built

Phase 11 is a verification phase: most tasks already had coverage, so the work was filling the real
gaps, running the regression surface, auditing scope, and recording evidence.

### New: `apps/api/src/hardening.test.ts`

A 10-case suite run against both `InMemoryStore` and PostgreSQL (via `ChatHarness`, scripted
`FakeAIProvider`, debug clock):

- **11.1** egg → chat Play → personality rises → reload (new API instance) → personality unchanged
  and conversation persists.
- **11.3** with the AI provider disabled: Talk reports `AI_UNAVAILABLE`, care buttons (Feed, Play,
  Sleep) work, debug time travel works, and simulation still decays hunger and recovers Energy.
- **11.4** state truth: an engine-rejected chat Play records no `PET_PLAYED` (one
  `ACTION_REJECTED`), an accepted chat Feed records exactly one `PET_FED` and the snapshot hunger
  matches the engine, and the reply context is rebuilt from the saved reality.
- **11.5** a duplicated submission (same `clientMessageId` sent concurrently) applies one action and
  stores one player message; a duplicated TALK applies one `PET_TALKED` and raises Clingy once.
- **11.6** a 15-turn conversation keeps full UI history while the AI context stays bounded
  (≤ system + 12 recent + current) and the oldest turn never reaches the model.
- **11.7** at most one INTERPRETATION and one RESPONSE call per chat turn.
- **11.9** a pre-personality (Prototype 0.1) pet can talk and gets its personality created and
  persisted.

### Coverage already in place (referenced, not duplicated)

- **11.2** Prototype 0.1 regression — `apps/api/src/integration.test.ts` (8.1–8.6: feed, play,
  rejection, sleep, auto-wake, +7d, autonomous activity, restart/new connection, concurrent feeds).
- **11.5 / 11.8** duplicate turn + crash/retry recovery — `apps/api/src/http/chat.test.ts`
  (turn idempotency, in-flight guard) and `apps/api/src/http/chat-failures.test.ts` (resume after
  crash, failure fallbacks, committed action never rolled back).
- **11.9** legacy Baby lazily gets a personality — `integration.test.ts` "gives an existing
  Prototype 0.1 Baby a personality on first load".

### Task 11.10 — Scope audit

Grepped `apps/*/src` and `packages/*/src` for Memory, Embeddings, Vector Search, Search Skill,
Growth, Child, Adult, Reminder, Calendar. Results: none implemented.

- No embeddings/vector code.
- "search" appears only in anti-injection guards/tests that reject a claimed Search skill
  (`ai/interpretation.ts`, `ai/evaluation/character-checks.ts`, corpora) — correct.
- No Reminder/Calendar system.
- No Growth/Child/Adult stage: the schema and domain only allow `EGG`/`BABY`; remaining "growth"
  mentions are comments about future work or the personality-growth metaphor.
- "memory" is the `InMemoryStore` test double and prompt/evidence rules that deny fabricated
  memories; there is no Memory system or table.

Nothing speculative to remove.

## Files changed

```text
apps/api/src/hardening.test.ts   (new; Phase 11 suite)
tasks/p02-unit-12/{plan,implementation,verify}.md
```

No production code changed: Phase 11 found no defect requiring a fix.

## Decisions / deviations

- 11.1's browser reload is verified at the API layer with a scripted AI over real persistence; the
  browser/live-provider manual pass is left to the live gate.
- 11.7 records the call budget (2 calls/turn) automatically; live latency/cost numbers are left to
  the live gate.

## Post-review fixes

A fresh-context review of the diff raised three Important findings; all were fixed:

- I1 — 11.3 now presses Feed, Play, and Sleep and asserts simulation actually changed state
  (hunger decayed, Energy recovered), instead of a `hunger < 100` assertion that passed regardless.
- I2 — 11.6's vacuous system-prompt check was replaced by asserting the oldest turn is absent from
  the model request messages while the current turn is present.
- I3 — 11.5 now asserts the `CHAT_IN_PROGRESS` code on a lost race and adds a duplicated-TALK case
  proving one Bond/personality application.
- Minor — corrected `verify.md` to attribute identity/stats retention to the existing
  `integration.test.ts` case rather than the new 11.9 test.
