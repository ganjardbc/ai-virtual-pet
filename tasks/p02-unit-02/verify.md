# Prototype 0.2 — Unit 02: Verification Record

## Status

Passed. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass |
| Tests | `pnpm test` | Pass — 356 tests (api 127, was 95), 0 skipped |
| PostgreSQL suites | `TEST_DATABASE_URL` set | Ran |
| Build | `pnpm build` | Pass |
| Dev DB migration | `pnpm --filter @ai-virtual-pet/api db:migrate` | Applied; 2 rows in `drizzle.__drizzle_migrations` |
| Schema drift | `drizzle-kit generate` | No schema changes |

## Task 2.8 Coverage

Repository contract (`persistence/repositories.test.ts`, both stores):

| Required | Test |
| --- | --- |
| save / reload | saves and reloads personality with daily deltas and signal day |
| update | updates; save without personality keeps stored one |
| atomic with version | stale version does not write personality |
| ownership | personality for another pet rejected |
| reset | `deleteAll` removes personality |
| DB-level (PostgreSQL) | event-insert failure rolls back personality; range and sum checks reject bad rows (`23514`) |

Service integration (`integration.test.ts`, in-memory + PostgreSQL):

| Required | Test |
| --- | --- |
| initialize | Egg has none; hatch gives traits in 0.35–0.55 |
| Play affects personality | +0.006 Playful, other traits unchanged |
| rejected Play does not | TOO_TIRED leaves personality equal |
| Feed / Sleep | Feed +0.001 Clingy; Sleep no change |
| daily cap survives reload | 6 Plays → +0.03; new API instance + reopened connection → still capped; next UTC day → +0.006 |
| concurrency | 8 concurrent Plays: cap holds (in-memory: 8 accepted, gain = 5 × 0.006; PostgreSQL: 5 accepted + 3 conflicts) |
| 7-day absence | Independent gains exactly +0.001 once |
| existing pet receives personality | legacy Baby without personality: first GET creates it, hunger/Bond unchanged, stable on next GET |
| debug reset | personality removed; new Egg has none |

Probe note: the concurrency and 7-day tests were temporarily instrumented to confirm they exercise the interesting branch (not a vacuous pass); instrumentation removed.

## Prototype 0.1 Regression

All 95 pre-existing API tests pass unchanged, including seeded simulation scenarios (separate `personalityRandom` keeps their sequences intact).

## Phase 2 Gate

Passed. Next: Unit 03 — Conversation Persistence + Turn Idempotency.
