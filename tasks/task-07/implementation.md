# Task 07 — Implementation Record

## Status

Complete.

## Implemented

- **Web foundation**
  - `api/client.ts`: a small `fetch` client.
    - Validates every success response against `@ai-virtual-pet/contracts`.
    - `ApiError` for coded server errors; `ConnectionError` for unreachable servers or unexpected shapes.
    - Omits the JSON header on body-less requests.
    - `get()` maps `PET_NOT_FOUND` to `null`.
  - `api/pet-queries.ts` (TanStack Query):
    - `usePet` refreshes every 60 s and on window focus.
    - `useHatch` creates the Egg on demand, then hatches.
    - `useNamePet` and `usePetAction` write the authoritative snapshot into the query cache. `usePetAction` invalidates the pet query on `ApiError`.
  - `main.tsx`: `QueryClientProvider`.
  - `vite.config.ts`: contracts alias to source, and a `/api` proxy to `localhost:$API_PORT` (default 3000).
- **Design tokens** (`styles/tokens.css`): semantic color, spacing (4 px scale), radius, typography, elevation, and motion variables.
  - Palette: warm off-white, coral primary, teal secondary, mint pet.
  - Fonts: Bricolage Grotesque for the pet name and speech, Figtree for the UI (Google Fonts, system fallback).
- **Components**: `Button`, `ActionButton` (with Feed/Play/Sleep icons), `TextInput`, `StatusList`, `ReactionBubble`, `RecapCard`, `SystemMessage`, `GameShell`, `Habitat`, `PetCharacter`, `EggCharacter`.
- **Placeholder art**, SVG-only, no image assets:
  - The pet is a mint "dumpling" with a head sprout. It has 10 expressions: neutral, happy, excited, hungry, sleepy, tired, sleeping, eating, curious, content.
  - The sprout perks up or droops with state, which is body language rather than numbers.
  - 7 motion loops: breathe, slow, bounce, sway, nibble, shake, peek. Eyes blink.
  - The egg wobbles occasionally, then rattles, cracks, and bursts while hatching.
- **Habitat**:
  - Fixed height. The sky follows the pet's simulated local hour (dawn, day, dusk, night with moon and stars).
  - A bed (sleep area) and a ball (play prop).
  - The pet moves between the center, bed, and toy positions.
- **Screens**:
  - `EggScreen`.
  - Hatching transition: at least 2.8 s, and until the API finishes.
  - `NamingScreen`: the pet appears first, the input gets focus after 0.9 s, then client validation (Zod contract), then a 1.6 s "Momo? That's me!" celebration.
  - `PetHome`.
  - `LoadingScreen`, `ConnectionScreen` (Retry).
- **Presentation logic** (`presentation/`):
  - `visual.ts`: snapshot → expression, pose, and motion. Priority: sleeping > urgent needs > autonomous activity > mood.
  - `reactions.ts`:
    - Action results → speech: normal/full Feed, excited or tired Play, too-tired and too-full refusals, goodnight.
    - Idle lines and narration.
    - Return greeting.
  - `recap.ts`: up to 3 deduplicated items from real autonomous events after the last visit.
  - `time-of-day.ts`.
  - `copy.ts`: all player-facing words in one place.
- **Pet Home behavior**:
  - Reaction priority: action reaction (1.8 s) > return greeting (6 s) > state/activity/mood line.
  - Busy state per action, with a 0.7 s lock. No optimistic stat changes.
  - While sleeping: Feed and Play are disabled with the "Momo is sleeping." hint, Sleep shows as the active "Sleeping" state, Energy reads "Recovering", and there is no Wake button.
  - Technical failures show a System Voice message, never a pet reaction.
- **Return detection**: compares the new snapshot's simulated time with the last one seen in this session (also stored in `localStorage` per pet, wrapped in try/catch). Uses a 3-hour threshold on server time, so debug time travel also triggers it.
- **Simulation fix**: `EXCITED` mood now requires the pet to be awake. Found in the browser: a pet put to sleep right after Play showed "Mood: Excited". New test added (simulation now 92 tests).
- **Tests** (web: 29):
  - Presentation logic: 20.
  - API client with a mocked `fetch`: 5.
  - Static-markup screen tests: 4. They check that there are no raw stats, Bond, or Talk; the sleeping state and disabled actions; and that the pet appears before the input.

## Files Changed

```text
apps/web/package.json
apps/web/tsconfig.json
apps/web/vite.config.ts
apps/web/index.html
apps/web/src/main.tsx
apps/web/src/App.tsx
apps/web/src/api/{client,pet-queries}.ts
apps/web/src/api/client.test.ts
apps/web/src/components/*.tsx
apps/web/src/presentation/{copy,visual,reactions,recap,time-of-day}.ts
apps/web/src/presentation/presentation.test.ts
apps/web/src/screens/{EggScreen,NamingScreen,PetHome,StatusScreens}.tsx
apps/web/src/screens/screens.test.tsx
apps/web/src/styles/{tokens,app}.css
apps/web/src/testing/snapshot.ts
packages/simulation/src/mood.ts
packages/simulation/src/derive.test.ts
pnpm-lock.yaml
tasks/task-07/*

Removed: apps/web/src/App.test.tsx, apps/web/src/styles.css
```

## Decisions and Deviations

- **English copy**, following the wireframe examples. Everything is in `presentation/copy.ts`, so switching to Indonesian for playtesters is a one-file change. This is worth deciding before the playtest, since the target player language in scope §82 is Indonesian.
- **Neutral mood is shown as "Calm"** because "Neutral" reads clinical to a player.
- **Status is a compact 3-column row** instead of stacked rows, to keep it quiet under the actions. It is still descriptive-only.
- **Hatch creates the Egg on demand.** A first launch shows the Egg without writing anything, and `PET_ALREADY_EXISTS` is tolerated.
- **Return recap only lists autonomous events.** Player and debug actions, rejections, and wake-ups are excluded. After very long absences the recap covers only the detailed 48-hour window, because older time is simulated without events.
- **The time-of-day sky uses the browser's local hour** of the pet's simulated time.
- **Debug entry**: the shell has a corner slot, but no button yet. The panel is Phase 7, and a dead button would confuse testers.
- **No DOM test environment** (jsdom or Testing Library) was added. The scope says UI automated tests are not a priority, so behavior was verified with a real headless-Chrome journey (see `verify.md`).

## Known Limitations

- **Fonts load from Google Fonts.** Offline use falls back to system fonts.
- **A freshly hatched Baby refuses Feed** (initial Hunger 100, per Task 02). In the browser, a first-time player's first Feed gets "I'm too full to eat more." The balancing decision is still open.
- **Expected 404s in the console:** the browser logs the normal `GET /pet` 404 ("no pet yet") before hatching.
- **Mood stability across requests** is still not applied (Task 05 limitation).
- **No wake transition animation.** An auto-wake while the page is open appears on the next 60 s refresh as a pose change.
