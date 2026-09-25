# Task 04 — Verification Record

## Status

Passed.

## Commands Run

```text
createdb ai_virtual_pet_test
pnpm install --offline
pnpm --filter @ai-virtual-pet/api exec drizzle-kit generate --name initial_pet_persistence
pnpm --filter @ai-virtual-pet/api db:migrate            (twice; second run is a no-op)
psql "$DATABASE_URL" -c "\dt"
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
TEST_DATABASE_URL= pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
grep -rn "drizzle-orm|db/schema" packages/
```

## Results

- Migration generated and applied. The development database has `events`, `pet_states`, and `pets`. Re-running the migration succeeds without changes.
- Integration tests migrate the empty `ai_virtual_pet_test` database from scratch before the suite.
- API tests passed: 31 tests.
  - 11 in-memory contract tests.
  - 19 PostgreSQL tests: 10 contract, 1 reload, 1 rollback, 7 constraints.
  - 1 health test.
- Without `TEST_DATABASE_URL`: 12 passed, 19 skipped, no failures.
- Root typecheck passed for all 4 workspaces.
- Root tests passed: domain 42, simulation 91, API 31, web 1.
- Root build passed. API `dist` contains `config`, `db`, and `persistence`, with no tests or `testing/` helpers.
- Domain and simulation packages have no Drizzle or schema imports.
- The first version of the constraint assertions failed because Drizzle wraps PostgreSQL errors ("Failed query: ..."). Assertions now check `cause.code === '23514'` (check_violation).

## Acceptance Criteria

- [x] The schema can be created from migrations on an empty database.
- [x] A pet can be created, loaded, updated, and reloaded (new connection) without resetting.
- [x] State updates and events persist atomically (rollback test: a failed event insert leaves version and state unchanged).
- [x] A stale version write is rejected with `ConcurrencyError` and writes nothing.
- [x] Database constraints reject out-of-range stats, unknown activity, sleeping without `sleep_started_at`, a named Egg, a hatched stage without `hatched_at`, and an unknown stage.
- [x] Events are returned in stable order (identity tiebreak), and Play times can be queried for the diminishing window.
- [x] Drizzle row types do not escape `apps/api/src/db` and `apps/api/src/persistence`.
- [x] Root typecheck, tests, and build remain passing.

## Phase 3 Gate

```text
Schema/migrations       ✓
Pet persistence         ✓
State persistence       ✓
Event persistence       ✓
Repository abstraction  ✓
Reload works            ✓
```

## Remaining Issues

None blocking Phase 3.
