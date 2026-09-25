# Prototype 0.2 — Unit 08: Implementation Record

## Status

Complete.

## Implemented

### Resume after a committed action (`application/chat-service.ts`)

A retried turn with no stored reply first reads `events.listForTurn(petId, userMessageId)`. If a care action for this turn already committed (`PET_FED`, `PET_PLAYED`, `PET_STARTED_SLEEPING`, or `ACTION_REJECTED` tagged with `turnMessageId`), `completeResumedActionTurn`:

- does **not** interpret or act again (even if the action would now succeed or fail differently);
- rebuilds the outcome (type, status / reason, hunger / happiness / Bond deltas) from the event;
- regenerates the reply told the real result, or falls back to the button words;
- stores the reply with `resumedAction: true`, `intentConfidence: null`, `classification: null`.

`ActionOutcome` now carries the action plus its changes, so fallback words work both for a fresh action and a rebuilt one. `ChatServiceDependencies.events` added.

Talk resume was already idempotent through `recordTalk` (Unit 07); now covered by a crash test.

### Test support

- `testing/chat-harness.ts` — shared `ChatHarness` (moved from `chat.test.ts`).
- `testing/flaky-conversations.ts` — wraps a conversation store: `failNextReply` (simulated crash before the reply is stored), `raceNextReply` (another process stores a reply first).
- `FakeAIProvider` returns `TIMEOUT` without consuming a script when `timeoutMs ≤ 0`, like the real adapter.

### Contracts

Retry contract documented on `chatTurnResultSchema`: 200, 503 / 500 / network (retry same id), 409 `CHAT_IN_PROGRESS`, 409 `PET_SLEEPING`, 400.

## Decisions

1. **A resumed action turn keeps its original decision.** Changing stats between the crash and the retry does not re-run the Game Engine — the turn already happened.
2. **Resumed-turn metadata marks unknowns as null** instead of guessing the lost interpretation.

## Files Changed

```text
apps/api/src/application/chat-service.ts
apps/api/src/http/chat-failures.test.ts        (new)
apps/api/src/http/chat.test.ts                 (uses shared harness)
apps/api/src/testing/chat-harness.ts           (new)
apps/api/src/testing/flaky-conversations.ts    (new)
apps/api/src/testing/fake-ai-provider.ts
packages/contracts/src/chat.ts
tasks/p02-unit-08/*
```

## Database Changes

None.
