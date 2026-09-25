# Prototype 0.2 — Unit 12: Integration & Hardening — Verification

## Commands run

```text
pnpm typecheck   → all 6 workspace projects pass
pnpm test        → contracts 25, domain 99, simulation 92, web 66, api 432 (all pass)
pnpm build       → contracts/domain/simulation/api tsc, web vite build, all succeed
```

Baseline before this unit: api 412. After: api 432 (+20 = 10 hardening cases × 2 stores).
PostgreSQL integration tests ran (both `TEST_DATABASE_URL` describes executed).

Focused run:

```text
pnpm --filter @ai-virtual-pet/api test src/hardening.test.ts → 20 passed
```

## Acceptance criteria

| Task | Criterion | Result |
| --- | --- | --- |
| 11.1 | Full E2E flow | Pass (API + persistence): egg→hatch→name→chat Play→personality→reload→same personality + conversation. Browser/live pass pending. |
| 11.2 | Prototype 0.1 regression | Pass — existing `integration.test.ts` 8.1–8.6 cover feed/play/reject/sleep/auto-wake/+7d/autonomous/reload/restart. |
| 11.3 | AI failure regression | Pass — AI-disabled test: buttons, simulation, debug time travel work; Talk fails gracefully. |
| 11.4 | State truth tests | Pass — rejected chat Play → no `PET_PLAYED`; accepted chat Feed → one `PET_FED`; snapshot matches engine. |
| 11.5 | Duplicate submission | Pass — concurrent same `clientMessageId` → one action, one stored player message; duplicated TALK → one `PET_TALKED`, one personality delta. |
| 11.6 | Long conversation | Pass — 15 turns; full history kept; AI context bounded; no old message in the system prompt. |
| 11.7 | Cost / latency review | Partial — 2 AI calls/turn asserted; live latency/token numbers pending provider credentials. |
| 11.8 | Conversation error recovery | Pass — existing `chat.test.ts` / `chat-failures.test.ts` (resume without duplicate action/Bond/personality). |
| 11.9 | Migration safety | Pass — a pre-personality (0.1-shaped) pet talks and gets a persisted personality (new test); identity/stats/Bond retention is covered by `integration.test.ts` "gives an existing Prototype 0.1 Baby a personality on first load". |
| 11.10 | Scope audit | Pass — no Memory/Embeddings/Vector/Search/Growth/Child/Adult/Reminder/Calendar implemented; nothing to remove. |

## Phase 11 Gate

Technical completion criteria from `docs/19-prototype-02-scope.md`: the automated surface passes.
The criteria that require a live provider or a browser (live latency/cost, live personality
comparison) remain pending credentials, consistent with the Unit 04/05/09 gates.

## Remaining issues

- Live provider cost/latency and browser-level E2E pass pending 9router credentials.
- No defects found; no production code changed.
