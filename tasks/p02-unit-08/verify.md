# Prototype 0.2 — Unit 08: Verification Record

## Status

Passed. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass |
| Tests | `pnpm test` | Pass — 614 tests (api 371) |
| Build | `pnpm build` | Pass |
| Mutation check | disable the committed-action lookup | 6 crash-resume tests fail (3 per store); restored |

## Coverage (`http/chat-failures.test.ts`, 10 cases × in-memory + PostgreSQL)

| Scenario | Verified |
| --- | --- |
| crash after accepted Play | 500; Retry → PLAY SUCCESS, one PET_PLAYED, Bond +1 once, one interpretation call, reply linked, `resumedAction`, prompt has real result |
| crash after rejected Play | Retry keeps TOO_TIRED even after Energy restored; no PET_PLAYED; one tagged rejection |
| crash after Feed, reply fails on Retry | "Nyam!" from rebuilt changes; one PET_FED |
| crash after Talk Bond | Bond, personality, PET_TALKED applied exactly once |
| both AI calls fail | 503, USER kept, Retry completes the same turn |
| reply fails after Sleep | action kept, "Selamat tidur…" |
| spent turn budget | reply call gets 0 ms and never reaches the model; action fallback |
| unexpected provider exception | 500, guard released, same turn resumes |
| buttons during AI failure | Feed / Play / Sleep all 200 |
| reply race from another process | 409 CHAT_IN_PROGRESS; Retry returns the stored reply; one reply |

Next: Unit 09 — Character Performance / Evaluation Harness.
