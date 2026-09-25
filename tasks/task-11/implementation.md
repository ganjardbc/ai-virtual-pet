# Task 11 — Implementation Record

## Status

Complete.

## Bugs Found and Fixed

| # | Area | Bug | How confirmed | Fix |
| --- | --- | --- | --- | --- |
| 1 | API / persistence | Concurrent `POST /pet` created **multiple pets** (4 concurrent requests gave 2 pets), breaking the single-pet rule (API design §7, implementation plan §59). | Live probe: `201 409 409 201`, 2 rows in `pets` | `PetRepository.create` is now atomic single-pet. Drizzle: a transaction-scoped `pg_advisory_xact_lock` plus an existence check before insert. Memory: synchronous check and insert. It throws `PetAlreadyExistsError`, which the service maps to 409 `PET_ALREADY_EXISTS`. The service's racy pre-check was removed. |
| 2 | Contracts / domain | A name made only of zero-width characters (`​`) was accepted, giving the pet an invisible name and an empty header. | Live probe: stored `'​​'` | `normalizePetName` (domain) and `petNameSchema` (contracts) strip `U+200B–U+200D`, `U+2060`, and `U+FEFF` before trimming. `"Mo​mo"` becomes "Momo". |
| 3 | Web | An in-flight background `GET /pet` (60 s refresh or window focus) resolving after an action could **overwrite a newer snapshot with an older one**. The UI would briefly show pre-action state, and return detection could miscompare. | Code review: TanStack `setQueryData` does not cancel in-flight fetches | `newestSnapshot()`: versions only grow, so an older snapshot of the same pet never replaces a newer one, while a reset (`null`) or a different pet always wins. Applied to the query function, all mutations, and debug commands (`storeSnapshot`). |
| 4 | Web config | The Vite dev proxy read `API_PORT` only from the shell. Setting `API_PORT` in the root `.env` (as documented) moved the API but not the proxy, which broke the game. | Code review; `loadEnv` check | `vite.config.ts` loads the repository-root `.env` through `loadEnv`. Shell variables still take precedence. |
| 5 | Web | A failed Hatch or Name request caused by a lifecycle or conflict error (e.g. the pet changed in another tab) left a stale view until the next 60 s refresh. | Code review | `useHatch` and `useNamePet` reload the pet on `ApiError`, as actions already did. |
| 6 | Web accessibility | The disabled-action hint was announced as "Beri makan . Momo sedang tidur." (stray period). | Browser text output | Changed to "Beri makan (Momo sedang tidur.)". |

The Naming screen now takes its validation from the shared contract schema only (no duplicated normalization regex).

## Suspected Bugs Cleared (not reproducible)

- **Simulation, actions, and invariants.** A randomized fuzz ran 400 seeds × 60 steps. Gaps ranged from milliseconds to 400 h, with random Feed, Play, Sleep, and Wake. Checks: stats within 0–100, `createPetState` validity (sleep consistency), `lastSimulatedAt` equal to the target, no Bond change from simulation, and mood and label derivation. Zero violations, zero exceptions. (Temporary harness, removed afterwards.)
- **Pet Home flash after naming.** Suspected a frame of Pet Home between the cache update and the celebration state. A browser MutationObserver probe recorded `FORM → CELEBRATE → HOME`, with no flash, because React batches the updates.

## Files Changed

```text
packages/domain/src/primitives.ts, model.test.ts
packages/contracts/src/requests.ts, requests.test.ts
apps/api/src/persistence/{repositories,drizzle,memory}.ts, repositories.test.ts
apps/api/src/application/pet-service.ts
apps/web/vite.config.ts
apps/web/src/api/pet-queries.ts, pet-queries.test.ts (new)
apps/web/src/debug/DebugPanel.tsx
apps/web/src/screens/NamingScreen.tsx
apps/web/src/components/ActionButton.tsx
tasks/task-11/*
```

## Contract Change

`PetRepository.create` previously allowed several pets, and `findCurrent` returned the most recent one. It now enforces one pet. The repository contract test "treats the most recently created pet as current" was replaced by "allows only one pet, even when creates race" (three concurrent creates give one success and two `PetAlreadyExistsError`, on both stores). This resolves the Task 05 limitation about duplicate creates.

## Known Limitations

- Suspected issues outside the fixes above were reviewed and judged acceptable for the prototype:
  - Every `GET` writes a new version.
  - The debug view does not auto-refresh.
  - An API 500 is shown as "Tidak bisa terhubung ke server game."
- A native-speaker review of the Indonesian copy is still pending (watch item W6).
