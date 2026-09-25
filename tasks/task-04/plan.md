# Task 04 — Phase 3 Persistence

## Status

Complete.

## Goal

Keep the authoritative pet (identity, current state, and event history) across process and application restarts, behind repository contracts that do not leak Drizzle types into the domain.

## Scope

- Drizzle schema for `pets`, `pet_states`, and `events` in PostgreSQL.
- A generated SQL migration and a documented migration workflow.
- Database constraints for the domain invariants the database can enforce.
- Optimistic concurrency through `pets.version`.
- Application-facing repository contracts (`PetRepository`, `EventRepository`).
- A Drizzle repository implementation that maps rows to and from domain models at the infrastructure boundary.
- An in-memory repository implementation with the same contract, for fast application and API tests.
- Shared repository contract tests run against both implementations. The Drizzle run uses a real local test database.

## Out of Scope

- HTTP routes and application services (Phase 4).
- `users`, `pet_personalities`, `pet_growth`, memory, conversation, and skill tables. They are not required by the Prototype 0.1 scope (§48) and would add behavior that does not exist yet.
- Multi-pet or multi-user queries.

## Dependencies

- Task 03 / Phase 2 is complete.
- Local PostgreSQL 16 from Task 01.
- Schema direction from `docs/07-data-model.md` §8–13, §42–47, §77–81, §89, §99, §105–108.

## Persistence Decisions

- `pets`:
  - Columns: `id` text primary key (application-generated), `name`, `species` (default `DEFAULT`), `stage`, `created_at`, `hatched_at`, `updated_at`, `version`.
  - Checks: stage/`hatched_at` consistency, stage values, name length.
- `pet_states`:
  - One-to-one with `pets`; the primary key is also a foreign key, with cascade delete.
  - Stats are stored as `double precision` with 0–100 checks.
  - Activity is checked against the allowed values, and `sleep_started_at` must match the sleeping state.
- `events`:
  - Append-only.
  - Columns: identity `bigint` primary key (gives a stable insertion order when events share a timestamp), `pet_id` foreign key, `type`, `occurred_at`, `data` jsonb, `schema_version`, `created_at`.
  - Indexes on `(pet_id, occurred_at)` and `(pet_id, type, occurred_at)`.
- All timestamps are `timestamptz` in UTC.
- A pet row and its state row are created together in one transaction, including for an Egg, per data model §108.
- `save` writes pet, state, and new events in one transaction, guarded by `WHERE version = expected`. A stale write fails with `ConcurrencyError`.
- The single-pet prototype uses `findCurrent()` (most recently created pet). There is no user scoping.
- `EventRepository` answers the reads the rules need: recent events, and Play times since a cutoff for the diminishing window.
- Integration tests use a separate database (`TEST_DATABASE_URL`). Migrations run before the suite and tables are truncated between tests.

## Target Structure

```text
apps/api/
├── drizzle/                       (generated migrations)
├── drizzle.config.ts
└── src/
    ├── db/
    │   ├── schema.ts
    │   ├── client.ts
    │   ├── migrate.ts
    │   └── check.ts
    └── persistence/
        ├── repositories.ts        (contracts + errors)
        ├── memory.ts              (in-memory implementation)
        ├── drizzle.ts             (Drizzle implementation + mapping)
        └── repositories.test.ts   (shared contract tests)
```

## Required Verification

```text
pnpm --filter @ai-virtual-pet/api db:generate
pnpm --filter @ai-virtual-pet/api db:migrate
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
```

## Acceptance Criteria

- The schema can be created from migrations on an empty database.
- A pet can be created, loaded, updated, and reloaded without resetting.
- State updates and events persist atomically.
- A stale version write is rejected.
- Database constraints reject invalid stat ranges and inconsistent sleeping state.
- Events are returned in stable order, and Play times can be queried for the diminishing window.
- Drizzle row types do not escape the persistence layer.
- Root typecheck, tests, and build remain passing.
