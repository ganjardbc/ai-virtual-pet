import {
  createDomainEvent,
  createEgg,
  createInitialPetState,
  hatchPet,
  namePet,
  type EggPet,
  type PetState,
} from '@ai-virtual-pet/domain';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from '../db/client.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';
import { DrizzleEventRepository, DrizzlePetRepository } from './drizzle.js';
import { InMemoryStore } from './memory.js';
import {
  ConcurrencyError,
  PetAlreadyExistsError,
  PetNotFoundError,
  type EventRepository,
  type PetRepository,
} from './repositories.js';

const createdAt = new Date('2026-09-25T08:00:00.000Z');
const minutes = (count: number) => new Date(createdAt.getTime() + count * 60 * 1_000);

interface Repositories {
  readonly pets: PetRepository;
  readonly events: EventRepository;
}

function newEgg(id = 'pet-1', at = createdAt): { egg: EggPet; state: PetState } {
  return { egg: createEgg({ id, createdAt: at }), state: createInitialPetState(id, at) };
}

/** Behavior every PetRepository/EventRepository implementation must share. */
function repositoryContract(getRepositories: () => Repositories): void {
  it('returns null when no pet exists', async () => {
    const { pets } = getRepositories();

    expect(await pets.findCurrent()).toBeNull();
  });

  it('creates and loads an Egg with its initial state', async () => {
    const { pets } = getRepositories();
    const { egg, state } = newEgg();

    const created = await pets.create(egg, state);

    expect(created).toEqual({ pet: egg, state, version: 0 });
    expect(await pets.findCurrent()).toEqual(created);
  });

  it('updates pet and state, increments the version, and appends events atomically', async () => {
    const { pets, events } = getRepositories();
    const { egg, state } = newEgg();
    await pets.create(egg, state);

    const baby = namePet(hatchPet(egg, minutes(1)), 'Momo');
    const nextState: PetState = {
      ...state,
      hunger: 72.5,
      energy: 40.25,
      currentActivity: 'SLEEPING',
      sleepStartedAt: minutes(2),
      lastInteractionAt: minutes(2),
      lastSimulatedAt: minutes(2),
    };
    const saved = await pets.save({
      pet: baby,
      state: nextState,
      expectedVersion: 0,
      events: [
        createDomainEvent('PET_HATCHED', minutes(1)),
        createDomainEvent('PET_NAMED', minutes(1), { name: 'Momo' }),
        createDomainEvent('PET_STARTED_SLEEPING', minutes(2), { source: 'PLAYER' }),
      ],
    });

    expect(saved).toEqual({ pet: baby, state: nextState, version: 1 });
    expect(await pets.findCurrent()).toEqual(saved);

    const recent = await events.listRecent('pet-1', { limit: 10 });
    expect(recent.map((event) => event.type)).toEqual(['PET_STARTED_SLEEPING', 'PET_NAMED', 'PET_HATCHED']);
    expect(recent[1]).toMatchObject({ petId: 'pet-1', occurredAt: minutes(1), payload: { name: 'Momo' } });
  });

  it('rejects a stale version without writing state or events', async () => {
    const { pets, events } = getRepositories();
    const { egg, state } = newEgg();
    await pets.create(egg, state);
    await pets.save({ pet: egg, state: { ...state, hunger: 90 }, expectedVersion: 0, events: [] });

    await expect(
      pets.save({
        pet: egg,
        state: { ...state, hunger: 10 },
        expectedVersion: 0,
        events: [createDomainEvent('PET_FED', minutes(5))],
      }),
    ).rejects.toBeInstanceOf(ConcurrencyError);

    expect((await pets.findCurrent())?.state.hunger).toBe(90);
    expect(await events.listRecent('pet-1', { limit: 10 })).toEqual([]);
  });

  it('rejects saving a pet that does not exist', async () => {
    const { pets } = getRepositories();
    const { egg, state } = newEgg();

    await expect(pets.save({ pet: egg, state, expectedVersion: 0, events: [] })).rejects.toBeInstanceOf(
      PetNotFoundError,
    );
  });

  it('rejects state that belongs to another pet', async () => {
    const { pets } = getRepositories();
    const { egg } = newEgg();

    await expect(pets.create(egg, createInitialPetState('other', createdAt))).rejects.toThrow(
      'cannot be stored on pet',
    );
  });

  it('allows only one pet, even when creates race', async () => {
    const { pets } = getRepositories();
    const first = newEgg('pet-1', createdAt);
    const second = newEgg('pet-2', minutes(10));
    const third = newEgg('pet-3', minutes(20));

    const results = await Promise.allSettled([
      pets.create(first.egg, first.state),
      pets.create(second.egg, second.state),
      pets.create(third.egg, third.state),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    for (const result of results.filter((r) => r.status === 'rejected')) {
      expect((result as PromiseRejectedResult).reason).toBeInstanceOf(PetAlreadyExistsError);
    }
    expect(await pets.findCurrent()).not.toBeNull();
  });

  it('limits recent events with a stable order for equal timestamps', async () => {
    const { pets, events } = getRepositories();
    const { egg, state } = newEgg();
    await pets.create(egg, state, [
      createDomainEvent('PET_FED', minutes(1)),
      createDomainEvent('PET_PLAYED', minutes(1)),
      createDomainEvent('PET_FED', minutes(2)),
    ]);

    expect((await events.listRecent('pet-1', { limit: 2 })).map((e) => e.type)).toEqual([
      'PET_FED',
      'PET_PLAYED',
    ]);
    expect(await events.listRecent('other', { limit: 10 })).toEqual([]);
  });

  it('lists occurrence times for the Play diminishing window', async () => {
    const { pets, events } = getRepositories();
    const { egg, state } = newEgg();
    await pets.create(egg, state, [
      createDomainEvent('PET_PLAYED', minutes(0)),
      createDomainEvent('PET_PLAYED', minutes(60)),
      createDomainEvent('PET_FED', minutes(70)),
      createDomainEvent('PET_PLAYED', minutes(90)),
    ]);

    expect(await events.listOccurrenceTimes('pet-1', 'PET_PLAYED', minutes(60))).toEqual([
      minutes(60),
      minutes(90),
    ]);
  });

  it('deletes every pet with its events', async () => {
    const { pets, events } = getRepositories();
    const { egg, state } = newEgg();
    await pets.create(egg, state, [createDomainEvent('PET_FED', minutes(1))]);

    await pets.deleteAll();

    expect(await pets.findCurrent()).toBeNull();
    expect(await events.listRecent('pet-1', { limit: 10 })).toEqual([]);
  });
}

describe('InMemoryStore', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  repositoryContract(() => ({ pets: store, events: store }));

  it('does not leak mutable references', async () => {
    const { egg, state } = newEgg();
    const created = await store.create(egg, state);
    (created.state as { hunger: number }).hunger = 1;

    expect((await store.findCurrent())?.state.hunger).toBe(state.hunger);
  });
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Drizzle repositories (PostgreSQL)', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await openTestDatabase(databaseUrl as string);
  });

  beforeEach(async () => {
    await truncateAll(connection);
  });

  afterAll(async () => {
    await connection?.close();
  });

  repositoryContract(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
  }));

  it('keeps the pet across a new database connection (reload does not reset)', async () => {
    const pets = new DrizzlePetRepository(connection.db);
    const { egg, state } = newEgg();
    await pets.create(egg, state);
    const saved = await pets.save({
      pet: namePet(hatchPet(egg, minutes(1)), 'Momo'),
      state: { ...state, hunger: 33.3333, bond: 12.7, lastSimulatedAt: minutes(30) },
      expectedVersion: 0,
      events: [createDomainEvent('PET_FED', minutes(30), { hungerDelta: 25 })],
    });

    const reopened = await openTestDatabase(databaseUrl as string);

    try {
      const reloadedPets = new DrizzlePetRepository(reopened.db);
      const reloadedEvents = new DrizzleEventRepository(reopened.db);

      expect(await reloadedPets.findCurrent()).toEqual(saved);
      expect(await reloadedEvents.listRecent('pet-1', { limit: 1 })).toMatchObject([
        { type: 'PET_FED', payload: { hungerDelta: 25 } },
      ]);
    } finally {
      await reopened.close();
    }
  });

  it('rolls back pet and state when event insertion fails', async () => {
    const pets = new DrizzlePetRepository(connection.db);
    const { egg, state } = newEgg();
    await pets.create(egg, state);

    await expect(
      pets.save({
        pet: egg,
        state: { ...state, hunger: 10 },
        expectedVersion: 0,
        events: [createDomainEvent('PET_FED', new Date(Number.NaN))],
      }),
    ).rejects.toThrow();

    expect(await pets.findCurrent()).toMatchObject({ version: 0, state: { hunger: state.hunger } });
  });

  it.each([
    ['stat above range', sql`update pet_states set hunger = 101`],
    ['stat below range', sql`update pet_states set bond = -1`],
    ['unknown activity', sql`update pet_states set current_activity = 'FLYING'`],
    ['sleeping without sleep_started_at', sql`update pet_states set current_activity = 'SLEEPING'`],
    ['named egg', sql`update pets set name = 'Momo'`],
    ['hatched stage without hatched_at', sql`update pets set stage = 'BABY'`],
    ['unknown stage', sql`update pets set stage = 'DRAGON'`],
  ])('rejects %s at the database level', async (_label, statement) => {
    const { egg, state } = newEgg();
    await new DrizzlePetRepository(connection.db).create(egg, state);

    const error: unknown = await connection.db.execute(statement).then(
      () => null,
      (caught: unknown) => caught,
    );

    // 23514 = PostgreSQL check_violation.
    expect(error).toMatchObject({ cause: { code: '23514' } });
  });
});
