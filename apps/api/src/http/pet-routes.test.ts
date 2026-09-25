import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  hatchResultSchema,
  petSnapshotSchema,
  successEnvelopeSchema,
  type ActionResult,
  type ApiErrorCode,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom } from '@ai-virtual-pet/domain';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { DatabaseConnection } from '../db/client.js';
import { DrizzleEventRepository, DrizzlePetRepository } from '../persistence/drizzle.js';
import { InMemoryStore } from '../persistence/memory.js';
import {
  ConcurrencyError,
  type EventRepository,
  type PetRepository,
} from '../persistence/repositories.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';

const HOUR_MS = 60 * 60 * 1_000;
const START = new Date('2026-09-25T08:00:00.000Z');

const snapshotEnvelope = successEnvelopeSchema(petSnapshotSchema);
const hatchEnvelope = successEnvelopeSchema(hatchResultSchema);
const actionEnvelope = successEnvelopeSchema(actionResultSchema);

interface Harness {
  readonly app: FastifyInstance;
  readonly clock: FakeClock;
  advanceHours(hours: number): void;
  request(options: InjectOptions): Promise<{ statusCode: number; body: unknown }>;
  snapshot(options: InjectOptions, expectedStatus?: number): Promise<PetSnapshot>;
  action(type: string): Promise<ActionResult>;
  error(options: InjectOptions, code: ApiErrorCode): Promise<void>;
}

function createHarness(pets: PetRepository, events: EventRepository): Harness {
  const clock = new FakeClock(START);
  const app = buildApp({ pets, events, clock, random: new SeededRandom(1) });

  const request = async (options: InjectOptions) => {
    const response = await app.inject(options);
    return { statusCode: response.statusCode, body: response.json() as unknown };
  };

  return {
    app,
    clock,
    advanceHours: (hours) => clock.advanceBy(hours * HOUR_MS),
    request,
    async snapshot(options, expectedStatus = 200) {
      const response = await request(options);
      expect(response.statusCode, JSON.stringify(response.body)).toBe(expectedStatus);
      return snapshotEnvelope.parse(response.body).data;
    },
    async action(type) {
      const response = await request({ method: 'POST', url: '/api/v1/pet/actions', payload: { type } });
      expect(response.statusCode, JSON.stringify(response.body)).toBe(200);
      return actionEnvelope.parse(response.body).data;
    },
    async error(options, code) {
      const response = await request(options);
      const envelope = apiErrorEnvelopeSchema.parse(response.body);
      expect(envelope.error.code).toBe(code);
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    },
  };
}

const createPet = { method: 'POST', url: '/api/v1/pet' } as const;
const getPet = { method: 'GET', url: '/api/v1/pet' } as const;
const hatch = { method: 'POST', url: '/api/v1/pet/hatch' } as const;
const rename = (name: unknown) => ({ method: 'PATCH', url: '/api/v1/pet/name', payload: { name } }) as const;

