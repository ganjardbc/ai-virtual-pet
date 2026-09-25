# Prototype 0.2 — Unit 03: Verification Record

## Status

Passed. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass |
| Tests | `pnpm test` | Pass — 405 tests (api 173, contracts 11), 0 skipped |
| PostgreSQL suites | `TEST_DATABASE_URL` set | Ran |
| Build | `pnpm build` | Pass |
| Dev DB migration | `db:migrate` | Applied; 3 migrations |
| Schema drift | `drizzle-kit generate` | No schema changes |

## Task 3.7 Coverage

Conversation contract (`persistence/conversations.test.ts`, in-memory + PostgreSQL):

| Required | Test |
| --- | --- |
| create default conversation | one per pet; second candidate returns first; concurrent creates → one; missing pet rejected |
| append user / assistant message | fields, metadata round trip, `updatedAt` bumped |
| reload history | oldest first |
| recent 12 selection | 20 messages → last 12 |
| message ordering | time first, insertion order for equal times, earlier time appended later sorts first |
| duplicate clientMessageId | `DuplicateMessageError`, still 1 message; 3 concurrent submits → exactly 1 stored |
| second reply rejected | `DuplicateMessageError`; reply to a reply / missing message → `RangeError` |
| turn lookup | `findTurn` before reply, after reply, unknown |
| reset | `deleteAll` removes conversations and messages |
| DB level (PostgreSQL) | raw second reply → `23505`; role/link/content checks → `23514` |

History route (`http/chat-routes.test.ts`):

| Required | Test |
| --- | --- |
| no pet | 404 `PET_NOT_FOUND` |
| empty | `[]`, no conversation created |
| visible fields only | exact DTOs |
| history excludes debug metadata | response body has no intent/confidence/tokens/provider/clientMessageId |
| history limit | 60 stored → latest 50; configured limit 4 |

Contract (`packages/contracts/src/chat.test.ts`): strict DTO rejects `metadata` and `clientMessageId`.

Integration (`integration.test.ts`, both stores): history identical after API restart + new connection; debug reset clears history.

## Phase 3 Gate

Passed — conversation storage works with no AI provider configured. Next: Unit 04 — AI Provider Infrastructure (OpenAI-compatible adapter, DEC-061).
