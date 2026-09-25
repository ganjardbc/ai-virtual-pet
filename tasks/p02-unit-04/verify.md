# Prototype 0.2 — Unit 04: Verification Record

## Status

Automated verification passed. Live Phase 4 gate call **pending** credentials. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass (web too — new error codes compile) |
| Tests | `pnpm test` | Pass — 452 tests (api 213, contracts 18), no AI key set |
| Build | `pnpm build` | Pass |
| Smoke script, unconfigured | `pnpm ai:smoke` | Exit 1: `Not configured: AI_BASE_URL, AI_MODEL, AI_API_KEY.` |
| Smoke script, local stub | `AI_BASE_URL=<local stub> pnpm ai:smoke` | `OK reply: Halo juga!`, tokens 30/9 (fenced JSON parsed) |
| **Live gate** | `pnpm ai:smoke` with 9router values | **Not run — no credentials** |

## Task 4.8 Coverage

`ai/openai-compatible.test.ts` (against a real local HTTP server):

| Required | Test |
| --- | --- |
| successful generation | exact request (path, bearer, model, messages, max_tokens, temperature), validated value |
| usage metadata | tokens read; missing usage → null, still ok |
| malformed response | non-JSON text, schema mismatch, out-of-range value, no content, non-JSON body |
| provider failure | HTTP 401/429/500/503; unreachable endpoint; key never in result |
| timeout | no response → TIMEOUT < 1 s and request aborted server-side; stalled body → TIMEOUT; 0 ms → no call |
| provider-specific features | no `response_format` / `tools` unless JSON mode |

`ai/ai-infrastructure.test.ts`:

| Required | Test |
| --- | --- |
| config | defaults, all settings, startup errors for unknown provider / bad timeout / bad flag |
| API starts without AI_API_KEY | unavailable provider; app builds and Feed works |
| unavailable calls | each missing setting → `UNAVAILABLE` with the setting named |
| structured output | fences, whitespace; no repair |
| turn budget | stage caps and remaining-budget cap |
| concurrent chat rejected | second turn → `CHAT_IN_PROGRESS` while first is held; other pet unaffected |
| guard released after failure/timeout | provider error, timeout, thrown error — next turn runs |
| fake provider | per-kind scripting, request recording, schema validation of scripted values, usage, unscripted call throws |

`packages/contracts/src/chat.test.ts` — input validation: trim, 1000 ok, 1001 / empty / whitespace / missing or non-UUID `clientMessageId` / unknown field rejected.

## To Complete the Phase 4 Gate

1. Add to the repository-root `.env`:
   ```text
   AI_BASE_URL=<9router base URL ending in /v1>
   AI_MODEL=<model id exposed by 9router>
   AI_API_KEY=<9router key>
   ```
2. Run `pnpm ai:smoke`. Pass = `OK reply: …` line. If the model returns non-JSON, try `AI_JSON_MODE=true`.
3. Record model, latency, and tokens here.

Next: Unit 05 — Structured Interpretation (can proceed with the fake provider; its live evaluation needs the same credentials).

## Live Gate Result (2026-09-25, during Unit 09)

Passed after an adapter fix (9router streams by default; adapter now sends `stream: false`). Model `ag/gemini-3.8-flash-medium`: `OK reply: Halo juga! Apa kabar?`, 3,826 ms, 2,229 input / 16 output tokens.
