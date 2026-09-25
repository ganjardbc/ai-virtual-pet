# Task 05 — Phase 4 Application + API

## Status

Complete.

## Goal

Expose the Prototype 0.1 game operations over HTTP without leaking domain mechanics into routes. The backend stays authoritative: clients send intents and receive authoritative snapshots.

## Scope

- Add a `@ai-virtual-pet/contracts` package: Zod request schemas, response DTO schemas and types, API enums, and error codes, shared by the API and web.
- Application service (`PetService`) that orchestrates: load → simulate elapsed time → apply lifecycle/action → persist state and events atomically → build snapshot.
- Endpoints (`/api/v1`):
  - `POST /pet` creates the Egg (one current pet).
  - `GET /pet` loads, simulates, persists, and returns the snapshot.
  - `POST /pet/hatch` changes Egg to Baby and emits `PET_HATCHED`.
  - `PATCH /pet/name` validates with Zod and emits `PET_NAMED`.
  - `POST /pet/actions` handles `FEED`, `PLAY`, and `SLEEP`.
- Domain rejection returned as a successful response (`status: REJECTED`, `reason`).
- Error model separating validation errors, missing or invalid lifecycle, concurrency conflicts, and technical failures.
- Concurrency safety through the persisted version, with bounded retry.
- Request id in every response's `meta`.
- Fastify injection tests for the full journey, using both the in-memory store and PostgreSQL.

## Out of Scope

- Debug endpoints: time travel, set state, force sleep/wake, reset (Phase 5).
- Character reaction mapping and copy (later phase). The API returns semantic enums only.
- Web UI (Phases 6–7).
- Idempotency keys, authentication, rate limiting.

## Dependencies

- Task 04 / Phase 3 is complete.
- API conventions from `docs/08-api-design.md` §7–34, §74–86, §94–100, §109–111, §117.

## API Decisions

- **Envelope:** `{ data, meta: { requestId } }` on success; `{ error: { code, message, details? }, meta: { requestId } }` on error.
- **Error codes and HTTP status:**

  | Code | Status | When |
  | --- | --- | --- |
  | `VALIDATION_ERROR` | 400 | Invalid request |
  | `PET_NOT_FOUND` | 404 | No pet exists yet |
  | `NOT_FOUND` | 404 | Unknown route |
  | `PET_ALREADY_EXISTS` | 409 | Pet already created |
  | `INVALID_PET_STAGE` | 409 | e.g. hatching a Baby, acting on an Egg |
  | `PET_STATE_CONFLICT` | 409 | Retries exhausted |
  | `INTERNAL_ERROR` | 500 | Technical failure; no internal details exposed |

- **Domain rejections** (`TOO_TIRED`, `TOO_FULL`, `SLEEPING`) return 200 with `status: "REJECTED"`. The simulated state and the `ACTION_REJECTED` event are still persisted.
- **Snapshot contents:**
  - `pet`: `id`, `name`, `species`, `stage`, `createdAt`, `hatchedAt`, `version`.
  - `state`: raw stats, activity, and timestamps. Needed by Debug Mode; Player UI shows labels.
  - `derived`: mood and need labels.
  - `recentEvents`: last 10.
- **Egg handling:** the Egg is not simulated. Hatching resets the state to the initial Baby state at hatch time, so waiting as an Egg does not cost needs.
- **Naming:** Zod trims whitespace and collapses internal whitespace; names must be 1–30 characters. Renaming is allowed and emits `PET_NAMED` each time.
- **Concurrency:** each mutation, and each `GET` that advances time, saves with `expectedVersion`. On `ConcurrencyError` the service reloads and re-runs the operation (up to 3 attempts), so two simultaneous Feeds are applied one after the other or rejected by the rules, never silently merged. If retries are exhausted, the API returns 409 `PET_STATE_CONFLICT`.
- **Recent Play times:** the Play diminishing window and the Excited mood read recent Play times from the persisted `PET_PLAYED` events.
- **Injected dependencies:** `Clock` and `Random` are injected into `buildApp`. Production uses `SystemClock`/`SystemRandom`; tests use `FakeClock`/`SeededRandom`.

## Target Structure

```text
packages/contracts/
└── src/{index.ts, enums.ts, requests.ts, responses.ts, errors.ts}

apps/api/src/
├── app.ts                    (buildApp with injected dependencies)
├── server.ts                 (production wiring: Drizzle, SystemClock)
├── application/
│   ├── errors.ts
│   ├── pet-service.ts
│   └── snapshot.ts
└── http/
    ├── envelope.ts
    ├── error-handler.ts
    └── pet-routes.ts
```

## Required Verification

```text
pnpm --filter @ai-virtual-pet/contracts typecheck
pnpm --filter @ai-virtual-pet/api typecheck
pnpm --filter @ai-virtual-pet/api test
pnpm typecheck
pnpm test
pnpm build
Manual smoke: start API against local PostgreSQL and run the journey with curl.
```

## Acceptance Criteria

- The full journey (Create Egg → Hatch → Name → Feed → Play → Sleep → Time Passes → GET) passes through HTTP injection tests.
- The required flows are covered: create/get egg, hatch, name, get Baby, feed, play, play rejection, sleep, get after elapsed time.
- Domain rejections never produce 5xx.
- Validation, lifecycle, conflict, and technical errors are distinguishable by `error.code`.
- Two concurrent Feed requests do not corrupt state: both are applied in sequence or one is rejected by the rules, and the version increments once per commit.
- Routes contain no game rules. The service contains no HTTP concerns.
- Responses validate against the shared contract schemas.
- Root typecheck, tests, and build remain passing.
