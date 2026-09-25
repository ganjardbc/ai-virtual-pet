# Prototype 0.2 — Unit 10: Verification Record

## Status

Automated verification passed. Date: 2026-09-25.

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass — 665 tests (web 61, was 40) |
| `pnpm build` | Pass (web bundle 377 KB JS, 32 KB CSS) |

## Coverage

`presentation/chat.test.ts`: pending turn start / done / failed / retry keeps id and text / no second turn / retry only when failed; compose trim and 1–1000; Enter vs Shift+Enter vs IME; counter threshold; failure mapping for AI_UNAVAILABLE, 500, network, CHAT_IN_PROGRESS, PET_SLEEPING, VALIDATION_ERROR; failure copy never blames the pet; chat reaction look for Talk, Feed, Play, Sleep, rejected Play.

`screens/screens.test.tsx`: Talk is the third of four actions; disabled while sleeping (4 disabled); Talk view order pet → log → input; labeled 1000-char input, live log, status line, Back, send disabled when empty; no stats, Bond, or personality in Pet Home or Talk.

## Not Verified Here

The manual browser journey (Phase 9 gate) and visual layout on phone / desktop — scheduled for Unit 12.

Next: Unit 11 — AI + Personality Debug UI.
