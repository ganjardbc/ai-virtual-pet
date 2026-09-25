# Prototype 0.2 — Unit 06: Implementation Record

## Status

Complete.

## Implemented

### `apps/api/src/ai/context.ts`

`buildCharacterContext({ snapshot, personality, messages, currentMessage, limits? })` → `AICharacterContext`:

| Field | Source |
| --- | --- |
| `pet` | name, stage from the saved `PetSnapshot` |
| `reality` | activity, `asleep`, mood, fullness / energy / happiness **labels** from `snapshot.derived` |
| `personality` | `derivePersonalityPromptProfile` (levels, dominant traits, primary, strength, social style) |
| `relationship` | `relationshipLevel(bond)`: < 25 LOW, < 60 DEVELOPING, else CLOSE |
| `recentMessages` | last `maxMessages` (12), oldest first, role + content only, current message removed |
| `recentEvents` | last `maxEvents` (5) of `PET_FED`, `PET_PLAYED`, `PET_STARTED_SLEEPING`, `PET_WOKE_UP`; type + minutes ago (+ `autonomous` for self-started sleep); no payloads |
| `currentMessage` | the player's message |
| `usage` | approx chars / tokens (chars ÷ 4), messages and events included / dropped |

Size guard (`DEFAULT_CONTEXT_LIMITS.maxChars` 8,000): drops oldest messages, then oldest events; never the current message. Contract, reality, and personality are fixed-size and always kept.

### `apps/api/src/ai/character-prompt.ts`

- `CHARACTER_CONTRACT` — every plan Task 6.5 rule, plus no guilt (DEC-009), no "I am an AI", no assistant lists/advice.
- `personalityGuidance` — one line per **high or low** trait, each with its scope §19–§23 limit (Playful: not a joke every reply; Curious: never a string of questions; Shy: still warm and understandable; Independent: never cold or refusing care; Clingy: never guilt-trip). Moderate traits add nothing; a balanced pet gets "Balanced, with a mild lean toward …". Social style line when not balanced.
- `realityDescription`, `recentEventsDescription`, `buildCharacterSystemPrompt` (order: contract → reality → personality → events), `buildConversationMessages` (history as chat turns, current message last).

## Decisions Made in This Unit

1. **Labels only, no raw numbers.** The pet cannot quote "hunger 30" or reason on numbers; Bond is used only to derive the relationship level.
2. **Pure builder from the saved snapshot.** Loading lives in the chat service (Unit 07), which holds the post-action snapshot — so the AI always sees the state after the Game Engine decided, and the builder needs no I/O.
3. **`ACTION_REJECTED` is not a context event.** The current turn's rejection reaches the response via the action result (Unit 07); older rejections are noise.
4. **Guard counts only the variable parts** (messages, events, current message); the fixed instructions are small and never dropped.
5. **Instructions in English, player-facing language rule in the contract** ("reply in the player's language, usually Indonesian").

## Files Changed

```text
apps/api/src/ai/context.ts, character-prompt.ts, context.test.ts   (new)
tasks/p02-unit-06/*
```

## Database Changes

None.
