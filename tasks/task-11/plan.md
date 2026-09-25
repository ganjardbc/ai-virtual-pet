# Task 11 — Cross-Phase Review and Bug Fixes

## Status

Complete.

## Goal

Review all Prototype 0.1 phases (domain, simulation, persistence, API, debug, web, playtest tooling) for correctness bugs, fix the confirmed ones, and verify there are no regressions before the playtest.

## Scope

- Code review of all source (about 4.9k lines, excluding tests).
- Empirical bug hunting: randomized fuzzing of simulation and actions, live race probes against the API, and a browser transition probe.
- Fix only confirmed bugs, each with a regression test.

## Out of Scope

- Balancing changes and new features.
- Refactors without a correctness reason.

## Required Verification

```text
pnpm typecheck
pnpm test
pnpm build
Live API probes (concurrent create, invisible name)
Browser: Indonesian player flow and Phase 7 debug loop
```

## Acceptance Criteria

- Each confirmed bug is fixed and covered by a test.
- Suspected bugs that could not be reproduced are recorded as cleared.
- Root typecheck, tests, and build pass; both browser flows show no regressions.
