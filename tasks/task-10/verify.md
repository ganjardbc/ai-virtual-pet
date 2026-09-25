# Task 10 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm typecheck
pnpm test
pnpm build
pnpm playtest:reset        (API up with pet; API up without pet; API down with a pet row)
pnpm playtest:advance 12h | banana | 1d (no pet)
Headless Chrome (puppeteer-core, scratchpad): playtest.mjs, Indonesian flow from a clean reset
```

## Results

- Root typecheck passed (5 workspaces). Root tests: domain 42, simulation 92, contracts 6, API 95, web 37. Root build passed.
- The initial Hunger change broke 9 API tests that encoded the old start value. They were updated to keep what each test proves (see implementation).
- `playtest:reset`:
  - API up: "Reset through the running API (pet, history, and debug time)."; `GET /debug/pet/state` returns `PET_NOT_FOUND`.
  - API down with an Egg row present: "Removed pet \"unnamed egg\" and its history." plus the restart advice; `pets` count 0.
  - No pet: "No pet to remove."
- `playtest:advance`:
  - `12h`: prints activity, mood, and need labels.
  - `banana`: usage message, exit 1.
  - No pet: "Could not advance time: PET_NOT_FOUND …", exit 1.
- Browser flow at 430 px, after `pnpm build` and a restart (see the stale-dist note below):

  | Step | Observed |
  | --- | --- |
  | Egg | "Ada sesuatu yang menunggu…" and "Tetaskan" |
  | Naming | "Kamu mau panggil aku apa?", then "Momo? Itu aku!" |
  | Pet Home | "Hai!"; Perut Cukup, Energi Bersemangat, Mood Tenang |
  | Feed 1 | "Nyam!" (succeeds); Kenyang sekali |
  | Feed 2 | "Aku udah kenyang…" |
  | Play ×9 | Energi Lelah sekali, Mood Mengantuk |
  | Sleep | "Sedang tidur…"; Beri makan and Main disabled ("Momo sedang tidur."); Energi Memulihkan diri |
  | +1d, reload | "Kamu balik! Aku lapar banget." with recap under "Selama kamu pergi": Melihat-lihat, Beristirahat sebentar, Bermain sendiri |
  | English leftovers | Scan of the game area for English UI words: none |
  | Layout | "Beri makan" fits the 3-column action row at 430 px (screenshot) |

- The first browser run still showed the old behavior (first Feed refused), because the built API was running against a stale `packages/domain/dist`. A full `pnpm build` and restart fixed it. This is recorded as a limitation. `pnpm dev` reads source and is unaffected.
- Cleanup: servers stopped; the dev database is empty.

## Acceptance Criteria

- [x] The facilitator can reset to the Egg with one command (`pnpm playtest:reset`) or one in-app action (Debug → Reset Pet).
- [x] A fresh Baby's first Feed succeeds.
- [x] All player-facing text is Indonesian; no English leftovers in Player Mode.
- [x] The playtest guide covers setup, session flow, observation, post-test questions, and the watch list, without scripting away discovery.
- [x] Root typecheck, tests, and build remain passing.

## Phase 9 Checklist (implementation plan §124–128)

```text
9.1 Seed / reset workflow          ✓  pnpm playtest:reset, Debug → Reset Pet
9.2 Playtest scenario               ✓  guide §6 (with pnpm playtest:advance for absence)
9.3 Observation questions           ✓  guide §7 (O1–O9)
9.4 Post-test questions             ✓  guide §8
9.5 Record findings                 ✓  PT-template.md now; docs/19 after real sessions
```

## Remaining Issues

None blocking. Prototype 0.1 is ready for the internal playtest. Next step: run the sessions, fill in `PT-00X.md`, then write `docs/19-prototype-01-findings.md`.
