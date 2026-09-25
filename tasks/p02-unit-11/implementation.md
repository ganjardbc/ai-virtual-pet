# Prototype 0.2 — Unit 11: AI + Personality Debug Tooling — Implementation

## Status

Complete. Automated checks green; the AI-dependent browser gate needs live provider credentials
(see `verify.md`).

## What was built

### Contracts (`packages/contracts/src/debug.ts`)

- Personality debug DTOs: `debugPersonalitySchema` (raw traits, daily deltas + cap, prompt levels,
  dominant/primary trait, strength, social style) and `debugSetPersonalityRequestSchema`
  (a preset name or explicit traits — never both, never neither).
- AI debug DTOs: `debugTurnSchema` (latest ASSISTANT message metadata), `debugContextSchema`
  (bounded context inspection), `debugAiSchema` = `{ lastTurn, personality, context }`.
- Enums: personality trait keys/traits, levels, strength, social style, relationship level, presets.

### Persistence

- `ConversationRepository.countMessages` and `findLatestAssistantMessage`, implemented in both
  `DrizzleConversationRepository` and `InMemoryStore`; `FlakyConversations` delegates both.

### Debug service/routes (`apps/api/src/debug`)

- `DebugPetService.getAi()` — latest turn metadata (from the latest ASSISTANT message, so it
  survives restart; no in-memory "last request" store), current personality with daily deltas, and
  context inspection built from the same `buildCharacterContext` the AI uses.
- `DebugPetService.setPersonality()` — debug-only trait mutation via the domain
  `setPersonalityTraits` (clamped, normalized, `reason: "DEBUG"`, daily tracking untouched), from a
  preset or explicit values. Requires a hatched pet.
- Routes `GET /api/v1/debug/ai` and `PATCH /api/v1/debug/personality`, registered only when debug
  is enabled.
- Reset already cascades to personality/conversation/messages; a PostgreSQL test now proves it
  leaves no orphans.

### Web (`apps/web/src/debug`)

- `debug-api.ts`: `GET /debug/ai` and `PATCH /debug/personality`; personality changes update the AI
  query cache directly.
- `DebugPanelView`: Personality section (raw traits, today's delta vs cap, dominant/primary/
  strength/social style, per-trait set controls, six preset buttons), Last AI turn section
  (intent, confidence, classification, action, provider, model, latency, tokens, fallback), and
  Context section (mood, relationship, recent message/event counts, trait levels). Sections render
  independent of the raw-state query.

## Files changed

```text
packages/contracts/src/debug.ts            (+ schemas)
packages/contracts/src/debug.test.ts       (new)
apps/api/src/persistence/repositories.ts   (+ findLatestAssistantMessage contract)
apps/api/src/persistence/drizzle.ts        (+ implementation)
apps/api/src/persistence/memory.ts         (+ implementation)
apps/api/src/persistence/conversations.test.ts (+ contract tests)
apps/api/src/testing/flaky-conversations.ts(+ delegation)
apps/api/src/application/pet-service.ts     (skip auto diff when a mutation supplies its own event)
apps/api/src/application/chat-service.ts    (+ pass personalityRules to the context builder)
apps/api/src/debug/debug-service.ts        (+ getAi/setPersonality, debug helpers)
apps/api/src/debug/debug-routes.ts         (+ 2 routes)
apps/api/src/debug/debug-routes.test.ts    (+ tests, gating, reset-orphan DB test)
apps/web/src/debug/format.ts               (+ trait/delta/preset helpers)
apps/web/src/debug/debug-api.ts            (+ ai/setPersonality)
apps/web/src/debug/DebugPanel.tsx          (+ ai query, set-personality command)
apps/web/src/debug/DebugPanelView.tsx      (+ personality/AI/context sections)
apps/web/src/debug/debug.css               (+ trait grid, hint)
apps/web/src/debug/debug.test.tsx          (+ tests)
README.md                                  (debug API list)
tasks/p02-unit-11/{plan,implementation,verify}.md
```

## Decisions / deviations from plan

- Personality is exposed through `GET /debug/ai`, not added to `GET /debug/pet/state`, so the
  existing debug-state contract (and its tests) stay unchanged. The panel renders personality
  sections from the AI query, independent of raw state.
- `PATCH /debug/personality` returns the full `debugAiSchema` payload so the panel can replace one
  cached query.
- Task 10.7 ("run test prompt" control) skipped: the plan marks it optional and it does not
  materially speed tuning.
- Debug set records a single reason-tagged `PERSONALITY_CHANGED` event with
  `{ changes: [...], reason: "DEBUG" }`. `PetService.mutate` now skips its automatic diff event when
  a mutation supplies its own `PERSONALITY_CHANGED`, so there is no duplicate.
- Chat and debug now pass the injected `personalityRules` to `buildCharacterContext`, and debug uses
  the same context limits and a realistic current-message length, so context inspection mirrors the
  real prompt.
- The contract preset enum is guarded at runtime (`VALIDATION_ERROR` on an unknown preset) and a
  test asserts it stays in sync with the domain's `PERSONALITY_PRESET_NAMES`.

## Post-review fixes

A fresh-context review of the whole diff raised three Important and several Minor findings; all
Important findings and three Minor ones were fixed (each with a test where behavior is observable):

- I1 — debug personality set now persists a `reason: "DEBUG"` event; asserted by a route test.
- I2 — debug context mirrors the chat context (no window override, shared personality rules,
  realistic current-message budget); asserted by a custom-`contextWindow` test.
- I3 — runtime preset guard + contract/domain enum parity test.
- M1 — removed the unused `countMessages` repository method.
- M2 — setting personality now invalidates the raw-state query too.
- M4 — same-timestamp ordering tie-break now tested.
- M5 — explicit-trait clamping now tested.
