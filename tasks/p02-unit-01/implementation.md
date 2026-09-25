# Prototype 0.2 — Unit 01: Implementation Record

## Status

Complete.

## Implemented

### `packages/domain/src/personality.ts`

| Export | Purpose |
| --- | --- |
| `PERSONALITY_TRAITS`, `PersonalityTrait`, `PERSONALITY_TRAIT_KEYS` | Canonical traits (`PLAYFUL`…`CLINGY`) and their model keys. Canonical order drives Random draws and tie-breaks. |
| `PetPersonality` | `{ playful, curious, shy, independent, clingy }`, fractions 0–1. |
| `PERSONALITY_SIGNALS`, `PersonalitySignal` | `PLAY`, `CARE`, `AFFECTION`, `CURIOSITY`, `PRAISE`, `TEASING`, `CASUAL`, `COMFORT`. |
| `PersonalityState` | `petId`, `traits`, `daily { day, deltas }`, `lastIndependentSignalDay`. Mirrors the planned Unit 02 columns. |
| `createPersonalityState` | Validates range 0.05–0.95, Independent + Clingy ≤ 1.40, daily deltas ≤ cap, day format. |
| `createInitialPersonality(petId, random)` | Each trait in 0.35–0.55. |
| `applyPersonalitySignal(state, signal, at)` | Delta → daily cap → clamp → normalization. Returns `{ state, changes }`. |
| `applyAutonomousIndependentSignal(state, at)` | +0.001 Independent, at most once per day. |
| `hasQualifyingAutonomousActivity(events)` | `PET_ACTIVITY_CHANGED` to `PLAYING_ALONE` / `LOOKING_AROUND`. |
| `setPersonalityTraits(state, values)` | Debug set: clamp + normalize, reason `DEBUG`, daily cap untouched. |

### `packages/domain/src/personality-profile.ts`

`derivePersonalityProfile` → `{ dominantTraits, primaryTrait, strength, socialStyle }`; `derivePersonalityPromptProfile` adds `low | moderate | high` per trait; `personalityLevel`.

### `packages/domain/src/config.ts`

`PersonalityRules` + `DEFAULT_PERSONALITY_RULES` — every value from plan §12–§23 (bounds, initial range, cap 0.03, sum 1.40, signal deltas, Independent delta, thresholds 0.35 / 0.65).

### `packages/domain/src/primitives.ts`

`utcDayBucket(at)` and `requireDayBucket` — shared by personality caps now and Talk Bond cap later (Task 7.8).

## Decisions Made in This Unit

The plan left these open; chosen to be the simplest deterministic option:

1. **`PersonalityRules` is separate from `GameRules`.** Keeps Prototype 0.1 rule objects and their tests untouched. Both live in `config.ts`.
2. **`socialStyle`** = Independent − Clingy with margin 0.10 → `INDEPENDENT` / `CLINGY` / `BALANCED`. Added to plan Task 1.11.
3. **Profile adds `primaryTrait` and `strength`** (`STRONG` if any dominant trait, else `MODERATE`), per plan "use highest trait … label strength moderate".
4. **Traits and daily deltas are rounded to 6 decimals** after every change so float noise never accumulates or reaches the database.
5. **Daily delta is signed and tracks applied evolution only.** A delta clamped away at 0.95 does not consume the cap.
6. **Normalization target** = the paired trait that increased. In debug set with both paired traits given, the higher requested value is kept.
7. **Independent signal marks the day even if the cap blocked the delta** (the signal was granted; retrying later that day adds nothing).
8. **No-op updates return the same state object** (`CASUAL`, `TEASING`, capped, clamped), so Unit 02 can skip the write.
9. **Misconfigured rules that cannot satisfy the Independent/Clingy constraint throw `RangeError`** instead of silently breaking the invariant.

## Bug Found During Tests

`socialStyle` boundary: `0.6 − 0.5` evaluates to `0.0999…`, which fell below the 0.10 margin. Fixed with an epsilon in the comparison; covered by the `social style` table test.

## Files Changed

```text
packages/domain/src/personality.ts          (new)
packages/domain/src/personality-profile.ts  (new)
packages/domain/src/personality.test.ts     (new)
packages/domain/src/config.ts
packages/domain/src/primitives.ts
packages/domain/src/index.ts
docs/20-prototype-02-implementation-plan.md (Task 1.11 socialStyle)
tasks/p02-unit-01/*
```

## Database Changes

None.

## Known Limitations

- Directional drift (plan §17): Shy only falls, Playful/Curious/Clingy/Independent only rise; no decay.
- "At most one Independent signal per catch-up run" is the caller's job (Unit 02 application layer); the domain enforces once per day.
