# Prototype 0.2 — Unit 04: Implementation Record

## Status

Complete (live gate call pending credentials).

## Implemented

### `apps/api/src/ai/`

| File | Purpose |
| --- | --- |
| `provider.ts` | `AIProvider` boundary: `generateStructured<T>(request) → AIResult<T>`. Request = `kind` (`INTERPRETATION` / `RESPONSE`), messages, Zod schema, `timeoutMs`, optional `maxOutputTokens` / `temperature`. Result is a union: `ok` with value + `AIUsage`, or a controlled failure `UNAVAILABLE` / `TIMEOUT` / `PROVIDER_ERROR` / `MALFORMED_OUTPUT` with `detail`. `UnavailableAIProvider` for missing configuration. |
| `openai-compatible.ts` | `POST {AI_BASE_URL}/chat/completions` with `Authorization: Bearer`. Plain `fetch`, `AbortController` timeout (covers slow headers and slow body), `max_tokens` default 300, `response_format: json_object` only when `AI_JSON_MODE=true`. No `json_schema`, no tools. Reads `usage.prompt_tokens` / `completion_tokens` when present. |
| `structured-output.ts` | JSON extraction + Zod validation. Tolerates a markdown fence or preamble text; never repairs invalid output. |
| `config.ts` | `loadAIConfig(env)` and `createAIProvider(config)`. Unknown `AI_PROVIDER`, bad numbers, bad `AI_JSON_MODE` → startup error. Missing URL / model / key → `UnavailableAIProvider`. `DEFAULT_AI_TIMEOUTS` = 5 s / 10 s / 15 s. |
| `turn-budget.ts` | `TurnBudget.timeoutFor(kind)` = min(stage timeout, remaining turn budget); 0 → do not call. |

### Elsewhere

- `application/chat-guard.ts` — `ChatTurnGuard.run(petId, turn)`: one in-flight turn per pet, second rejected with `CHAT_IN_PROGRESS`, released in `finally`.
- `testing/fake-ai-provider.ts` — `FakeAIProvider`: per-kind queues + defaults, `value` / `raw` / `failure` / `hold` outcomes (hold keeps a call in flight until released), records requests, configurable usage. Unscripted call throws so test mistakes are loud.
- `packages/contracts/src/chat.ts` — `CHAT_MESSAGE_MAX_LENGTH = 1000`; `chatRequestSchema` (strict: `clientMessageId` UUID, `message` trimmed 1–1000).
- `packages/contracts/src/errors.ts` — `CHAT_IN_PROGRESS` (409), `AI_UNAVAILABLE` (503).
- `server.ts` — builds the provider at startup and logs whether Talk is available. (Not yet passed into the app; chat routes arrive in Unit 07.)
- `scripts/ai-smoke.ts` — `pnpm ai:smoke`: one real structured call, prints reply, latency, tokens. Never prints the key.
- `.env.example` — all AI keys with placeholders.

## Decisions Made in This Unit

1. **Plain `fetch`, no `openai` SDK.** Plan allowed either. No new dependency, no SDK types to contain, and tests can run against a real local HTTP server.
2. **Result union instead of exceptions** for provider outcomes, so "timeout / failure is a controlled result" is enforced by the type system. Exceptions are reserved for programming errors.
3. **Error detail never includes the provider response body or network error messages** (they can echo prompts, headers, or keys) — only HTTP status or error code.
4. **Preamble text before JSON is tolerated** in addition to fences (seen with routed models); output that still fails the schema is `MALFORMED_OUTPUT`.
5. **`PET_SLEEPING` error code deferred** to Unit 07 with the chat route that uses it.

## Files Changed

```text
apps/api/src/ai/provider.ts, openai-compatible.ts, structured-output.ts, config.ts, turn-budget.ts   (new)
apps/api/src/ai/openai-compatible.test.ts, ai-infrastructure.test.ts                                (new)
apps/api/src/application/chat-guard.ts                                                              (new)
apps/api/src/testing/fake-ai-provider.ts                                                            (new)
apps/api/src/scripts/ai-smoke.ts                                                                    (new)
apps/api/src/server.ts, apps/api/package.json, package.json
packages/contracts/src/chat.ts, chat.test.ts, errors.ts
.env.example
tasks/p02-unit-04/*
```

## Database Changes

None.

## Known Limitations

- Guard is in-memory, single process (accepted in plan Task 4.7).
- The live gate call has not run (no credentials in `.env`).
