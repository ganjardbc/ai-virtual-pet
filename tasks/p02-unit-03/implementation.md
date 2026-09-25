# Prototype 0.2 — Unit 03: Implementation Record

## Status

Complete.

## Implemented

### Database — `apps/api/drizzle/0002_conversations.sql`

`conversations`: `id` (text PK), `pet_id` (unique, FK → pets ON DELETE CASCADE), `created_at`, `updated_at`.

`messages`:

```text
id                    bigint identity (insertion-order tie-breaker)
conversation_id       FK → conversations ON DELETE CASCADE
role                  'USER' | 'ASSISTANT'
content               non-empty text
client_message_id     USER only — idempotency key
reply_to_message_id   ASSISTANT only — FK → messages ON DELETE CASCADE
metadata              jsonb, default {} (turn debug data; never prompts or reasoning)
created_at            game-clock time
```

Constraints:

- unique `(conversation_id, client_message_id)` where not null;
- unique `(reply_to_message_id)` where not null — at most one reply per turn;
- check: USER has a `client_message_id` and no reply link; ASSISTANT the reverse;
- index `(conversation_id, created_at, id)` for ordered reads.

### Repository — `apps/api/src/persistence/`

`ConversationRepository` (`repositories.ts`), implemented by `DrizzleConversationRepository` and `InMemoryStore`:

| Operation | Behavior |
| --- | --- |
| `findForPet` | Read-only lookup. |
| `getOrCreateForPet(candidate)` | One per pet; concurrent calls return the same row (`onConflictDoNothing` on unique `pet_id`). Missing pet → `PetNotFoundError` (FK violation mapped). |
| `appendMessage` | Transaction: bump `updatedAt`, validate reply target (must be a USER message in this conversation), insert. Unique violation → `DuplicateMessageError`. Empty content → `RangeError`. Unknown conversation → `ConversationNotFoundError`. |
| `findTurn(conversationId, clientMessageId)` | USER message + its reply (or `null` reply) — what the Task 3.8 new/completed/resume decision needs. |
| `listRecentMessages({ limit })` | Latest N, oldest first, ordered by `created_at` then `id`. |

`InMemoryStore.deleteAll` also clears conversations and messages (mirrors the cascade). `truncateAll` includes both tables.

### Application / HTTP

- `application/conversation-service.ts`: `ConversationLimits` (`DEFAULT_CONVERSATION_LIMITS = { contextWindow: 12, historyLimit: 50 }`), `ConversationService.getHistory()` (read-only; `PET_NOT_FOUND` when no pet), `toChatMessageDto`.
- `http/chat-routes.ts`: `GET /api/v1/pet/chat/history`.
- `AppDependencies.conversations` (required) and `conversationLimits?`; `server.ts` wires `DrizzleConversationRepository`.

### Contracts — `packages/contracts/src/chat.ts`

`chatMessageRoleSchema`, `chatMessageDtoSchema` (**strict**: `id`, `role`, `content`, `createdAt` only), `chatHistorySchema`.

## Decisions Made in This Unit

1. **One `listRecentMessages(limit)` instead of separate `getRecentMessages` / `getHistory`.** Same query, different limits; plan Task 3.4 updated.
2. **Metadata is untyped `jsonb` for now** (like `events.data`). Its typed shape comes with the AI types in Unit 07.
3. **Message `created_at` uses the game clock**, like events, so debug time travel keeps history consistent with pet time.
4. **`AppDependencies.conversations` is required.** Non-chat test harnesses default it to a fresh `InMemoryStore`.
5. **Chat history is not simulated.** `GET /chat/history` does not run elapsed-time simulation or write anything.

## Files Changed

```text
apps/api/drizzle/0002_conversations.sql, meta/0002_snapshot.json, meta/_journal.json
apps/api/src/db/schema.ts
apps/api/src/persistence/repositories.ts, drizzle.ts, memory.ts
apps/api/src/persistence/conversations.test.ts           (new)
apps/api/src/application/conversation-service.ts         (new)
apps/api/src/http/chat-routes.ts, chat-routes.test.ts    (new)
apps/api/src/app.ts, server.ts
apps/api/src/app.test.ts, integration.test.ts, http/pet-routes.test.ts, debug/debug-routes.test.ts
apps/api/src/testing/database.ts
packages/contracts/src/chat.ts, chat.test.ts, index.ts
docs/20-prototype-02-implementation-plan.md              (Task 3.4)
tasks/p02-unit-03/*
```

## Database Changes

Migration `0002_conversations` — additive. Applied to the dev database (3 migrations applied).

## Known Limitations

- No writer yet: messages are only created by tests until `POST /chat` (Unit 07).
- Resume and "action already executed for this turn" checks are Unit 07–08 logic built on `findTurn`.
