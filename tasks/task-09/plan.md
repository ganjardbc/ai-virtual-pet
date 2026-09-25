# Task 09 — Phase 8 Integration & Hardening

## Status

Complete.

## Goal

Make the prototype reliable enough for someone else to test, and confirm it meets the technical and UX acceptance criteria in `docs/16-prototype-01-scope.md` §84–85 before the playtest.

## Scope

- **8.1** API-level full lifecycle integration test: Create Egg → Hatch → Name → Feed → Play → Sleep → elapsed time → Return. Run against PostgreSQL (and the in-memory store).
- **8.2** Reload test in the browser: perform actions, reload, and confirm the same pet with its state preserved.
- **8.3** Server restart test: stop and restart the API process, and confirm the pet still exists with the same state.
- **8.4** Long absence (+7d): no death, no passive Bond loss, valid stats, a recoverable condition, a reasonable activity, and a reasonable event count.
- **8.5** Repeated-action stress: Feed and Play repeated, plus rapid concurrent attempts. No overflow, no lost updates, diminishing returns work, and the low-Energy rejection works.
- **8.6** Sleep boundaries: sleep at low Energy, sleep near full Energy, advance past auto-wake, and a long elapsed sleep.
- **8.7** Error path review: API unavailable, invalid request, domain rejection, database failure. Player presentation must separate character rejections from technical failures.
- **8.8** Accessibility baseline: keyboard navigation, visible focus, button and input labels, state not conveyed by color alone, sleep has text, and reasonable click targets.
- **8.9** Responsive smoke test: desktop, narrow desktop or tablet, and mobile.
- **8.10** Scope audit: no LLM, memory, search, skills, inventory, currency, authentication, or multiple pets. Delete speculative abstractions that nothing uses.
- Fix any defects found. Confirm the local `pnpm dev` workflow works for a new tester.

## Out of Scope

- Balancing changes: these are playtest decisions already recorded in earlier tasks (initial Hunger, hunger visibility, sleeping on return, copy language).
- Playtest material (Phase 9).
- Production deployment, observability, or security hardening (scope §87).

## Dependencies

- Task 08 / Phase 7 is complete.
- `docs/18-implementation-plan.md` §111–122 and `docs/16-prototype-01-scope.md` §84–86.

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
Browser scripts (headless Chrome): reload, accessibility, responsive
Process-level: API restart, database-unavailable start
Scope audit grep
```

## Acceptance Criteria

- All §112–121 checks pass, or have documented, accepted limitations.
- Every item in scope §84 (technical) and §85 (UX) is verified with evidence.
- Root typecheck, tests, and build remain passing.
