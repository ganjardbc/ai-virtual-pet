# Task 03 — Implementation Record

## Status

Complete.

## Implemented

- Added the `@ai-virtual-pet/simulation` workspace package, which depends only on `@ai-virtual-pet/domain`.
- `simulateElapsedTime({ state, to, random, rules? })` returns `{ state, events, summary }`:
  - Simulates from `state.lastSimulatedAt` to `to` and throws if `to` is earlier.
  - Applies needs in closed form per segment. A segment ends at the target time, a wake time, or an autonomy decision point. Nothing runs per tick.
  - Awake: Hunger −2/h and Energy −1.5/h, adjusted by the current activity's effect.
  - Sleeping: Hunger −1/h and Energy +12/h.
  - Auto wake happens when Energy reaches 95 (after at least 30 minutes of sleep) or after 8 hours, whichever comes first. Any remaining time is simulated with awake rules.
  - Happiness pressure applies only when needs are severe (Hunger ≤ 25; Energy ≤ 20 while awake). Each condition costs −1 per 2 hours, the combined rate is capped at 12/day, and pressure never pushes Happiness below 30. There is no constant decay.
  - Bond never changes during simulation.
  - Autonomous decisions happen at hour boundaries aligned to absolute time. Energy ≤ 10 always leads to sleep. Otherwise the engine picks from RESTING, PLAYING_ALONE, LOOKING_AROUND, and WAITING with weighted random, favoring the current activity.
  - Activity effects: RESTING halves Energy decay. PLAYING_ALONE costs 1.5× Energy decay and gives +1 Happiness/h. LOOKING_AROUND, WAITING, and IDLE are neutral.
  - Events are emitted only for transitions: `PET_STARTED_SLEEPING` and `PET_WOKE_UP` (both with `source: 'AUTONOMOUS'`, plus `cause` on wake) and `PET_ACTIVITY_CHANGED` (`from`/`to`).
  - Only the last 48 hours are simulated in detail. Older time is approximated as sleep cycles (idle until Energy ≤ 10, then sleep until wake) with no random draws and no events.
  - `summary` reports elapsed time, approximated time, and time spent per activity, for a future "while you were away" recap.
- `activityWeights` and `decideAutonomousActivity` are exported separately for testing and debugging.
- `deriveMood` and `moodCandidates` implement priority scoring from `docs/02-game-systems.md` §36–46:
  - Scores: SLEEPY 70+, HUNGRY 60+, EXCITED 60, BORED 45, HAPPY 40, NEUTRAL 0.
  - A mood is kept for at least 15 minutes while it still applies. SLEEPY and HUNGRY override that immediately, and a mood that no longer applies is dropped at once.
- `deriveNeedLabels`, `deriveFullnessLabel`, `deriveEnergyLabel`, and `deriveHappinessLabel` return label codes, not display text.
- The `PetScenario` test harness (`src/testing/scenario.ts`, excluded from the build) mirrors the future API flow: simulate up to now, apply the action, record the state.
- Domain additions:
  - `SeededRandom` (mulberry32).
  - `AwakeActivity` and `AutonomousActivity` types.
  - `GameRules` gained `sleep.minDurationMs`, `happiness.passiveFloor`, `simulation`, `autonomy`, `mood`, and `needLabels`.
- Tests: 91 in the simulation package; domain grew to 42.

## Files Changed

```text
packages/domain/src/config.ts
packages/domain/src/random.ts
packages/domain/src/control.test.ts

packages/simulation/package.json
packages/simulation/tsconfig.json
packages/simulation/tsconfig.build.json
packages/simulation/vitest.config.ts
packages/simulation/src/index.ts
packages/simulation/src/simulate.ts
packages/simulation/src/autonomy.ts
packages/simulation/src/mood.ts
packages/simulation/src/labels.ts
packages/simulation/src/testing/scenario.ts
packages/simulation/src/simulate.test.ts
packages/simulation/src/derive.test.ts
packages/simulation/src/scenarios.test.ts

pnpm-lock.yaml
tasks/task-03/*
```

## Decisions and Deviations

- **Contract:** the start time is `state.lastSimulatedAt`, not a separate `from` argument, so the two cannot disagree.
- **Source resolution for development:** typechecking and Vitest resolve `@ai-virtual-pet/domain` from its source (a tsconfig `paths` entry plus a Vitest alias), so simulation checks do not depend on a stale domain `dist`. The production build clears `paths` and uses the built package. `pnpm -r build` builds in dependency order. As a result, running the simulation build alone requires building domain first.
- **Minimum sleep duration (30 minutes):** not in the docs. Without it, Sleep at high Energy wakes the pet on the very next request.
- **Happiness floor of 30:** comes from `docs/02-game-systems.md` §64, which the scope doc does not repeat. It keeps long absences from being punishing.
- **Decision points on absolute hour boundaries:** simulating in one call or in hourly calls with the same seed gives the same result (tested).
- **Approximation beyond 48 hours** runs one loop step per sleep/wake transition (roughly one cycle per ~65 hours), so +7 days or even +1 year is effectively instant.
- **No personality in mood scores:** personality is out of scope for Prototype 0.1, so the playful/curious modifiers are omitted and LONELY/CURIOUS are not implemented.
- **Label boundaries reuse rule thresholds where they exist**, so labels always agree with action outcomes: VERY_FULL means Feed is refused, FULL means Feed is diminished, EXHAUSTED means Play is refused, and VERY_HUNGRY means Happiness pressure applies.
- **Mood and labels live in the simulation package** as derived values. Nothing stores them.

## Known Limitations

- **Balancing finding (playtest):** a returning player often finds the pet asleep. Feed, Play, and Sleep are all rejected with `SLEEPING`, even when Hunger is 0, until auto wake (at most 8 hours). This follows the documented rules ("Dia lagi tidur."), but it may feel blocking. Options: let Feed wake the pet, add a player-facing Wake, or wake the pet when Hunger is severe.
- **Balancing finding:** with autonomous sleep only at Energy ≤ 10, an unattended pet stays awake about 57 hours per cycle. Most of that time it is TIRED or EXHAUSTED.
- **Balancing finding:** Daily Active players reach Happiness 100 quickly, and Bond grows about 3.8/day with no soft cap (the soft cap is out of scope).
- Mood stability needs the previous `DerivedMood`. Nothing persists it yet; Phase 3 or 4 decides where it lives, or the UI keeps it per session.
- The Excited mood needs `lastPlayedAt`, and Play diminishing needs recent Play times. Both must come from persisted `PET_PLAYED` events in Phase 3.
- The approximated window resets the awake activity to IDLE without emitting an event.
