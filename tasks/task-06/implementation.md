# Task 06 — Implementation Record

## Status

Complete.

## Implemented

- **`OffsetClock`** (`apps/api/src/debug/offset-clock.ts`): the base clock plus a forward-only offset.
  - `advanceBy` (positive only).
  - `catchUpTo` (never moves backward).
  - `reset`.
- **`DebugPetService`** (`debug/debug-service.ts`) extends `PetService` and reuses its `mutate` flow (load → simulate → save with version check and retry → snapshot):
  - `getState`: normal snapshot plus `debug`:
    - `clock`: `now`, `offsetMs`.
    - `moodCandidates`: score breakdown.
    - `events`: last 25.
  - `advanceTime`: requires a pet, advances the offset, then runs the normal simulation path.
  - `forceSleep`: sets `SLEEPING` and `sleepStartedAt`, emits `PET_STARTED_SLEEPING` with `source: DEBUG`. No Bond, no `lastInteractionAt`. Returns `REJECTED SLEEPING` if the pet is already asleep.
  - `wake`: domain `wakePet`, emitting `PET_WOKE_UP` with `source: DEBUG`. Returns `REJECTED INVALID_STATE` if the pet is awake.
  - `setState`: clamps each provided stat, validates through `createPetState`, and emits `DEBUG_STATE_CHANGED { before, after }`.
  - `reset`: `deleteAll()` and a clock reset.
- **Debug routes** (`debug/debug-routes.ts`):
  - `GET /api/v1/debug/pet/state`
  - `POST /api/v1/debug/time/advance`
  - `POST /api/v1/debug/pet/sleep`
  - `POST /api/v1/debug/pet/wake`
  - `PATCH /api/v1/debug/pet/state`
  - `POST /api/v1/debug/pet/reset`
- **Gating:**
  - `buildApp` registers debug routes (and uses `DebugPetService` for the player routes too) only when `debug: { clock }` is provided, and throws if the game clock is not that debug clock.
  - `server.ts` enables debug only when `ENABLE_DEBUG_API=true`, and refuses to start with `NODE_ENV=production`.
  - On startup in debug mode, the clock catches up to the current pet's `lastSimulatedAt`.
- **Contracts** (`packages/contracts/src/debug.ts`):
  - `debugAdvanceTimeRequestSchema`: `hours` and/or `days`, positive, 365 days at most.
  - `debugSetStateRequestSchema`: strict, finite numbers, at least one stat.
  - `debugStateSchema`, `debugAdvanceTimeResultSchema`, `debugCommandResultSchema`, `debugResetResultSchema`.
- **New event type `DEBUG_STATE_CHANGED`** in the domain and contracts enums.
- **`PetService` changes:**
  - `mutate`, `snapshot`, `requireCurrent`, `deps`, and `rules` are now `protected`.
  - `Loaded` and `Mutation` are exported.
  - `Mutation.result` may be async.
  - `toPetEventDto` is exported for reuse.
- `ENABLE_DEBUG_API` added to `.env.example`, the local `.env`, and a README Debug API section.
- **Tests** (`debug/debug-routes.test.ts`, 17 new). The debug contract suite runs against both the in-memory store and PostgreSQL:
  - Phase 5 gate journey.
  - All six presets.
  - Force sleep and wake.
  - Set state with clamping.
  - Reset.
  - Mood breakdown.
  - Input and lifecycle validation.

  Plus gating tests (routes absent → 404; clock mismatch throws) and `OffsetClock` unit tests.

## Files Changed

```text
.env.example
README.md
packages/domain/src/events.ts
packages/contracts/src/{index,enums,debug}.ts
apps/api/src/app.ts
apps/api/src/server.ts
apps/api/src/application/pet-service.ts
apps/api/src/application/snapshot.ts
apps/api/src/debug/{offset-clock,debug-service,debug-routes}.ts
apps/api/src/debug/debug-routes.test.ts
tasks/task-06/*
```

## Decisions and Deviations

- **Force Sleep is a debug transition, not the domain `startSleep`.** `startSleep` is a player command (+0.1 Bond, updates `lastInteractionAt`). Using it would let debug commands change the relationship and the Bored timer. The event carries `source: DEBUG`.
- **Clock offset lives in memory and is rebuilt from the pet on restart.** No debug table was added. The time between the last request and the restart is lost (minutes), which is acceptable for a development tool.
- **Reset deletes the pet instead of recreating an Egg**, so the client follows the same Egg flow as a first launch.
- **When debug is enabled, player routes also use `DebugPetService`**, so both share one clock and one orchestration path.
- **Set random seed and Force activity (both optional) were not added.**

## Known Limitations

- **Balancing finding (playtest):** at +12h the pet is still `FULL` (Hunger 76), and at +24h it is `OKAY` (52). The first `HUNGRY` label (≤ 50) appears only after about 25 awake hours, so "Dia lapar." may take longer than expected to show up in a daily-play session.
- The clock offset is process-wide. Running several API processes would not share it, which is irrelevant for the local prototype.
- A debug `wake` that follows an auto-wake inside the same simulated window returns `REJECTED INVALID_STATE`, which is correct but can surprise. The Debug UI should show the current activity.
