# Prototype 0.2 — Unit 10: Implementation Record

## Status

Complete.

## Implemented (`apps/web`)

| Area | Change |
| --- | --- |
| Pet Home | Fourth core action **Bicara** (Talk icon) between Main and Tidur; disabled with the sleeping hint while asleep. Dock is one row of 4; Talk tile uses the pet blush color. |
| App | `talking` view state; Talk view over the same authoritative snapshot; reset to Home if the pet becomes an Egg again. |
| `screens/ConversationScreen.tsx` | Back bar → Habitat with the large pet and its current words → conversation panel (log, pending message, composer) → system messages. |
| `api/client.ts`, `api/chat-queries.ts` | `chatApi.history`, `chatApi.send`; `useChatHistory` (only while Talk is open), `useSendChat` (stores the snapshot, waits for the history refetch so the pending message never blinks). |
| `presentation/chat.ts` | `pendingTurnReducer` (one turn at a time; same `clientMessageId` kept for Retry), `composeMessage` (server rules), `shouldSendOnKey` (Enter, not Shift+Enter, not during IME composition), `counterText` (from 800 chars), `chatFailure` (system-voice mapping). |
| `presentation/reactions.ts` | `reactionForChat`: AI words + the same pose as the button for a chat-triggered action; plain Talk keeps the state look. |
| `presentation/copy.ts` | `actions.talk`, `chat.*` (Indonesian). |
| `styles/app.css` | 4-action dock, Talk tile, conversation panel, message bubbles (pet left, player right), composer. |

## Behavior

- **Listening:** while a turn is sending, the pet looks curious (`peek`) and the bubble says "Momo sedang mendengarkan…" (also a `role="status"` line). Presentation only.
- **Action from chat:** the action pose shows for 1.8 s with the reply, and the updated snapshot (needs, mood) is stored immediately.
- **Sleep through chat:** the good-night reply shows, then the view returns to the sleeping Pet Home after 2.5 s. `PET_SLEEPING` returns home immediately.
- **Failures** (`AI_UNAVAILABLE`, 500, network, `CHAT_IN_PROGRESS`): the message stays as "Belum terkirim" with "Momo belum bisa menjawab sekarang." and **Coba lagi**, which resends the same `clientMessageId`. `VALIDATION_ERROR` discards the turn with the generic system message.
- **Exit:** Kembali returns to Pet Home; history reloads from the server next time.

## Accessibility

Labeled textarea ("Pesan untuk Momo"), Enter to send, visible focus ring, `role="log"` + `aria-live="polite"` conversation with a visible speaker on every message, `role="status"` listening line, errors via `SystemMessage` (`role="alert"`), pet label includes the listening state.

## Decisions

1. **One pending turn at a time.** A failed turn must be retried (or the page left) before a new one — so Retry can never be confused with a new message.
2. **No personality or classification anywhere in the UI** (plan Task 9.12).
3. **History reloads on every Talk open** rather than being cached across views — the server is the source of truth.

## Files Changed

```text
apps/web/src/App.tsx
apps/web/src/api/client.ts, chat-queries.ts (new)
apps/web/src/components/ActionButton.tsx
apps/web/src/presentation/chat.ts (new), chat.test.ts (new), copy.ts, reactions.ts
apps/web/src/screens/ConversationScreen.tsx (new), PetHome.tsx, screens.test.tsx
apps/web/src/styles/app.css
tasks/p02-unit-10/*
```
