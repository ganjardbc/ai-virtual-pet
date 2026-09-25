# Task 02 — Implementation Record

## Status

Complete.

## Implemented

- Added the `@ai-virtual-pet/domain` workspace package with ESM build output and Vitest.
- Added domain primitives: `PetId`, `PetName`, `StatValue`, stat clamping/validation, name normalization (trim, collapse whitespace, 1–30 characters), and Date validation.
- Added the Pet model as a discriminated union: `EggPet` (no name, no `hatchedAt`) and `BabyPet` (required `hatchedAt`, optional name), with `createEgg`, `hatchPet`, and `namePet`.
- Added `PetState` with the six Prototype 0.1 activities, validated construction (`createPetState`), and sleeping/`sleepStartedAt` consistency checks.
- Added `createInitialPetState`, driven by `GameRules.initialState`.
- Added `Clock` (`SystemClock`, `FakeClock`) and `Random` (`SystemRandom`, `SequenceRandom`) abstractions.
- Added one deeply frozen `DEFAULT_GAME_RULES` configuration covering initial state, Hunger/Energy rates, Happiness pressure, Feed, Play, and Sleep/auto-wake values.
- Added `DomainEvent` with the Prototype 0.1 event types and a persistence-free constructor.
- Implemented pure action rules returning structured `ActionResult`s:
  - `applyFeed` — normal, diminished (Hunger 75–89), `TOO_FULL` (Hunger ≥ 90), `SLEEPING`.
  - `applyPlay` — Energy > 15 validation (`TOO_TIRED`), `SLEEPING`, two-hour diminishing window.
  - `startSleep` — `SLEEPING` activity, `sleepStartedAt`, `+0.1` Bond, rejects when already asleep.
  - `wakePet` — returns to `IDLE`, clears `sleepStartedAt`, `INVALID_STATE` when awake.
- Rejected actions return the unchanged state object plus an `ACTION_REJECTED` event.
- Exported the public API from `src/index.ts`.
- Added 41 unit tests across primitives, Pet/PetState models, clock/random, config, and all actions.

## Files Changed

```text
packages/domain/package.json
packages/domain/tsconfig.json
packages/domain/tsconfig.build.json
packages/domain/src/index.ts
packages/domain/src/primitives.ts
packages/domain/src/pet.ts
packages/domain/src/state.ts
packages/domain/src/clock.ts
packages/domain/src/random.ts
packages/domain/src/config.ts
packages/domain/src/events.ts
packages/domain/src/actions.ts
packages/domain/src/model.test.ts
packages/domain/src/control.test.ts
packages/domain/src/actions.test.ts
pnpm-lock.yaml
```

## Decisions and Deviations

- The domain `tsconfig.json` overrides the shared Node config with `"types": []`. The package does not depend on `@types/node`, and removing Node globals enforces the platform-free domain boundary at compile time.
- `GameRules` includes the Phase 2 rates (Hunger/Energy decay and recovery, Happiness pressure, auto-wake at Energy ≥ 95 or after 8 hours) as values only, so Task 1.6 ("core balancing can be changed from one configuration layer") is met. No simulation logic uses them yet.
- Initial Baby state follows `docs/07-data-model.md` §108: Hunger 100, Energy 100, Happiness 70, Bond 10, `IDLE`. As a result, Feed is rejected with `TOO_FULL` until Hunger decays below 90. Playtesting should decide whether this is too restrictive.
- Feed's `effectMultiplier` is derived from config (`diminished.hunger / base.hunger` = 0.4) instead of hardcoded.
- The Play diminishing window counts plays strictly within the last two hours. A play exactly two hours old no longer counts. The caller supplies previous Play timestamps, so the domain needs no extra state field. Phase 3 persistence can derive the timestamps from `PET_PLAYED` events.
- Wake does not update `lastInteractionAt`, because automatic wake is not a player interaction.
- Hatch and Name return new Pet values but no events yet. `PET_HATCHED`/`PET_NAMED` are defined and will be emitted by the application layer in Phase 4, where the pet and its events are persisted together.
- The Bond daily soft cap (`docs/02-game-systems.md` §20) is not implemented. It is not in the Prototype 0.1 scope or the Task 02 plan.

## Known Limitations

- There is no elapsed-time simulation, automatic wake, autonomous activity, or mood derivation yet (Phase 2).
- `SequenceRandom` throws once its sequence runs out. A seeded PRNG may be needed for long scenario tests in Phase 2.
- `DomainEvent.payload` is untyped (`Record<string, unknown>`). Typed per-event payloads can be added when API contracts are defined.
