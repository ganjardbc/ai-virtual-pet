# Task 02 — Phase 1 Domain Foundation

## Status

Ready for implementation.

## Goal

Implement the framework-independent pet domain and deterministic care rules required before elapsed-time simulation, persistence, HTTP, or UI work begins.

## Scope

- Add the `@ai-virtual-pet/domain` workspace package.
- Define Pet identity and the valid Egg/Baby model.
- Define PetState, stats, activities, timestamps, and constructors.
- Add injectable Clock and Random abstractions with production and deterministic test implementations.
- Centralize Phase 1 game balance in one immutable configuration.
- Implement pure Feed, Play, Start Sleep, and Wake rules.
- Implement the two-hour repeated-Play diminishing window.
- Return domain events and structured rejection results from actions.
- Export the supported public domain API.
- Add unit tests for domain invariants, actions, timestamps, diminishing returns, and events.

## Out of Scope

- Elapsed-time simulation and automatic wake.
- Autonomous activity selection.
- Mood derivation and need labels.
- Database models, repositories, and migrations.
- HTTP endpoints or API contracts.
- React/UI behavior.
- Growth, personality, AI, memory, skills, or Search.

## Dependencies

- Task 01 / Phase 0 is complete.
- Shared strict TypeScript configuration is available.
- Game rules come from `docs/02-game-systems.md`, narrowed by `docs/16-prototype-01-scope.md` and `docs/18-implementation-plan.md`.

## Domain Decisions

- Stats are clamped to `0–100` by all normal mutations.
- Hunger represents satiety: `100` is full and `0` is extremely hungry.
- Feed is rejected with `TOO_FULL` when Hunger is at least 90.
- Feed uses diminished values when Hunger is between 75 and 89.
- Play is rejected with `TOO_TIRED` when Energy is at most 15.
- Care actions are rejected with `SLEEPING` while the pet sleeps.
- Repeated Play uses a two-hour window and multipliers `1`, `0.75`, `0.5`, then `0.25`.
- Play benefits use the diminishing multiplier; Energy and Hunger costs remain constant so repeated Play cannot reduce its cost.
- Rejected actions do not mutate state but do emit `ACTION_REJECTED` for later persistence/debugging.
- Start Sleep grants the documented `+0.1` Bond command effect.
- Wake while already awake returns `INVALID_STATE`.
- Canonical rejection reasons follow `docs/08-api-design.md`: `TOO_TIRED`, `TOO_FULL`, `SLEEPING`, and `INVALID_STATE`.

## Target Structure

```text
packages/domain/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── src/
    ├── index.ts
    ├── primitives.ts
    ├── pet.ts
    ├── state.ts
    ├── clock.ts
    ├── random.ts
    ├── config.ts
    ├── events.ts
    ├── actions.ts
    └── *.test.ts
```

The final file split may be adjusted if a smaller structure is clearer, without changing package boundaries.

## Implementation Steps

1. Create the domain workspace package and build configuration.
2. Implement primitives and immutable Pet/PetState types.
3. Implement Clock and Random abstractions.
4. Add the immutable default GameRules configuration.
5. Add domain event and action result contracts.
6. Implement Feed and its full/diminished/rejected branches.
7. Implement Play validation and two-hour diminishing behavior.
8. Implement Start Sleep and Wake transitions.
9. Export the public package surface.
10. Run package-specific validation, then root validation.

## Required Verification

```text
pnpm --filter @ai-virtual-pet/domain typecheck
pnpm --filter @ai-virtual-pet/domain test
pnpm --filter @ai-virtual-pet/domain build
pnpm typecheck
pnpm test
pnpm build
```

## Acceptance Criteria

- The domain package has no React, Vite, Fastify, Drizzle, PostgreSQL, HTTP, AI, or Search dependencies.
- Egg, unnamed Baby, and named Baby are representable without invalid field combinations.
- Normal domain operations never return stats outside `0–100`.
- Feed behavior is deterministic and tested at normal, near-full, full, sleeping, and clamp boundaries.
- Play behavior is deterministic and tested at valid, exact-threshold rejection, sleeping, clamping, and diminishing boundaries.
- Sleep and Wake transitions and timestamps are deterministic and tested.
- Rejections are structured and do not mutate state.
- Domain events are returned without persistence knowledge.
- Domain tests do not require PostgreSQL.
- Root typecheck, tests, and build remain passing.

