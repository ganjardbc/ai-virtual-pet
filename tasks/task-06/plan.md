# Task 06 — Phase 5 Debug Harness

## Status

Complete.

## Goal

Make time simulation and balancing fast to inspect through a development-only API that drives the real simulation path. No manual database edits, and no stat shortcuts disguised as time travel.

## Scope

- Explicit environment gating: debug routes exist only when enabled, and never in production.
- A debug clock (`OffsetClock`) that shifts server time by an offset. All game code keeps using the injected `Clock`.
- Debug endpoints under `/api/v1/debug`:
  - `GET /pet/state`: normal snapshot plus debug data (clock, mood score breakdown, longer event list).
  - `POST /time/advance`: advances the clock by hours and/or days, then runs the normal load → simulate → persist path.
  - `POST /pet/sleep`: force sleep.
  - `POST /pet/wake`: wake, using the domain wake rule.
  - `PATCH /pet/state`: set Hunger, Energy, Happiness, and/or Bond (clamped).
  - `POST /pet/reset`: remove the pet and its history, and reset the debug clock.
- Shared debug contracts in `@ai-virtual-pet/contracts`.
- Debug API tests, including the Phase 5 gate journey and +7 days.

## Out of Scope

- The Debug UI panel (Phase 7).
- Set random seed and force activity (optional in scope §56).
- Personality and growth debug.

## Dependencies

- Task 05 / Phase 4 is complete.
- `docs/18-implementation-plan.md` §69–78, `docs/08-api-design.md` §69–71, `docs/17-prototype-01-wireframe.md` §60–69, and scope §54–57.

## Debug Decisions

- **Gating:** routes are registered only when `buildApp` receives a `debug` dependency. `server.ts` enables it only when `ENABLE_DEBUG_API=true`, and refuses to start if that flag is set with `NODE_ENV=production`.
- **Time travel:** time advances by increasing the clock offset, then calling the normal `getPet` path. Nothing subtracts stats directly.
  - Limit: up to 365 days per call.
  - On startup, the offset catches up to the current pet's `lastSimulatedAt`, so a restart after time travel does not freeze the pet until real time catches up.
- **Force Sleep:** a debug transition. It sets `SLEEPING` and `sleepStartedAt`, and emits `PET_STARTED_SLEEPING` with `source: DEBUG`. It gives no Bond and does not update `lastInteractionAt`, because a debug command is not a player interaction.
- **Wake:** uses the domain `wakePet`.
- **Force Sleep and Wake results:** `status: SUCCESS | REJECTED` with a `reason`, the same pattern as player actions. For example, waking an awake pet returns `INVALID_STATE`.
- **Set State:** accepts finite numbers and clamps them to 0–100. It emits `DEBUG_STATE_CHANGED` with the before and after values, so playtest history shows manual edits.
- **Reset:** deletes the pet with its state and events, and resets the clock offset. The client then follows the normal Egg flow (`GET` → 404 → `POST /pet`).
- **Shared orchestration:** debug mutations reuse `PetService`'s load → simulate → save-with-retry flow through a subclass. There is no second orchestration path.

## Required Verification

```text
pnpm --filter @ai-virtual-pet/contracts test
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
Manual smoke with ENABLE_DEBUG_API=true against local PostgreSQL.
```

## Acceptance Criteria

- Debug routes return 404 when debug is not enabled, and production start with debug enabled fails.
- Advance +1h, +6h, +12h, +1d, +3d, and +7d run the real simulation and return valid state.
- Force sleep, wake, set stat, and reset work and are tested.
- The Phase 5 gate journey works through the API: healthy → +12h → hungry/tired → sleep → +6h → recovered → +7d → long-absence state.
- Root typecheck, tests, and build remain passing.