/** API behavior that must hold for every repository implementation. */
function apiContract(getRepositories: () => { pets: PetRepository; events: EventRepository }): void {
  let harness: Harness;

  beforeEach(() => {
    const { pets, events } = getRepositories();
    harness = createHarness(pets, events);
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('runs the full journey: create → hatch → name → feed → play → sleep → time passes → get', async () => {
    await harness.error(getPet, 'PET_NOT_FOUND');

    const egg = await harness.snapshot(createPet, 201);
    expect(egg.pet).toMatchObject({ stage: 'EGG', name: null, hatchedAt: null, version: 0 });
    await harness.error(createPet, 'PET_ALREADY_EXISTS');

    // Waiting as an Egg does not cost needs.
    harness.advanceHours(5);
    expect((await harness.snapshot(getPet)).state).toMatchObject({ hunger: 70, energy: 100 });

    const hatched = hatchEnvelope.parse((await harness.request(hatch)).body).data;
    expect(hatched.status).toBe('SUCCESS');
    expect(hatched.pet.pet).toMatchObject({ stage: 'BABY', hatchedAt: harness.clock.now().toISOString() });
    expect(hatched.pet.state.lastSimulatedAt).toBe(harness.clock.now().toISOString());
    expect(hatched.pet.recentEvents[0]?.type).toBe('PET_HATCHED');
    await harness.error(hatch, 'INVALID_PET_STAGE');

    const named = await harness.snapshot(rename('  Momo   Kecil '));
    expect(named.pet.name).toBe('Momo Kecil');
    expect(named.recentEvents[0]).toMatchObject({ type: 'PET_NAMED', payload: { name: 'Momo Kecil' } });

    const baby = await harness.snapshot(getPet);
    expect(baby.pet).toMatchObject({ stage: 'BABY', name: 'Momo Kecil' });
    expect(baby.derived.needs.fullness).toBe('OKAY');

    // A fresh Baby can be fed right away (70 → 95); a second helping is refused as too full.
    const firstMeal = await harness.action('FEED');
    expect(firstMeal.status === 'SUCCESS' && firstMeal.changes.hunger).toBe(25);
    const tooFull = await harness.action('FEED');
    expect(tooFull).toMatchObject({ status: 'REJECTED', reason: 'TOO_FULL' });

    harness.advanceHours(24);
    const fed = await harness.action('FEED');
    expect(fed.status).toBe('SUCCESS');
    expect(fed.status === 'SUCCESS' && fed.changes.hunger).toBe(25);
    expect(fed.pet.state.lastInteractionAt).toBe(harness.clock.now().toISOString());

    const played = await harness.action('PLAY');
    expect(played.status === 'SUCCESS' && played.changes).toMatchObject({ energy: -10, hunger: -4, bond: 1 });
    expect(played.pet.derived.mood).toBe('EXCITED');

    const slept = await harness.action('SLEEP');
    expect(slept.status).toBe('SUCCESS');
    expect(slept.pet.state).toMatchObject({
      currentActivity: 'SLEEPING',
      sleepStartedAt: harness.clock.now().toISOString(),
    });

    const whileSleeping = await harness.action('FEED');
    expect(whileSleeping).toMatchObject({ status: 'REJECTED', reason: 'SLEEPING' });

    harness.advanceHours(9);
    const later = await harness.snapshot(getPet);
    expect(later.state.currentActivity).not.toBe('SLEEPING');
    expect(later.state.energy).toBeGreaterThan(slept.pet.state.energy);
    expect(later.state.lastSimulatedAt).toBe(harness.clock.now().toISOString());
    expect(later.pet.version).toBeGreaterThan(slept.pet.pet.version);
    expect(later.recentEvents.map((event) => event.type)).toContain('PET_WOKE_UP');
  });

  it('returns a structured rejection when the pet is too tired to play', async () => {
    await harness.request(createPet);
    await harness.request(hatch);

    const results: ActionResult[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      results.push(await harness.action('PLAY'));
    }

    const rejection = results.find((result) => result.status === 'REJECTED');
    expect(rejection).toMatchObject({ status: 'REJECTED', reason: 'TOO_TIRED', action: { type: 'PLAY' } });
    expect(rejection?.pet.state.energy).toBeLessThanOrEqual(15);
    expect(rejection?.pet.derived.needs.energy).toBe('EXHAUSTED');
    expect(rejection?.pet.recentEvents[0]).toMatchObject({
      type: 'ACTION_REJECTED',
      payload: { action: 'PLAY', reason: 'TOO_TIRED' },
    });

    const multipliers = results
      .filter((result) => result.status === 'SUCCESS')
      .slice(0, 4)
      .map((result) => result.status === 'SUCCESS' && result.changes.bond);
    expect(multipliers).toEqual([1, 0.75, 0.5, 0.25]);
  });

  it('does not persist anything when a GET finds no elapsed time', async () => {
    await harness.request(createPet);
    const hatched = hatchEnvelope.parse((await harness.request(hatch)).body).data;

    const snapshot = await harness.snapshot(getPet);

    expect(snapshot.pet.version).toBe(hatched.pet.pet.version);
  });

  it('rejects care actions and naming for an Egg', async () => {
    await harness.request(createPet);

    await harness.error({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } }, 'INVALID_PET_STAGE');
    await harness.error(rename('Momo'), 'INVALID_PET_STAGE');
  });

  it('requires a pet for lifecycle operations', async () => {
    await harness.error(hatch, 'PET_NOT_FOUND');
    await harness.error(rename('Momo'), 'PET_NOT_FOUND');
    await harness.error({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } }, 'PET_NOT_FOUND');
  });

  it.each([
    ['blank name', rename('   ')],
    ['too long name', rename('x'.repeat(31))],
    ['non-string name', rename(42)],
    ['missing body', { method: 'PATCH', url: '/api/v1/pet/name' }],
    ['unknown action', { method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'BECOME_ADULT' } }],
    ['malformed JSON', {
      method: 'POST',
      url: '/api/v1/pet/actions',
      headers: { 'content-type': 'application/json' },
      payload: '{"type":',
    }],
  ] as const)('returns VALIDATION_ERROR for %s', async (_label, options) => {
    await harness.request(createPet);
    await harness.request(hatch);

    const response = await harness.request(options as InjectOptions);

    expect(response.statusCode).toBe(400);
    expect(apiErrorEnvelopeSchema.parse(response.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('applies two concurrent Feed requests one after another', async () => {
    await harness.request(createPet);
    await harness.request(hatch);
    harness.advanceHours(6);
    const before = await harness.snapshot(getPet);

    const results = await Promise.all([harness.action('FEED'), harness.action('FEED')]);
    const after = await harness.snapshot(getPet);
    const accepted = results.filter((result) => result.status === 'SUCCESS');

    // From 58 Hunger the first Feed lands at 83, so the second one sees that result and
    // gets the diminished near-full effect (+10). A lost update would show only +25.
    expect(accepted).toHaveLength(2);
    expect(after.state.hunger).toBeCloseTo(before.state.hunger + 25 + 10, 6);
    expect(after.pet.version).toBe(before.pet.version + 2);
    expect(after.recentEvents.filter((event) => event.type === 'PET_FED')).toHaveLength(2);
  });
}

describe('Pet API (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  apiContract(() => ({ pets: store, events: store }));
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Pet API (PostgreSQL)', () => {
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

  apiContract(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
  }));
});

