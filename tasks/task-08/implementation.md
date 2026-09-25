# Task 08 — Implementation Record

## Status

Complete.

## Implemented

- **Debug entry**: a low-emphasis ghost "Debug" button in the game corner on every screen. It is provided through `ShellCornerContext`, so screens do not need to know about debug, and it toggles the panel with `aria-expanded`. Opening the panel only runs the normal load-time simulation (`GET /debug/pet/state`), the same as the game's own `GET /pet`.
- **`debug/DebugPanelView.tsx`**: a pure presentational view with sections in wireframe §63 order.
  - **State**: raw Hunger, Energy, Happiness, and Bond at 2 decimals, each with a numeric input and a Set button (the server clamps to 0–100).
  - **Derived**: stage, activity, mood, the three need labels, and mood scores (e.g. `HUNGRY 84.5 · NEUTRAL 0.0`).
  - **Time**: debug `now`, clock offset (e.g. `+8d 6h`), `lastInteractionAt`, `lastSimulatedAt`, `sleepStartedAt`. Below them, the +1h, +6h, +12h, +1d, +3d, and +7d buttons.
  - **Commands**: Force Sleep, Wake Pet, and Reset Pet. Reset asks for inline confirmation ("Reset pet? This will remove current prototype progress." with Cancel and Reset), not a browser dialog.
  - **Recent events**: newest first, with local time and type. Each row expands (`<details>`) to show a compact payload with rounded numbers.
  - **Status and feedback line** (`role="status"`), for example: "Advanced 1 day", "Set energy to 5", "Rejected: SLEEPING", "No pet yet…", "Debug API is disabled on the server…".
- **`debug/DebugPanel.tsx`** (data container):
  - A TanStack Query for the debug state, plus one command mutation (advance, sleep, wake, set, reset).
  - Every result is written to both the debug cache and the player `['pet']` cache, so the game responds right away: time travel brings up the return greeting, recap, sky, and pose.
  - Player actions invalidate the debug view (on pet version or simulated-time change).
  - Reset sets the pet to `null`, so the game returns to the Egg screen.
- **`debug/debug-api.ts`**: a typed client for the Phase 5 endpoints, reusing the shared `request` (now exported from `api/client.ts`).
- **`debug/format.ts`**: presets, stat, time, and offset formatting, and payload formatting.
- **`debug/debug.css`**: a dark, dense, monospace tool layer that is clearly not Player Mode. It is a fixed 380 px right side panel at 900 px and wider (the game shell gets extra right padding so it stays visible), and a full-screen drawer on narrow viewports. The game stays mounted underneath.
- **Gating**:
  - `DEBUG_UI_ENABLED = import.meta.env.DEV || VITE_ENABLE_DEBUG_UI === 'true'`.
  - The panel is `React.lazy`-loaded inside that branch, so production builds without the flag contain no debug code (checked: no "Force Sleep" string in `dist`). With the flag, debug ships as a separate 7.6 KB chunk.
  - If the server has debug disabled, the panel reports it (route `NOT_FOUND`).
- **Player-side improvements found while testing**:
  - The return greeting is now derived from the current snapshot while active. After Force Sleep it shows "Sleeping…" instead of a stale "You're back!".
  - The greeting timer restarts on each new return.
  - `PetHome` is keyed by pet id, so a Reset followed by a new pet starts fresh.
- **Tests**: 8 new web tests for debug formatting and the static view (sections, precision, presets, event order, empty states, no reset without confirmation). Web total: 37.
- README: added a note about the Debug UI flag.

## Files Changed

```text
README.md
apps/web/src/App.tsx
apps/web/src/api/client.ts
apps/web/src/components/GameShell.tsx
apps/web/src/screens/PetHome.tsx
apps/web/src/styles/app.css
apps/web/src/debug/{DebugPanel,DebugPanelView}.tsx
apps/web/src/debug/{debug-api,format}.ts
apps/web/src/debug/debug.css
apps/web/src/debug/debug.test.tsx
tasks/task-08/*
```

## Decisions and Deviations

- **Build-time plus lazy gating, not only a runtime check.** This keeps debug separated both visually and architecturally (scope §57). Players never download it.
- **Inline reset confirmation instead of `window.confirm`.** It matches the wireframe copy and is keyboard reachable (Cancel is autofocused). Browser dialogs also block automated testing.
- **Raw enum values and reason codes are shown in debug** (e.g. `LOOKING_AROUND`, `Rejected: SLEEPING`). Debug values information density over presentation, and Player Mode never shows them.
- **Set Bond is included** (optional in scope §56), because the API already supports it.
- **Debug commands still exist when the pet is an Egg.** The panel shows the Egg's state and offers Reset. Set, Sleep, and Wake return `INVALID_PET_STAGE`, which is shown in the feedback line.

## Known Limitations

- The debug view refreshes on pet changes and on panel open, not on a timer. With the panel left open, autonomous changes appear on the game's 60 s refresh.
- The event list shows the last 25 events. Older history is not paged.
- The side-panel width is fixed. Between 900 and roughly 1,000 px the game column is narrower but still usable.
