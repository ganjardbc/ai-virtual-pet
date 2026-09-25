# Task 08 — Phase 7 Debug UI

## Status

Complete.

## Goal

Expose the Phase 5 debug harness in the web app, so a developer can inspect raw state and drive time without touching the database. Debug must stay visually and architecturally separate from Player Mode.

## Scope

- A low-emphasis "Debug" entry in the game corner that opens and closes the panel. Opening it must not change game rules or state beyond the normal load-time simulation.
- Panel sections, in the order from wireframe §63:
  1. State: raw Hunger, Energy, Happiness, and Bond at 2 decimals, each with a numeric Set control.
  2. Derived: mood, activity, need labels, and the mood score breakdown.
  3. Time: `lastInteractionAt`, `lastSimulatedAt`, `sleepStartedAt`, and the debug clock offset.
  4. Time travel: +1h, +6h, +12h, +1d, +3d, +7d, with a subtle confirmation ("Advanced 1 day").
  5. Commands: Force Sleep, Wake Pet, and Reset Pet (with an inline confirmation, not a browser dialog).
  6. Recent events: newest first, with time, type, and an expandable payload.
- Every debug result updates both the debug view and the player snapshot cache, so the game visibly responds (including the return greeting and recap after time travel).
- Responsive layout: a side panel on desktop and a full-screen drawer on narrow viewports. The game stays mounted underneath.
- Gating: the debug UI is included only in development builds or when `VITE_ENABLE_DEBUG_UI=true`. It is lazy-loaded so it stays out of production bundles. If the server has debug disabled, the panel says so.
- Tests for formatting and the static view, plus a browser run of the Phase 7 gate loop.

## Out of Scope

- New debug API capabilities (Phase 5 is complete).
- Set random seed, force activity, and personality or growth debug.
- Visual polish beyond readable density.

## Dependencies

- Task 07 / Phase 6 is complete.
- `docs/18-implementation-plan.md` §101–110, `docs/17-prototype-01-wireframe.md` §60–74, and `docs/13-design-system.md` §44.

## Required Verification

```text
pnpm --filter @ai-virtual-pet/web typecheck
pnpm --filter @ai-virtual-pet/web test
pnpm --filter @ai-virtual-pet/web build   (check the debug chunk is excluded when disabled)
pnpm typecheck
pnpm test
pnpm build
Browser: Open Debug → Set Energy low → Close → Play (refusal) → +1d → Force Sleep → +6h → +7d.
```

## Acceptance Criteria

- The Phase 7 gate loop completes in the browser in a few minutes, with the game visibly changing.
- Raw stats, derived state, times, and events are shown with enough precision.
- Reset requires confirmation and returns to the Egg experience.
- The debug UI is absent from a production build without the flag.
- Root typecheck, tests, and build remain passing.
