# Task 11 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm typecheck
pnpm test
pnpm build
Temporary fuzz test (packages/simulation, 400 seeds × 60 steps), removed after run
Live probes on pnpm dev: 4 and 6 concurrent POST /api/v1/pet; PATCH name "​​" and "Mo​mo"
Browser (headless Chrome): naming transition probe; Indonesian player flow; Phase 7 debug loop
```

## Results

- Root typecheck passed (5 workspaces).
- Root tests: domain 42, simulation 92, contracts 8, API 95, web 40 (277 total; +5 from this task).
- Root build passed.

| Check | Before | After |
| --- | --- | --- |
| Concurrent creates (live PostgreSQL) | 4 requests: `201 409 409 201`, **2 pets** | 6 requests: `409 201 409 409 409 409`, **1 pet** |
| Invisible name `"​​"` | Stored | 400 `VALIDATION_ERROR` |
| `"Mo​mo"` | Stored as-is | Normalized to "Momo" |
| Out-of-order snapshot | Older overwrote newer | Kept newest (unit tests: older-late, equal version, reset, different pet) |
| Vite proxy port | Shell only | Root `.env` `API_PORT` read (`loadEnv` shows 3000) |
| Fuzz (400 × 60) | — | 0 violations, 0 exceptions |
| Naming transition | Suspected flash | `FORM → CELEBRATE → HOME` (no flash) |

- **Browser player flow (Indonesian)**, unchanged except for the corrected hint punctuation:
  - Egg → Name → "Momo? Itu aku!"
  - "Nyam!", then "Aku udah kenyang…"
  - Sleeping: Beri makan and Main disabled, shown as "(Momo sedang tidur.)"
  - +1d: "Kamu balik! Aku lapar banget." with recap
  - No English leftovers.
- **Browser Phase 7 debug loop**:
  - Set energy 5 → "Ngantuk banget…"
  - Main → "Aku capek banget…"
  - +1d → return greeting and recap
  - Force Sleep → +6h: Energy 70.98 → 89.00
  - +7d → "Kamu balik! Aku lapar banget."
  - Reset → Egg
  - Console: only the expected "no pet" 404s.
- Cleanup: dev servers stopped; the dev database is empty.

## Acceptance Criteria

- [x] Each confirmed bug is fixed and covered by a test (#1 repository race test on both stores; #2 domain and contract tests; #3 `newestSnapshot` tests). #4–#6 are configuration or behavior fixes verified live.
- [x] Suspected bugs that could not be reproduced are recorded as cleared (fuzz, naming flash).
- [x] Root typecheck, tests, and build pass; both browser flows show no regressions.

## Remaining Issues

None blocking the playtest.
