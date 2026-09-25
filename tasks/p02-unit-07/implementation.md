# Prototype 0.2 — Unit 07: Implementation Record

## Status

Complete.

## Turn Flow (`apps/api/src/application/chat-service.ts`)

```text
POST /api/v1/pet/chat  { clientMessageId, message }        (chatRequestSchema)
  find pet (PET_NOT_FOUND)
  ChatTurnGuard.run(petId)                                  (CHAT_IN_PROGRESS)
    PetService.getPet()           simulate + persist elapsed time
    Egg                           → INVALID_PET_STAGE
    findTurn(clientMessageId)     same id, different text → VALIDATION_ERROR
      completed                   → stored reply + current snapshot, no AI call
    SLEEPING                      → PET_SLEEPING (message not stored)
    getOrCreate conversation; store USER message (or resume the stored one)
    interpretMessage              (TurnBudget: min(5 s, remaining))
    care intent ≥ 0.80            → PetService.act(intent, { turnMessageId, rejectedSignal })
    build context from the saved snapshot + personality + last 12 messages
    generateCharacterResponse     (TurnBudget: min(10 s, remaining)), told the real result
    reply failed:  action → shared button reaction text (fallbackUsed)
                   no action → AI_UNAVAILABLE (503), USER message kept for Retry
    TALK with AI reply            → PetService.recordTalk (signal + capped Talk Bond, idempotent)
    store ASSISTANT reply + metadata
  → { message, intent, action, pet }
```

No database transaction spans an AI call: each step is its own short write.

## Implemented

### Domain (`packages/domain`)

- `applyTalk(state, now, { bondGainedToday, classification })` — +0.25 within the +2/day remainder, clamp 0–100, `lastInteractionAt`, `PET_TALKED { bondDelta, classification }`; no change while sleeping.
- `GameRules.talk = { bond: 0.25, maxBondPerDay: 2 }`.
- Event types `PET_TALKED`, `PERSONALITY_CHANGED`.

### Contracts (`packages/contracts`)

- `chatIntentSchema`, `chatActionSchema`, `chatTurnResultSchema`.
- `PET_SLEEPING` (409).
- `reactions.ts`: `actionReactionKind`, `ACTION_REACTION_TEXT` — shared by API fallback and web buttons (web `reactionForAction` now uses it; visuals stay in web).
- Event enum extended.

### API

- `ai/character-response.ts` — `characterResponseSchema` (`message` 1–1000), `turnResultDescription` (authoritative "this turn" line for none / success / each rejection reason), `buildCharacterResponseMessages`, `generateCharacterResponse` (200 tokens, temperature 0.8).
- `PetService.act(type, { turnMessageId?, rejectedSignal? })` — tags action events with the turn; rejected action applies the message's signal.
- `PetService.recordTalk(turn)` — classification signal + Talk Bond in one version-checked mutation; skipped if a `PET_TALKED` for the turn exists.
- `PetService.mutate` emits `PERSONALITY_CHANGED` whenever stored traits change.
- Player snapshot excludes `PERSONALITY_CHANGED` and `PET_TALKED`.
- `EventRepository.listSince`, `listForTurn`, `listRecent({ excludeTypes })` in both stores.
- `http/chat-routes.ts` — `POST /api/v1/pet/chat`.
- `app.ts` — `ai?`, `aiTimeouts?`, `monotonicNow?`; chat uses the same `PetService` / `DebugPetService` instance as the buttons. Without `ai`: `UnavailableAIProvider`.
- `server.ts` passes the configured provider and timeouts.

### Assistant message metadata

`intent`, `rawIntent`, `intentConfidence`, `classification`, `interpretationFallback`, `interpretationFailure`, `action`, `bondDelta`, `fallbackUsed`, `responseFailure`, `provider`, `model`, `latencyMs` (sum), `inputTokens` / `outputTokens` (sums, null if unknown).

## Decisions Made in This Unit

1. **Talk Bond daily total from `PET_TALKED` events**, not new `pet_states` columns (plan Task 7.8 updated). No migration; concurrency-safe inside `mutate`.
2. **Rejected action + same-signal tone → no signal** (resolves Task 2.5 vs 7.7; plan updated).
3. **`PET_TALKED` hidden from the player snapshot** too — its `classification` is internal (scope §55). Found by the metadata-leak test.
4. **Completed-turn retry is checked before the sleeping guard**, so a pet that fell asleep after answering still returns the stored reply.
5. **Same `clientMessageId` with different text → `VALIDATION_ERROR`**, never silently treated as a retry.
6. **Talk Bond and the TALK signal are applied only after the AI reply succeeds** (fallback replies are not meaningful Talk, Task 7.8), and before the reply is stored, so the reply's metadata can record `bondDelta`; `recordTalk` idempotency covers a retry.
7. **No expression hint** in the response schema (plan allowed it as optional); presentation follows the real result.
8. **Diminished Play fallback "Seru juga."** added to the plan table (it already existed in the web reactions).

## Files Changed

```text
packages/domain/src/actions.ts, actions.test.ts, config.ts, events.ts
packages/contracts/src/chat.ts, enums.ts, errors.ts, reactions.ts (new), index.ts
apps/web/src/presentation/reactions.ts
apps/api/src/ai/character-response.ts, character-response.test.ts          (new)
apps/api/src/application/chat-service.ts                                   (new)
apps/api/src/application/pet-service.ts
apps/api/src/persistence/repositories.ts, drizzle.ts, memory.ts
apps/api/src/http/chat-routes.ts, chat.test.ts (new)
apps/api/src/app.ts, server.ts
docs/20-prototype-02-implementation-plan.md                                (Tasks 7.7, 7.8, 7.14, 7.20)
tasks/p02-unit-07/*
```

## Database Changes

None (event log and existing tables only).
