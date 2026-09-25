# Task 10 — Implementation Record

## Status

Complete.

## Implemented

- **Pre-playtest product decisions** (asked of and chosen by the project owner):
  1. **Initial Baby Hunger 100 → 70** (`packages/domain/src/config.ts`).
     - A fresh Baby is "Cukup" (Okay), its first Feed succeeds ("Nyam!", 70 → 95), and a second Feed is refused as too full.
     - Side effect: the first "Lapar" label (≤ 50) now appears after about 10 awake hours instead of about 25, which partly addresses the Task 06 hunger-visibility finding.
  2. **Sleeping pet on return: unchanged** (no player Wake). Tracked as watch item W3.
  3. **Player-facing copy in Indonesian**:
     - `presentation/copy.ts`, `reactions.ts`, and `recap.ts`; Egg and pet ARIA labels; the care group label; `<html lang="id">`.
     - Pet voice is casual ("Aku capek banget…", "Lagi! Lagi!", "Kamu balik! Aku lapar banget."). System voice is neutral ("Tidak bisa terhubung ke server game.").
     - The Debug panel stays in English.
- **9.1 Seed/reset workflow**
  - `pnpm playtest:reset` (`apps/api/src/scripts/reset-pet.ts`): uses the running API's debug reset when reachable, which also resets debug time. Otherwise it deletes the pet directly in the database and advises restarting the API. No database console is needed.
  - In-app: Debug → Reset Pet (Phase 7).
- **Facilitator helper**: `pnpm playtest:advance <12h|1d|7d>` (`apps/api/src/scripts/advance-time.ts`) calls the running API's time travel and prints the resulting pet condition. This lets the facilitator simulate "you were away" without showing the tester the Debug panel. Errors are clear for bad input, no pet, or an unreachable API.
- **9.2–9.4 Facilitator kit**: `docs/playtests/prototype-01-playtest-guide.md` (Indonesian, following the style of the other docs). It covers:
  - The build configuration and pre-playtest decisions.
  - Balancing values at a glance.
  - Session formats: moderated 25–35 minutes, plus an optional 1–3 real days.
  - A setup checklist and facilitator rules (don't explain mechanics; answer questions with "Menurut kamu gimana?").
  - A scripted opening and the session flow: first contact → free care → +16h → +7d → interview.
  - An observation sheet (O1–O9, mapped to implementation plan §126).
  - Success and failure phrases (scope §82–83).
  - Neutral post-test questions (§127).
  - A balancing watch list (W1–W7).
  - After-session steps and troubleshooting.
- **9.5 Findings format**: `docs/playtests/PT-template.md`, a per-session record with observation sheet, interview, watch list, and findings blocks that separate Observation from Interpretation from proposed decision, with S0–S3 severity. `docs/19-prototype-01-findings.md` is deliberately **not** created yet; plan §128 says it comes after real sessions.
- **README**: new Playtest section (kit locations and the three commands).
- **Tests updated** for the new start value:
  - API journey: first Feed succeeds, then `TOO_FULL`.
  - Concurrent-Feed tests now start from 58, still proving the second Feed sees the first.
  - Debug gate "healthy" expects `OKAY`; set-state "before" value updated.
  - Web presentation and screen tests now assert the Indonesian copy, including that no "Wake" or "Bangunkan" button exists.

## Files Changed

```text
README.md
package.json
packages/domain/src/config.ts
apps/api/package.json
apps/api/src/scripts/{reset-pet,advance-time}.ts        (new)
apps/api/src/http/pet-routes.test.ts
apps/api/src/debug/debug-routes.test.ts
apps/web/index.html
apps/web/src/presentation/{copy,reactions,recap}.ts
apps/web/src/presentation/presentation.test.ts
apps/web/src/components/EggCharacter.tsx
apps/web/src/screens/{NamingScreen,PetHome}.tsx
apps/web/src/screens/screens.test.tsx
docs/playtests/prototype-01-playtest-guide.md           (new)
docs/playtests/PT-template.md                           (new)
tasks/task-10/*
```

## Decisions and Deviations

- **The three product decisions were made by the project owner**, not inferred. They are recorded in the task record and the playtest guide rather than `docs/10-decisions.md`, because that log reserves `DEC-XXX` for major decisions and points small balancing changes to playtest records (§67).
- **Playtest material lives in `docs/playtests/`**, the location suggested in `docs/09-playtesting.md` §96.
- **Some internal terms stay as recognizable loanwords** in the player copy ("Mood", "pet", "server game"), matching how Indonesian testers speak ("pet-nya").
- **`playtest:advance` goes through the HTTP debug API, not the database**, because the debug clock offset lives in the API process.

## Known Limitations

- `node apps/api/dist/server.js` uses the compiled workspace packages, so run `pnpm build` after changing domain or simulation code. This happened once during verification (a stale domain `dist` still had Hunger 100). `pnpm dev`, the documented playtest path, reads source and is unaffected.
- The real-time follow-up format (1–3 days) requires the tester to reach the machine running the build. Hosting is out of scope.
- The Indonesian copy was written without a native-speaker review of tone. Watch item W6 covers it.
