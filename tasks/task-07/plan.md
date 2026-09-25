# Task 07 — Phase 6 Player Experience

## Status

Complete.

## Goal

Turn the working simulation and API into a character-centered, playable web prototype:

```text
Launch → Egg → Hatch → Name → Pet Home → Feed / Play / Sleep → Return
```

The whole journey must work without Debug Mode, and the pet must be the visual focus.

## Scope

- Web foundation:
  - TanStack Query for server state.
  - A small typed API client that validates responses against `@ai-virtual-pet/contracts`.
  - A Vite dev proxy to the API.
  - An error model that separates technical failures from domain rejections.
- Semantic design tokens: color, spacing, radius, typography, shadow, motion. Includes reduced-motion support.
- Only the components the wireframe needs: `Button`, `ActionButton`, `TextInput`, `StatusList`, `ReactionBubble`, `RecapCard`, `SystemMessage`, `Habitat`, `PetCharacter` (SVG), `EggCharacter` (SVG), `GameShell`.
- Screens:
  - Egg: subtle idle motion, one Hatch action.
  - Hatching transition: about 2.8 seconds.
  - Naming: pet first, then input, validation, and a short "That's me!" reaction.
  - Pet Home, with sleeping, autonomous-activity, and return variations.
  - Loading.
  - Technical error with Retry.
- Presentation mapping:
  - Snapshot to pet visual state (Neutral, Happy, Hungry, Sleepy, Excited, Tired/Refusal, Sleeping, Eating, Playing).
  - Activity to pose and label.
  - Action result to reaction.
  - Reaction priority: Action > Return > Important State > Mood/Idle.
- Return experience: a greeting plus up to 3 recap items built from real recent events after a meaningful absence (3 hours or more of simulated time). No moralizing.
- Player status shows descriptive Fullness, Energy, and Mood only. No raw numbers, and Bond is not shown.
- Care actions:
  - Flow: busy → API → authoritative snapshot → reaction. No optimistic stat changes.
  - A short lock while a reaction plays.
  - While sleeping, Feed and Play are disabled and Sleep shows "Sleeping".
- Periodic refetch while the page is open, so auto-wake and autonomous activity appear.
- Unit tests for presentation logic and the API client, plus static-markup smoke tests of screens.

## Out of Scope

- Debug Panel and its entry button (Phase 7). The shell reserves a low-emphasis slot for it.
- Talk (hidden, per wireframe §29).
- Final art, sound, dark mode, full responsive polish, localization.

## Dependencies

- Task 06 / Phase 5 is complete.
- Sources:
  - `docs/17-prototype-01-wireframe.md` (screens, interaction, copy tone, accessibility).
  - `docs/13-design-system.md` (tokens, components).
  - `docs/14-art-direction.md` (original creature, expressive eyes, placeholder quality).
  - `docs/18-implementation-plan.md` §79–100.

## UI Decisions

- **Screen from server state** (wireframe §85):
  - No pet or `EGG` → Egg.
  - `BABY` without a name → Naming.
  - Named → Pet Home.
  - The client keeps only presentation state (hatching timer, active reaction, recap dismissal).
- **Hatch:** creates the Egg on demand (`POST /pet` when none exists), then calls `POST /pet/hatch`. The transition lasts until both the animation minimum and the API have finished.
- **Copy:** English, following the wireframe's examples, kept in one `copy.ts` module so wording can change without touching logic. Pet lines are warm and short. System lines are neutral.
- **Return detection:** compares the simulated time of the new snapshot with the last one this browser saw (kept in memory, and in `localStorage` for reloads), using server time. Debug time travel therefore also triggers return presentation in Phase 7.
- **Recap content:** only events that really happened (autonomous sleep, wake, activity changes), deduplicated, at most 3 items.
- **Sleeping Energy label:** shows "Recovering" instead of the raw label.

## Required Verification

```text
pnpm --filter @ai-virtual-pet/web typecheck
pnpm --filter @ai-virtual-pet/web test
pnpm --filter @ai-virtual-pet/web build
pnpm typecheck
pnpm test
pnpm build
Manual browser journey with API + web dev servers: Launch → Egg → Hatch → Name → Pet Home → Feed → Play → Sleep (no Debug Mode).
```

## Acceptance Criteria

- The Phase 6 gate journey works end-to-end in a browser without Debug Mode.
- The pet or habitat is the largest visual area. Status uses descriptive labels only.
- Feed shows eating and a "full" reaction. Play shows an excited reaction. Play rejection shows a tired refusal in character voice, not a red error.
- The sleeping state is clearly presented, with Feed and Play disabled and no Wake button.
- Autonomous activities (PLAYING_ALONE, RESTING, LOOKING_AROUND, WAITING) have distinct pose and label.
- The return recap appears only after a meaningful absence and never invents events.
- Technical errors use System Voice with Retry and never trigger a fake pet reaction.
- Loading: a minimal initial loader, and per-action busy states (no full-screen loading on actions).
- Root typecheck, tests, and build remain passing.
