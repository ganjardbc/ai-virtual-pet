# Task 07 — Verification Record

## Status

Passed.

## Commands Run

```text
pnpm --filter @ai-virtual-pet/web typecheck
pnpm --filter @ai-virtual-pet/web test
pnpm --filter @ai-virtual-pet/simulation test
pnpm typecheck
pnpm test
pnpm build

API_PORT=3000 node apps/api/dist/server.js        (local PostgreSQL, debug enabled via .env)
pnpm --filter @ai-virtual-pet/web exec vite --port 5173
node journey.mjs / return.mjs / face.mjs          (puppeteer-core + installed Chrome, headless; scratchpad only)
```

The Claude in Chrome extension was not connected, so the browser journey used headless Chrome driven by `puppeteer-core`, installed in the session scratchpad (not added to the project).

## Results

- Root typecheck passed (5 workspaces).
- Root tests passed: domain 42, simulation 92, contracts 6, API 77, web 29.
- Root build passed. Web bundle: 376 KB JS (115 KB gzip), 13 KB CSS.
- Browser journey at 430 px, no Debug Mode:

  | Step | Observed |
  | --- | --- |
  | Egg | "Something is waiting…" and Hatch |
  | Hatching | Crack animation and "Hatching…", button disabled |
  | Naming | Pet shown first; input focused after the introduction; "What will you call me?" |
  | Name `"  Momo  "` | "Momo? That's me!" |
  | Pet Home | Fullness Very full, Energy Energetic, Mood Calm |
  | Feed | "I'm too full to eat more." (fresh Baby) |
  | Play | "Again! Again!"; excited face; pet moves to the ball; Mood Excited |
  | Sleep | "Goodnight…", then "Sleeping…"; pet on the bed with Zz; Feed, Play, and Sleeping all disabled; Energy Recovering |

- Second pass at 1280 px:

  | Step | Observed |
  | --- | --- |
  | Desktop Pet Home | Centered, bounded 440 px column |
  | +20h (debug API via curl), reload | "You're back!" and recap: Looked around, Played by itself, Rested for a while |
  | +7 days, reload | "You're back! I'm pretty hungry." with recap; Very hungry, Tired, Mood Hungry; daytime sky |
  | API stopped, then Feed | "Something went wrong. Try again." (System Voice); pet line unchanged; no fake reaction |
  | Fresh load with API down | "Couldn't connect to the game server." with Retry |

- Issues found in the browser and fixed:
  1. "Naming…" label stayed on during the name celebration. The form is now hidden while celebrating, and the celebration no longer blocks the submit handler. A global `[hidden]` rule was added because `.naming { display: flex }` overrode the attribute.
  2. "Mood: Excited" showed while the pet slept right after Play. `EXCITED` now requires the pet to be awake (simulation change plus test).
  3. The hungry brows read as angry (inner ends lowered). They are flipped to a worried shape and re-checked by screenshot.
  4. Too much empty space above Pet Home on tall phones. The shell now aligns to the top; Egg and Naming still center through their own stage height.
- Console: only the two expected 404s from `GET /pet` before a pet exists. No React warnings or page errors.
- Cleanup: dev servers stopped, and the smoke-test pet deleted from the dev database.

## Acceptance Criteria

- [x] Phase 6 gate journey (Launch → Egg → Hatch → Name → Pet Home → Feed → Play → Sleep) works in a real browser without Debug Mode.
- [x] The habitat and pet are the largest visual area. Status is descriptive only (no raw stats or Bond; tested).
- [x] Feed shows eating and full reactions. Play shows an excited reaction. The tired refusal is in character voice with a tired face (unit-tested; no red error).
- [x] The sleeping state is clear: bed pose, Zz, "Sleeping…", Feed and Play disabled, Energy "Recovering", no Wake button.
- [x] PLAYING_ALONE, RESTING, LOOKING_AROUND, and WAITING have distinct pose, expression, and narration (tested).
- [x] The return recap appears only after 3 hours or more of simulated absence, and only lists real autonomous events.
- [x] Technical errors use System Voice with Retry and never trigger a pet reaction.
- [x] Minimal initial loader and per-action busy states.
- [x] Root typecheck, tests, and build remain passing.

## Phase 6 Gate

```text
Launch → Egg → Hatch → Name → Pet Home → Feed → Play → Sleep   ✓ (headless Chrome, no Debug Mode)
Pet remains visual focus                                        ✓ (screenshots at 430 and 1280 px)
```

## Remaining Issues

None blocking Phase 6. Open decisions for the playtest: copy language (English vs Indonesian), and the fresh Baby refusing its first Feed.
