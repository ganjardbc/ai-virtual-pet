# Task 09 — Implementation Record

## Status

Complete.

## Implemented

- **API integration suite** (`apps/api/src/integration.test.ts`, 18 tests, run against both the in-memory store and PostgreSQL):
  - **8.1**: full lifecycle (create, hatch, name, +24h, feed, play, sleep, +20h). The return shows the pet awake with recovered Energy, a persisted `PET_WOKE_UP`, and recent activity events.
  - **8.2/8.3**: a new API instance on a new connection pool returns the same snapshot.
  - **8.4**: +7 days with no death, Bond 40 kept, valid stats, Happiness ≥ 30, fewer than 80 events. Then three feeds and a night's sleep bring the pet back to a non-hungry state with Energy above 80.
  - **8.5**:
    - Repeated Feed: 20 → 45 → 70 → 95, then `TOO_FULL`.
    - Repeated Play: multipliers 1, 0.75, 0.5, 0.25, then `TOO_TIRED`.
    - Five concurrent Feeds: no lost updates. Hunger equals the sequential result, the version increments once per commit, and there is one `PET_FED` per commit.
  - **8.6**:
    - Sleep at Energy 5 wakes at exactly 7.5h (`ENERGY_RESTORED`).
    - Sleep at 98 holds for the 30-minute minimum.
    - One request spanning auto-wake is split into sleep and awake time; Hunger matches exactly.
    - +3 days after falling asleep leaves a valid state.
- **Defects found and fixed:**
  1. **Concurrent writes returned conflicts too early.** With PostgreSQL, 5 simultaneous Feeds produced 3 commits and 2 `PET_STATE_CONFLICT` responses, because retries collide in lockstep (one winner per round). The service now allows 5 attempts, so all 5 commit (measured 3 runs × 2 stores). Data integrity was already correct; this is a UX improvement.
  2. **Wake-ups dropped out of the recap.** After about 20h, hourly `PET_ACTIVITY_CHANGED` events pushed `PET_WOKE_UP` out of the 10-event snapshot window. The snapshot now carries 20 recent events.
  3. **The API crashed on startup when the database was down** (debug mode's clock catch-up query was not guarded). The catch-up is now best-effort and logs a warning. Requests then return 500 `INTERNAL_ERROR` without exposing details, and the web shows "Couldn't connect to the game server."
  4. **Some colors failed contrast:**

     | Element | Before | Fix | After |
     | --- | --- | --- | --- |
     | Primary button text (white on coral) | 2.93 | Ink text on the same coral, which keeps the identity | 5.14 |
     | Coral icons | 2.93 | `--color-action-primary-strong` | 3.82 |
     | Muted text | 3.98 | Darkened | 5.15 |
     | "Sleeping" teal text | 2.95 | `--color-action-secondary-strong` | 5.01 |

  5. **Removed speculative abstractions:** `PetRepository.findById` and the `EventQuery.types` filter were only used by tests.
- **Dev workflow:** verified that `pnpm dev` works from a clean checkout without prebuilt package `dist`, because tsx honors tsconfig `paths` and Vite uses aliases. Removed the "build first" step from the README.

## Files Changed

```text
README.md
apps/api/src/integration.test.ts                (new)
apps/api/src/server.ts
apps/api/src/application/pet-service.ts
apps/api/src/persistence/{repositories,memory,drizzle}.ts
apps/api/src/persistence/repositories.test.ts
apps/api/src/http/pet-routes.test.ts
apps/web/src/styles/{tokens,app}.css
tasks/task-09/*
```

## Decisions and Deviations

- **More retry attempts instead of backoff with jitter.** Jitter would need randomness in the application layer. Using the game's injected `Random` would perturb simulation determinism, and adding `Math.random` would blur the "no uncontrolled randomness" rule. Five attempts bound concurrent writes per pet, which a single player cannot realistically exceed.
- **The Debug toggle stays 32 px tall**, below the 44 px comfort guideline but above the WCAG 2.2 AA 24 px minimum. It is a development-only control, and every player control is 48 px or taller.
- **`/health` stays database-independent** (a Task 01 decision). Database failure appears on game requests.

## Known Limitations

- The recap window is the last 20 events. After very long or very active absences, earlier autonomous events are summarized away (Task 03's 48-hour detail horizon also applies).
- Balancing decisions remain open for the playtest (not Phase 8 scope):
  - A fresh Baby refuses its first Feed.
  - The first "Hungry" appears after about 25 awake hours.
  - A returning player can find the pet asleep with care blocked.
  - Copy language: English or Indonesian.
