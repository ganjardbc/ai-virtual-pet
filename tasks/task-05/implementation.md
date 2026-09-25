# Task 05 — Implementation Record

## Status

Complete.

## Implemented

- **New package `@ai-virtual-pet/contracts`** (depends only on `zod`):
  - Enums: stage, activity, mood, need labels, action type, rejection reason, event type.
  - Request schemas: `namePetRequestSchema` (trims and collapses whitespace, 1–30 characters) and `petActionRequestSchema` (`FEED`/`PLAY`/`SLEEP` only).
  - Response schemas and types: `PetSnapshot`, `HatchResult`, `ActionResult` (discriminated on `status`), `successEnvelopeSchema`.
  - Error model: `apiErrorCodeSchema`, `API_ERROR_STATUS`, `apiErrorEnvelopeSchema`.
- **`PetService`** (`application/pet-service.ts`):
  - Every operation goes through `mutate`: load → simulate elapsed time (Egg excluded) → apply operation → save pet, state, simulation events, and operation events with `expectedVersion` → build snapshot.
  - Saves are skipped when nothing changed.
  - On `ConcurrencyError` it reloads and re-runs the operation (3 attempts), then returns `PET_STATE_CONFLICT`.
  - Operations: `createPet`, `getPet`, `hatch` (resets to a fresh Baby state at hatch time), `name`, `act(FEED|PLAY|SLEEP)`.
  - Play reads recent `PET_PLAYED` times for the diminishing window. The snapshot reads the last Play time for the Excited mood.
  - Action changes are rounded to 1e-6 to remove floating-point noise.
- **Snapshot mapper** (`application/snapshot.ts`): converts domain objects to DTOs with ISO timestamps. Derived mood and need labels come from the simulation package. `recentEvents` holds the last 10. Explicit DTO return types make the compiler catch drift between domain enums and contract enums.
- **HTTP layer:**
  - `http/envelope.ts`: `{ data, meta.requestId }` success envelope and `sendError`.
  - `http/error-handler.ts`, mapping failures to codes:

    | Failure | Code |
    | --- | --- |
    | `ApplicationError` | its own code |
    | `ZodError` | `VALIDATION_ERROR`, with `issues` |
    | Fastify 4xx (malformed JSON, etc.) | `VALIDATION_ERROR` |
    | Anything else | `INTERNAL_ERROR` (logged; no details exposed) |
    | Unknown route | `NOT_FOUND` |

  - `http/pet-routes.ts`: thin adapters for `POST/GET /api/v1/pet`, `POST /api/v1/pet/hatch`, `PATCH /api/v1/pet/name`, `POST /api/v1/pet/actions`.
- **`buildApp(dependencies)`** now takes injected `pets`, `events`, `clock`, `random`, and `rules`. Request ids are UUIDs.
- **`server.ts`** wires Drizzle repositories, `SystemClock`, `SystemRandom`, and logging, and closes the database on shutdown.
- **Tests:**
  - HTTP injection tests (`http/pet-routes.test.ts`): the API contract suite runs against both the in-memory store and PostgreSQL:
    - Full journey.
    - Play rejection.
    - No write when no time has elapsed.
    - Egg rejections.
    - Missing pet.
    - 6 validation cases.
    - Concurrent Feeds.
  - Error-model tests: unknown route, hidden technical failure, exhausted retries leading to 409, request ids, and a deterministic race (both requests read the same version, one conflicts and retries, both Feeds apply in sequence).
  - Contracts tests for name normalization and the action enum.

## Files Changed

```text
packages/contracts/package.json
packages/contracts/tsconfig.json
packages/contracts/tsconfig.build.json
packages/contracts/src/{index,enums,requests,responses,errors}.ts
packages/contracts/src/requests.test.ts

apps/api/package.json
apps/api/tsconfig.json
apps/api/vitest.config.ts
apps/api/src/app.ts
apps/api/src/app.test.ts
apps/api/src/server.ts
apps/api/src/application/{errors,pet-service,snapshot}.ts
apps/api/src/http/{envelope,error-handler,pet-routes}.ts
apps/api/src/http/pet-routes.test.ts

pnpm-lock.yaml
tasks/task-05/*
```

## Decisions and Deviations

- **Domain rejections are 200 with `status: REJECTED`** (API design §10, §32). The error envelope is reserved for requests that could not be processed. The rejection still persists the simulated state and `ACTION_REJECTED`.
- **Concurrency uses server-side optimistic retry, not a client `If-Match` header.** API design §85 allows this for the MVP. Two simultaneous Feeds become two sequential Feeds; the test proves the second one lands in the diminished near-full band instead of overwriting the first.
- **An Egg is never simulated, and hatching creates a fresh Baby state.** Time spent as an Egg before hatching never costs needs.
- **No reaction field yet.** The API returns semantic `status`, `reason`, `changes`, and `derived.mood`. Character reaction mapping is a later phase (scope §42), and the contract can add `reaction` without breaking changes.
- **Every `GET` that finds elapsed time writes a new version.** This keeps the database in step with what the player saw, at the cost of one write per load. That is fine for a single-player prototype.
- **No personality or growth objects in the snapshot**, because those systems are out of scope.
- **Contract enums are duplicated from the domain** so that `contracts` stays dependency-free for the web app. The explicit DTO return types in `snapshot.ts` make the compiler flag any divergence.
- **Idempotency keys are not implemented** (API design §14 lists them as "should"). Retry with the same intent is covered by optimistic concurrency; duplicate client retries of Feed would apply twice. Deferred until the web client needs it.

## Known Limitations

- Two simultaneous `POST /pet` requests can both pass the "already exists" check, because there is no database-level single-pet constraint. The prototype UI issues create once. A unique constraint would conflict with the repository contract tests that create two pets.
- Mood stability (minimum duration) is not applied across requests, because the previous mood is not persisted.
- Sending `Content-Type: application/json` with an empty body returns `VALIDATION_ERROR` from Fastify. The web client must omit the header for body-less POSTs.
- `pnpm dev` runs the API from `tsx` resolving workspace packages through `dist`. Run `pnpm build` first (see README).
