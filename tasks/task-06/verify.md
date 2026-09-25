# Task 06 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
ENABLE_DEBUG_API=true  API_PORT=3918 node apps/api/dist/server.js   (smoke + restart)
ENABLE_DEBUG_API=false API_PORT=3918 node apps/api/dist/server.js
ENABLE_DEBUG_API=true NODE_ENV=production node apps/api/dist/server.js
```

## Results

- API tests passed: 77 (60 existing + 17 debug).
- Root typecheck passed for all 5 workspaces.
- Root tests passed: domain 42, simulation 91, contracts 6, API 77, web 1.
- Root build passed.
- The first typecheck of the debug tests failed on an `undefined` payload under `exactOptionalPropertyTypes`; fixed by building inject options conditionally.
- Manual smoke against the real server and the dev database:

  | Step | Hunger | Energy | Happiness | Bond | Activity / result |
  | --- | --- | --- | --- | --- | --- |
  | Healthy | 100 | 100 | 70 | 10 | |
  | +12h | 76 | 81.2 | 72 | | LOOKING_AROUND |
  | +12h | 52 | 62.2 | | | |
  | Sleep (player) | | | | 10.1 | SLEEPING |
  | +6h | 42.7 | 88.1 | | | awake, PLAYING_ALONE, mood HAPPY |
  | +7d | 0 | 28.9 | 30 (floor) | 10.1 (unchanged) | VERY_HUNGRY, mood HUNGRY |

  - After restarting the server, the debug offset caught up to about 198h and the pet was unchanged.
  - Set energy 5 → mood SLEEPY.
  - Reset → `GET /pet` returns `PET_NOT_FOUND`.
  - With debug disabled, `/api/v1/debug/pet/state` returns 404 `NOT_FOUND`.
  - With `NODE_ENV=production` and debug enabled, the server refused to start: "ENABLE_DEBUG_API must not be enabled when NODE_ENV=production."
  - The dev database was left empty (reset removed the smoke pet).
- Every +1h, +6h, +12h, +1d, +3d, and +7d step finished in under 500 ms including HTTP (asserted).

## Acceptance Criteria

- [x] Debug routes return 404 when debug is not enabled, and a production start with debug enabled fails.
- [x] +1h, +6h, +12h, +1d, +3d, and +7d run the real simulation and return valid state, on both stores.
- [x] Force sleep, wake, set stat, and reset work and are tested.
- [x] The Phase 5 gate journey works through the API (tests and manual smoke).
- [x] Root typecheck, tests, and build remain passing.

## Phase 5 Gate

```text
healthy → +12h → hungry/tired → sleep → +6h → recovered → +7d → long absence   ✓
(no manual database edits)
```

## Remaining Issues

None blocking Phase 5. See the balancing finding in `implementation.md`.
