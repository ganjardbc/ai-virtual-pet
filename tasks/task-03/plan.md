# Task 03 — Phase 2 Simulation Engine

## Status

Complete.

## Goal

Make time matter: implement pure, deterministic elapsed-time simulation, autonomous behavior, mood derivation, and need labels so the pet is playable through code and tests before persistence, HTTP, or UI work begins.

## Scope

- Add the `@ai-virtual-pet/simulation` workspace package depending only on `@ai-virtual-pet/domain`.
- Define the simulation contract: previous state + target time + rules + controlled random → new state + events + summary.
- Awake Hunger/Energy decay and sleeping Hunger decay/Energy recovery.
- Automatic wake (Energy restored or maximum sleep duration) with correct sleep/awake segment splitting.
- Happiness pressure caused only by severe unmet needs, capped per day, with a passive floor.
- No passive Bond decay.
- Autonomous activity selection (SLEEPING, RESTING, PLAYING_ALONE, LOOKING_AROUND, WAITING) from state + rules + controlled random.
- Explicit, small autonomous activity effects.
- Simulation events without per-tick spam.
- Detailed simulation up to 48 hours; summarized approximation for older elapsed time.
- Derived mood with priority scoring and basic stability.
- Player-facing need labels (Fullness, Energy, Happiness) as codes.
- Reusable scenario harness and the seven required player-archetype scenarios.
- Simulation invariant tests.

## Out of Scope

- Database schema, repositories, migrations (Phase 3).
- HTTP endpoints and API contracts (Phase 4).
- UI, copy, and character reactions (later phases).
- Personality, growth, AI, memory, skills, Search.

## Dependencies

- Task 02 / Phase 1 is complete.
- Game rules from `docs/02-game-systems.md`, narrowed by `docs/16-prototype-01-scope.md` and `docs/18-implementation-plan.md` §30–45.

## Simulation Decisions

- Simulation runs from `state.lastSimulatedAt` to a caller-supplied `to` time. The engine never reads a clock. Moving backward throws.
- Needs are applied in closed form per segment, not per tick. A segment ends at the target time, a wake time, or an autonomy decision point.
- Automatic wake happens when Energy reaches 95 (after a 30-minute minimum sleep) or after 8 hours of sleep, whichever comes first.
- Happiness pressure is −1 per 2 hours per active condition (Hunger ≤ 25; Energy ≤ 20 while awake). The combined rate is capped at 12/day, and pressure cannot push Happiness below 30.
- Autonomous decisions happen at hour boundaries aligned to absolute time, so splitting a duration into several simulation calls does not add extra decisions. Energy ≤ 10 always leads to sleep. Other activities use a weighted random choice, and the current activity gets double weight so it tends to continue.
- Elapsed time older than the 48-hour horizon is approximated at the level of whole sleep cycles, with no random draws and no events. The final 48 hours are always simulated in detail.
- Only activity transitions emit events (`PET_STARTED_SLEEPING`, `PET_WOKE_UP`, `PET_ACTIVITY_CHANGED`).
- Mood and need labels are derived values and are never stored as authoritative state.

## Target Structure

```text
packages/simulation/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── simulate.ts
    ├── autonomy.ts
    ├── mood.ts
    ├── labels.ts
    ├── testing/scenario.ts
    └── *.test.ts
```

## Required Verification

```text
pnpm --filter @ai-virtual-pet/simulation typecheck
pnpm --filter @ai-virtual-pet/simulation test
pnpm --filter @ai-virtual-pet/simulation build
pnpm typecheck
pnpm test
pnpm build
```

## Acceptance Criteria

- Simulation has no React, Fastify, database, HTTP, LLM, or Search dependencies.
- No wall-clock lookup and no uncontrolled randomness inside simulation.
- Awake decay is tested at 1, 6, 12, and 24 hours.
- Sleep is tested for 1 hour, several hours, the Energy clamp, and crossing the wake threshold.
- Auto wake splits sleep and awake segments correctly.
- Happiness is tested for healthy needs, severe hunger, severe exhaustion, and the long-duration cap.
- Bond never decays from elapsed time alone.
- Autonomous behavior is reproducible with a seeded random.
- Simulating +7 days runs quickly.
- Mood and need labels are derived and tested.
- All seven scenarios and all invariant tests pass.
- Root typecheck, tests, and build remain passing.
