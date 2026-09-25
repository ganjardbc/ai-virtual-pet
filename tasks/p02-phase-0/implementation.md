# Prototype 0.2 — Phase 0: Implementation Record

## Status

Complete. No source code changed.

## Task 0.2 — Architecture Map

Actual locations of systems Prototype 0.2 extends:

| System | Location | Notes |
| --- | --- | --- |
| Pet domain | `packages/domain/src/pet.ts` | Stages `EGG`, `BABY`. |
| PetState | `packages/domain/src/state.ts` | Stats are `number` 0–100 (`primitives.ts`); Bond is fractional. |
| GameRules | `packages/domain/src/config.ts` (`DEFAULT_GAME_RULES`) | Feed Bond 0.3 / 0.1, Play Bond 1, Sleep Bond 0.1. No game-wide Bond soft cap. |
| Actions | `packages/domain/src/actions.ts` | `applyFeed`, `applyPlay`, `startSleep`. |
| Events | `packages/domain/src/events.ts` | `DomainEventType` union — extend for `PET_TALKED`, `PERSONALITY_CHANGED`. |
| Clock / Random | `packages/domain/src/clock.ts`, `random.ts` | `Random` has `SequenceRandom` / `SeededRandom` for deterministic tests. |
| Simulation | `packages/simulation/src/simulate.ts`, `autonomy.ts`, `mood.ts` | `simulateElapsedTime` returns `{ state, events }`; emits `PET_ACTIVITY_CHANGED`. |
| Repositories | `apps/api/src/persistence/repositories.ts` (interfaces), `drizzle.ts`, `memory.ts` | Two implementations: Drizzle + `InMemoryStore`. |
| DB schema | `apps/api/src/db/schema.ts`, migrations in `apps/api/drizzle/` | Tables `pets`, `pet_states`, `events`; cascading FKs; one migration `0000`. |
| Application service | `apps/api/src/application/pet-service.ts` | `PetService.act(type)` → `mutate()` = load → simulate → operate → `pets.save` (optimistic `version`, retry `DEFAULT_MAX_ATTEMPTS = 5`). |
| API routes | `apps/api/src/http/pet-routes.ts` | `POST /api/v1/pet/actions` → `service.act`. Envelope in `http/envelope.ts`. |
| Error codes | `packages/contracts/src/errors.ts` | `apiErrorCodeSchema` + `API_ERROR_STATUS`. |
| Contracts | `packages/contracts/src/{requests,responses,enums,debug}.ts` | Zod schemas shared by API and web. |
| App wiring | `apps/api/src/app.ts` | `buildApp(deps)`; debug mode swaps in `DebugPetService` and requires `OffsetClock`. |
| Env | `apps/api/src/config/env.ts` | Loads repo-root `.env`; `requireEnv` / `optionalEnv`. |
| Debug service / routes | `apps/api/src/debug/debug-service.ts`, `debug-routes.ts`, `offset-clock.ts` | Reset = `pets.deleteAll()` + clock reset. |
| Web API client | `apps/web/src/api/client.ts`, `pet-queries.ts` | TanStack Query; `newestSnapshot()` guards stale snapshots. |
| Debug UI | `apps/web/src/debug/DebugPanel.tsx`, `DebugPanelView.tsx`, `debug-api.ts` | |
| Pet Home | `apps/web/src/screens/PetHome.tsx` | |
| Player copy / reactions | `apps/web/src/presentation/copy.ts`, `reactions.ts` | Indonesian; `reactionForAction` is the fallback source (plan Task 7.14). |
| Test DB helper | `apps/api/src/testing/database.ts` | `truncateAll` lists tables explicitly. |

## Implications for Prototype 0.2

Confirmed against the plan; no contradiction requiring a decision.

1. **Every new repository needs both Drizzle and in-memory implementations**, and shared contract tests, like existing repositories (`repositories.test.ts` runs both).
2. **Same-transaction personality save (Task 2.4)** requires extending `SavePetInput` / `PetRepository.save` (e.g. optional personality write) — `mutate()` currently saves only pet, state, events.
3. **Chat actions via `PetService.act` (Task 7.5):** `act` currently takes only `ActionType`. Needs an extension point for `turnMessageId` (Task 3.8) and the personality signal; extend, don't fork.
4. **Debug reset (Task 10.8):** Drizzle relies on cascading FKs — new tables must cascade. `InMemoryStore.deleteAll()` clears maps explicitly, so it must also clear personality / conversation / messages.
5. **`truncateAll` in `testing/database.ts`** must add new tables, otherwise PostgreSQL tests leak rows between cases.
6. **Talk Bond (Task 7.8):** add `talk` block to `GameRules` and `talkBondDate` / `talkBondToday` to `PetState` + `pet_states`; `createPetState` validation and snapshot mapping must accept them.
7. **Recap UI** must ignore new event types (`PET_TALKED`, `PERSONALITY_CHANGED`) — check `apps/web/src/presentation/recap.ts` in Unit 07.

## Repository Housekeeping

- The project was not a git repository. Initialized git and committed the Prototype 0.1 baseline.
- Added `.pnpm-store/` to `.gitignore` (local pnpm store was inside the project and untracked).

## Files Changed

```text
.gitignore
tasks/p02-phase-0/*
```
