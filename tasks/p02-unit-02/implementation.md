# Prototype 0.2 — Unit 02: Implementation Record

## Status

Complete.

## Implemented

### Database — `apps/api/drizzle/0001_personality.sql`

Table `pet_personalities`, one row per pet:

```text
pet_id (PK, FK → pets.id ON DELETE CASCADE)
playful, curious, shy, independent, clingy        double precision
daily_delta_date                                  date, nullable
<trait>_daily_delta × 5                           double precision, default 0
independent_signal_date                           date, nullable
created_at, updated_at
```

Checks: every trait `between 0.05 and 0.95`; `independent + clingy <= 1.400001` (tolerance for 6-decimal rounding).

No backfill in SQL: existing pets get a personality lazily on first load (plan Task 2.2 preferred option).

### Repositories — `apps/api/src/persistence/`

- `PetAggregate.personality?` — absent for an Egg or a not-yet-initialized legacy Baby.
- `SavePetInput.personality?` — upserted in the **same transaction** as pet, state, and events, under the existing `pets.version` check. Omitted → stored personality unchanged.
- Drizzle: `findCurrent` left-joins `pet_personalities`; `save` upserts (`onConflictDoUpdate`) or reads the existing row; `deleteAll` relies on cascade.
- In-memory: personality lives inside the pet record, so `deleteAll` clears it.
- `assertStateBelongsToPet` also rejects a personality for another pet.
- `testing/database.ts` `truncateAll` includes `pet_personalities`.

### Application — `apps/api/src/application/pet-service.ts`

- `Loaded.personality` — null only for an Egg. `mutate()` loads it, lazily creating one for a legacy Baby, then applies the autonomous Independent signal if the simulation run produced qualifying activity (at most once per run; domain limits to once per day).
- `Mutation.personality?` — operations return an updated personality; omitted keeps the loaded one. A personality change alone counts as a change to save.
- `hatch()` creates the initial personality.
- `act()` applies `PLAY` for accepted Play, `CARE` for accepted Feed; nothing for Sleep or rejected actions.
- New dependencies (also on `AppDependencies`): `personalityRules?` and `personalityRandom?`.

## Decisions Made in This Unit

1. **No separate `version` column on `pet_personalities`.** Personality is part of the pet aggregate and is only written by `PetRepository.save` under `pets.version`. That already serializes all writes and makes action + personality atomic, with no second concurrency mechanism. Plan Tasks 2.1 / 2.4 updated.
2. **`personalityRandom` is separate from `random` and defaults to `SystemRandom`.** Drawing 5 values at hatch from the shared `random` would shift every seeded simulation sequence (and exhaust `SequenceRandom([])` in `app.test.ts`). Production gets random personalities; tests can inject a deterministic one.
3. **Lazy initialization runs in `mutate()`**, so any load of a legacy Baby (including `GET /pet`) creates its personality once. Egg time never creates one.
4. **Play diminishing does not reduce the PLAY signal.** Plan specifies a flat +0.006; the daily cap bounds repeated Play.

## Files Changed

```text
apps/api/drizzle/0001_personality.sql                 (new)
apps/api/drizzle/meta/0001_snapshot.json, _journal.json
apps/api/src/db/schema.ts
apps/api/src/persistence/repositories.ts, drizzle.ts, memory.ts
apps/api/src/persistence/repositories.test.ts
apps/api/src/application/pet-service.ts
apps/api/src/app.ts
apps/api/src/integration.test.ts
apps/api/src/testing/database.ts
docs/20-prototype-02-implementation-plan.md          (Tasks 2.1, 2.4)
tasks/p02-unit-02/*
```

## Database Changes

Migration `0001_personality` — additive table only. Applied to the dev database. Existing dev pet (BABY) has no personality row yet; it is created on next load.

## Known Limitations

- Personality is not visible anywhere yet (debug view is Phase 10); tests read it through the repository.
- No `PERSONALITY_CHANGED` event yet (Unit 07).
