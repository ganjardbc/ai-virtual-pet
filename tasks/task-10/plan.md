# Task 10 — Phase 9 Playtest Preparation

## Status

Complete.

## Goal

Turn the development build into a learning instrument: a predictable tester setup, a facilitation kit that observes without over-instructing, and a findings format that separates observation from decision.

## Scope

- **9.1 Seed/reset workflow**: reset to the Egg without a database console.
  - In-app: Debug → Reset Pet (Phase 7).
  - Command line: `pnpm playtest:reset`, which works even when the API is not running.
- **9.2 Playtest scenario**: a developer-led session flow that uses Debug Mode to simulate absence. The player-facing instructions must not explain mechanics.
- **9.3 Observation questions** and **9.4 post-test questions**: a facilitator observation sheet and an interview script.
- **9.5 Findings format**: a template with Observation → Interpretation → Decision. `docs/19-prototype-01-findings.md` itself is created only after real sessions (implementation plan §128).
- **Pre-playtest product decisions** (made by the project owner, 2026-09-25):
  1. Initial Baby Hunger 100 → **70**, so the first Feed succeeds with a normal eating reaction.
  2. Sleeping pet on return: **keep as designed** (no player Wake). This is an explicit playtest watch item.
  3. Player-facing copy: **Indonesian**. Debug stays English.

## Out of Scope

- Running the playtest and writing real findings.
- Other balancing changes. Hunger visibility timing stays a watch item.
- New features.

## Dependencies

- Task 09 / Phase 8 is complete.
- `docs/18-implementation-plan.md` §123–128, `docs/09-playtesting.md`, and `docs/16-prototype-01-scope.md` §82–83.

## Target Files

```text
packages/domain/src/config.ts                     (initialState.hunger 70)
apps/web/src/presentation/{copy,reactions,recap}.ts + screen labels (Indonesian)
apps/web/index.html                               (lang="id")
apps/api/src/scripts/reset-pet.ts + scripts       (pnpm playtest:reset)
docs/playtest/prototype-01-playtest-guide.md
docs/playtest/prototype-01-findings-template.md
README.md                                         (playtest section)
```

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
pnpm playtest:reset          (with a pet present, then with none)
Browser: full playtest flow in Indonesian from a clean reset, including the first Feed succeeding
```

## Acceptance Criteria

- A facilitator can reset to the Egg in one command or one in-app action.
- A fresh Baby's first Feed succeeds.
- All player-facing text is Indonesian, with no English leftovers in Player Mode.
- The playtest guide covers setup, session flow, observation, post-test questions, and the watch list, without scripting away discovery.
- Root typecheck, tests, and build remain passing.
