# Task 09 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @ai-virtual-pet/api vitest run src/integration.test.ts
pnpm dev   (with packages/*/dist moved away)  → curl /health, /api/v1/pet via web proxy
DATABASE_URL=<unreachable> ENABLE_DEBUG_API=true node apps/api/dist/server.js → curl
Headless Chrome (puppeteer-core, scratchpad): harden.mjs (reload, restart, a11y, responsive), colors.mjs
node contrast calculation (WCAG relative luminance)
Scope audit grep over apps/*/src, packages/*/src, apps/api/drizzle
```

## Results

- Root typecheck passed (5 workspaces). Root tests: domain 42, simulation 92, contracts 6, API 95, web 37 (272 total). Root build passed.

| Check | Evidence |
| --- | --- |
| 8.1 Full lifecycle | Integration test passes on both stores. |
| 8.2 Reload | Browser: after Feed and Play, reload shows the same pet (`933fcaa3`, Momo, Hunger 72.993, `PLAYING_ALONE`). Energy drifted by 0.001 from the elapsed seconds. |
| 8.3 Server restart | Browser: killed and respawned the API process with the page open; reload shows the same pet id and state. Integration test: a new app plus a new connection pool gives an identical snapshot. |
| 8.4 Long absence | Integration test: alive, Bond unchanged, stats valid, Happiness at floor, fewer than 80 events, recoverable. Phase 7 browser run: "You're back! I'm pretty hungry." |
| 8.5 Stress | Sequential Feed and Play limits and diminishing verified. Concurrent Feeds on PostgreSQL: 5/5 applied after the fix (was 3 applied, 2 conflicts), with no lost updates either way. |
| 8.6 Sleep boundaries | Exact wake times (7.5h, 3.75h), 30-minute minimum, segmented Hunger, and a long request all pass. |
| 8.7 Errors | API unavailable → "Couldn't connect to the game server." + Retry (Task 07). Invalid request → 400 `VALIDATION_ERROR`. Domain rejection → character line. Database down → the server still boots, `/api/v1/pet` returns 500 `INTERNAL_ERROR` with a generic message, and the web shows the connection message. |
| 8.8 Accessibility | Tab order: Debug → Feed → Play → Sleep, each with a solid 3 px focus outline. 0 unnamed controls. Pet image labeled ("Momo, Playing by itself"). Enter on Feed shows "Yum!". Only the dev Debug toggle is under 44 px (68×32). Status and sleep are text. Contrast fixed (see implementation). |
| 8.9 Responsive | 1280, 820, 375, and 320 px all have 0 px horizontal overflow. Habitat is 440×300, 440×300, 343×300, and 288×260. |
| 8.10 Scope audit | Grep for LLM, OpenAI, Anthropic, embedding, memory, search, skill, inventory, currency, coin, auth, login, user_id, multi-pet, and talk found only false positives (`ConcurrencyError`, "authoritative", `InMemoryStore`, "talking"). Unused `findById` and `EventQuery.types` were removed. |
| Dev workflow | `pnpm dev` from a clean checkout: API health ok, web 200, proxy `GET /pet` works. |

- Cleanup: servers stopped; the smoke-test pet deleted from the dev database.

## Phase 8 Gate — Scope §84 Technical Acceptance

- [x] Monorepo runs (`pnpm dev`, root scripts).
- [x] Web and API run locally (`:5173`, `:3000`, with proxy).
- [x] Local PostgreSQL is reached through environment configuration (`DATABASE_URL`, `TEST_DATABASE_URL`).
- [x] Schema is created by migration (`0000_initial_pet_persistence`; tests migrate an empty database).
- [x] A pet can be created and persisted.
- [x] Reload does not delete the pet (browser and integration).
- [x] Elapsed-time simulation runs.
- [x] Feed works.
- [x] Play works.
- [x] Invalid Play is rejected (`TOO_TIRED`).
- [x] Sleep works.
- [x] Auto wake works (exact boundary tests).
- [x] Autonomous activity works (activity events, poses, recap).
- [x] Events are persisted.
- [x] Debug time travel works (API and UI).
- [x] +7 days can be simulated (under 500 ms including HTTP).
- [x] Domain tests pass (42).
- [x] Simulation tests pass (92).
- [x] API tests pass (95).

## Phase 8 Gate — Scope §85 UX Acceptance

- [x] Egg → Hatch → Name → Pet Home works without debug tools (Task 07 browser journey).
- [x] The pet is the largest visual focus (habitat 440×300 on desktop).
- [x] Feed, Play, and Sleep are easy to find (48 px+ labeled buttons with icons).
- [x] Action feedback is visible (reaction bubble plus pose/expression).
- [x] The sleeping state is clear (bed, Zz, "Sleeping…", disabled actions, "Recovering").
- [x] Hungry and Sleepy are distinguishable (different faces, sprout droop, lines, and status labels).
- [x] Technical errors differ from character rejections (System Voice vs pet speech).
- [x] Debug UI is clearly separate from the Player UI (dark tool panel, lazy chunk, absent from production builds).

## Remaining Issues

None blocking the playtest build. The open balancing and copy decisions are listed in `implementation.md` for Phase 9.