describe('API error model', () => {
  it('returns NOT_FOUND for unknown routes', async () => {
    const store = new InMemoryStore();
    const harness = createHarness(store, store);

    await harness.error({ method: 'GET', url: '/api/v1/nope' }, 'NOT_FOUND');
    await harness.app.close();
  });

  it('hides technical failures behind INTERNAL_ERROR', async () => {
    const store = new InMemoryStore();
    const broken: PetRepository = {
      ...bindAll(store),
      findCurrent: () => Promise.reject(new Error('connection refused: secret-host:5432')),
    };
    const harness = createHarness(broken, store);

    const response = await harness.request(getPet);

    expect(response.statusCode).toBe(500);
    expect(apiErrorEnvelopeSchema.parse(response.body).error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on the server.',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret-host');
    await harness.app.close();
  });

  it('returns PET_STATE_CONFLICT when conflicts persist after retries', async () => {
    const store = new InMemoryStore();
    const harness = createHarness(store, store);
    await harness.request(createPet);
    await harness.request(hatch);
    await harness.app.close();

    let attempts = 0;
    const conflicting: PetRepository = {
      ...bindAll(store),
      save: (input) => {
        attempts += 1;
        return Promise.reject(new ConcurrencyError(input.pet.id, input.expectedVersion));
      },
    };
    const conflicted = createHarness(conflicting, store);

    await conflicted.error({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'SLEEP' } }, 'PET_STATE_CONFLICT');
    expect(attempts).toBe(5);
    await conflicted.app.close();
  });

  it('retries a Feed that lost a race so both Feeds apply in sequence', async () => {
    const store = new InMemoryStore();
    const setup = createHarness(store, store);
    await setup.request(createPet);
    await setup.request(hatch);
    await setup.app.close();

    // Hold the first two loads until both requests have read the same version.
    let conflicts = 0;
    let arrivals = 0;
    let releaseGate = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const racing: PetRepository = {
      ...bindAll(store),
      findCurrent: async () => {
        const loaded = await store.findCurrent();
        arrivals += 1;

        if (arrivals <= 2) {
          if (arrivals === 2) {
            releaseGate();
          }

          await gate;
        }

        return loaded;
      },
      save: async (input) => {
        try {
          return await store.save(input);
        } catch (error) {
          conflicts += error instanceof ConcurrencyError ? 1 : 0;
          throw error;
        }
      },
    };
    const harness = createHarness(racing, store);
    harness.advanceHours(6);

    const results = await Promise.all([harness.action('FEED'), harness.action('FEED')]);
    const hungerAfter = Math.max(...results.map((result) => result.pet.state.hunger));

    expect(conflicts).toBe(1);
    expect(results.every((result) => result.status === 'SUCCESS')).toBe(true);
    expect(results.map((result) => result.pet.pet.version).sort()).toEqual([2, 3]);
    expect(hungerAfter).toBeCloseTo(58 + 25 + 10, 6);
    await harness.app.close();
  });

  it('includes a request id in success and error responses', async () => {
    const store = new InMemoryStore();
    const harness = createHarness(store, store);

    const created = snapshotEnvelope.parse((await harness.request(createPet)).body);
    const failed = apiErrorEnvelopeSchema.parse((await harness.request(createPet)).body);

    expect(created.meta.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(failed.meta.requestId).not.toBe(created.meta.requestId);
    await harness.app.close();
  });
});

function bindAll(store: InMemoryStore): PetRepository {
  return {
    findCurrent: () => store.findCurrent(),
    create: (pet, state, events) => store.create(pet, state, events),
    save: (input) => store.save(input),
    deleteAll: () => store.deleteAll(),
  };
}
