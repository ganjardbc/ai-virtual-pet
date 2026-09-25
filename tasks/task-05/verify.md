# Task 05 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm install
pnpm --filter @ai-virtual-pet/contracts typecheck
pnpm --filter @ai-virtual-pet/contracts test
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
API_PORT=3917 node apps/api/dist/server.js     (manual smoke, then restart, against local ai_virtual_pet)
curl GET/POST/PATCH journey
```

## Results

- Contracts: typecheck passed; 6 tests passed.
- API tests passed: 60.
  - 9 in-memory contract tests plus 6 validation cases.
  - The same 15 against PostgreSQL.
  - 5 error-model tests.
  - 24 repository tests from Task 04.
  - 1 health test.
- Root typecheck passed for all 5 workspaces.
- Root tests passed: domain 42, simulation 91, contracts 6, API 60, web 1.
- Root build passed for all workspaces.
- Manual smoke against the real server and the dev database:
  - `GET` before create → 404 `PET_NOT_FOUND`.
  - `POST` → 201.
  - Hatch → `SUCCESS`, `BABY`.
  - Name `"  Momo "` → `Momo`.
  - Feed at full → 200 `REJECTED TOO_FULL`.
  - Play → `SUCCESS` with changes `{ hunger: -4, energy: -10, happiness: 12, bond: 1 }` and mood `EXCITED`.
  - Sleep → `SLEEPING`.
  - Invalid action → 400 `VALIDATION_ERROR` with issues.
  - After a server restart, `GET` returned the same named, sleeping pet.
  - The smoke-test pet was then deleted, so the dev database is empty again.
- The first concurrent-Feed test passed but never produced a conflict, because the two requests happened to run one after the other. A deterministic race test now holds both loads at the same version: it asserts exactly one conflict, a retry, and versions 2 and 3.
- The smoke test showed floating-point noise in `changes` (`bond: 0.0999…`). Deltas are now rounded.
- Route handlers contain no game rules (grep for stat names or rule terms in `pet-routes.ts` found nothing).

## Acceptance Criteria

- [x] The full journey (Create Egg → Hatch → Name → Feed → Play → Sleep → Time Passes → GET) passes through HTTP injection tests, against both stores.
- [x] Required flows covered: create/get egg, hatch, name, get Baby, feed, play, play rejection, sleep, get after elapsed time.
- [x] Domain rejections (`TOO_FULL`, `TOO_TIRED`, `SLEEPING`) return 200 `REJECTED`, never 5xx.
- [x] `VALIDATION_ERROR`, `PET_NOT_FOUND`, `NOT_FOUND`, `PET_ALREADY_EXISTS`, `INVALID_PET_STAGE`, `PET_STATE_CONFLICT`, and `INTERNAL_ERROR` are distinguishable by code. Technical details are not exposed.
- [x] Two concurrent Feeds apply in sequence (hunger +25 then +10). The version increments once per commit, and exhausted retries return 409.
- [x] Routes contain no game rules; the service contains no HTTP concerns.
- [x] All success and error responses in tests are parsed with the shared contract schemas.
- [x] Root typecheck, tests, and build remain passing.

## Phase 4 Gate

```text
Create Egg → Hatch → Name → Feed → Play → Sleep → Time Passes → GET Pet   ✓ (HTTP tests + manual smoke)
```

## Remaining Issues

None blocking Phase 4. See the Known Limitations in `implementation.md` (possible duplicate create race, no cross-request mood stability, no idempotency keys).
