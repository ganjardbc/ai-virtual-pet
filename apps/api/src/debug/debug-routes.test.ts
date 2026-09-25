import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  debugAdvanceTimeResultSchema,
  debugCommandResultSchema,
  debugResetResultSchema,
  debugStateSchema,
  successEnvelopeSchema,
  type ApiErrorCode,
  type DebugAdvanceTimeResult,
  type DebugCommandResult,
  type DebugState,
} from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom } from '@ai-virtual-pet/domain';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { DatabaseConnection } from '../db/client.js';
import { DrizzleEventRepository, DrizzlePetRepository } from '../persistence/drizzle.js';
import { InMemoryStore } from '../persistence/memory.js';
import type { EventRepository, PetRepository } from '../persistence/repositories.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';
import { OffsetClock } from './offset-clock.js';

const HOUR_MS = 60 * 60 * 1_000;
const START = new Date('2026-09-25T08:00:00.000Z');

const stateEnvelope = successEnvelopeSchema(debugStateSchema);
const advanceEnvelope = successEnvelopeSchema(debugAdvanceTimeResultSchema);
const commandEnvelope = successEnvelopeSchema(debugCommandResultSchema);
const actionEnvelope = successEnvelopeSchema(actionResultSchema);

interface DebugHarness {
  readonly app: FastifyInstance;
  readonly clock: OffsetClock;
  request(options: InjectOptions): Promise<{ statusCode: number; body: unknown }>;
  expectOk(options: InjectOptions): Promise<unknown>;
  expectError(options: InjectOptions, code: ApiErrorCode): Promise<void>;
  state(): Promise<DebugState>;
  advance(body: Record<string, unknown>): Promise<DebugAdvanceTimeResult>;
  command(path: 'sleep' | 'wake'): Promise<DebugCommandResult>;
  startBaby(): Promise<void>;
}

function createDebugHarness(pets: PetRepository, events: EventRepository): DebugHarness {
  const clock = new OffsetClock(new FakeClock(START));
  const app = buildApp({ pets, events, clock, random: new SeededRandom(5), debug: { clock } });

  const request = async (options: InjectOptions) => {
    const response = await app.inject(options);
    return { statusCode: response.statusCode, body: response.json() as unknown };
  };
  const expectOk = async (options: InjectOptions) => {
    const response = await request(options);
    expect(response.statusCode, JSON.stringify(response.body)).toBeLessThan(300);
    return response.body;
  };

  return {
    app,
    clock,
    request,
    expectOk,
    async expectError(options, code) {
      const response = await request(options);
      expect(apiErrorEnvelopeSchema.parse(response.body).error.code).toBe(code);
    },
    async state() {
      return stateEnvelope.parse(await expectOk({ method: 'GET', url: '/api/v1/debug/pet/state' })).data;
    },
    async advance(body) {
      const response = await expectOk({ method: 'POST', url: '/api/v1/debug/time/advance', payload: body });
      return advanceEnvelope.parse(response).data;
    },
    async command(path) {
      const response = await expectOk({ method: 'POST', url: `/api/v1/debug/pet/${path}` });
      return commandEnvelope.parse(response).data;
    },
    async startBaby() {
      await expectOk({ method: 'POST', url: '/api/v1/pet' });
      await expectOk({ method: 'POST', url: '/api/v1/pet/hatch' });
    },
  };
}

const playerAction = (type: string) => ({ method: 'POST', url: '/api/v1/pet/actions', payload: { type } }) as const;

function debugContract(getRepositories: () => { pets: PetRepository; events: EventRepository }): void {
  let harness: DebugHarness;

  beforeEach(() => {
    const { pets, events } = getRepositories();
    harness = createDebugHarness(pets, events);
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('passes the Phase 5 gate: healthy → +12h → hungry/tired → sleep → +6h → recovered → +7d', async () => {
    await harness.startBaby();

    const healthy = await harness.state();
    expect(healthy.pet.derived.needs).toMatchObject({ fullness: 'OKAY', energy: 'ENERGETIC' });

    await harness.advance({ hours: 12 });
    const afterDay = await harness.advance({ hours: 12 });
    expect(afterDay.pet.state.hunger).toBeLessThan(60);
    expect(afterDay.pet.state.energy).toBeLessThan(healthy.pet.state.energy);
    expect(afterDay.pet.derived.needs.fullness).not.toMatch(/FULL/);

    const fed = actionEnvelope.parse(await harness.expectOk(playerAction('FEED'))).data;
    expect(fed.status).toBe('SUCCESS');
    const slept = actionEnvelope.parse(await harness.expectOk(playerAction('SLEEP'))).data;
    expect(slept.pet.state.currentActivity).toBe('SLEEPING');

    const recovered = await harness.advance({ hours: 6 });
    expect(recovered.pet.state.energy).toBeGreaterThan(slept.pet.state.energy);
    expect(recovered.debug.events.map((event) => event.type)).not.toContain('DEBUG_STATE_CHANGED');

    const bondBeforeAbsence = recovered.pet.state.bond;
    const away = await harness.advance({ days: 7 });
    expect(away.advancedMs).toBe(7 * 24 * HOUR_MS);
    expect(away.pet.state.lastSimulatedAt).toBe(harness.clock.now().toISOString());
    expect(away.pet.state.bond).toBe(bondBeforeAbsence);
    expect(away.pet.state.happiness).toBeGreaterThanOrEqual(30);
    expect(away.pet.derived.needs.fullness).toBe('VERY_HUNGRY');

    // The long-absence pet is still recoverable through normal care once awake.
    if (away.pet.state.currentActivity === 'SLEEPING') {
      await harness.command('wake');
    }
    const meal = actionEnvelope.parse(await harness.expectOk(playerAction('FEED'))).data;
    expect(meal.status).toBe('SUCCESS');
  });

  it('advances through every preset with the real simulation', async () => {
    await harness.startBaby();
    let expectedOffset = 0;

    for (const body of [{ hours: 1 }, { hours: 6 }, { hours: 12 }, { days: 1 }, { days: 3 }, { days: 7 }]) {
      const started = Date.now();
      const result = await harness.advance(body);
      expectedOffset += result.advancedMs;

      expect(Date.now() - started).toBeLessThan(500);
      expect(result.debug.clock.offsetMs).toBe(expectedOffset);
      expect(result.pet.state.lastSimulatedAt).toBe(result.debug.clock.now);
      for (const stat of ['hunger', 'energy', 'happiness', 'bond'] as const) {
        expect(result.pet.state[stat]).toBeGreaterThanOrEqual(0);
        expect(result.pet.state[stat]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('force sleeps without counting as a player interaction, and wakes', async () => {
    await harness.startBaby();
    const before = await harness.state();

    const slept = await harness.command('sleep');
    expect(slept.status).toBe('SUCCESS');
    expect(slept.state.pet.state).toMatchObject({
      currentActivity: 'SLEEPING',
      bond: before.pet.state.bond,
      lastInteractionAt: before.pet.state.lastInteractionAt,
    });
    expect(slept.state.debug.events[0]).toMatchObject({ type: 'PET_STARTED_SLEEPING', payload: { source: 'DEBUG' } });
    expect(await harness.command('sleep')).toMatchObject({ status: 'REJECTED', reason: 'SLEEPING' });

    const woke = await harness.command('wake');
    expect(woke.status).toBe('SUCCESS');
    expect(woke.state.pet.state).toMatchObject({ currentActivity: 'IDLE', sleepStartedAt: null });
    expect(await harness.command('wake')).toMatchObject({ status: 'REJECTED', reason: 'INVALID_STATE' });
  });

  it('sets stats with clamping and records the change', async () => {
    await harness.startBaby();

    const body = await harness.expectOk({
      method: 'PATCH',
      url: '/api/v1/debug/pet/state',
      payload: { hunger: 150, energy: -5, bond: 42.5 },
    });
    const result = stateEnvelope.parse(body).data;

    expect(result.pet.state).toMatchObject({ hunger: 100, energy: 0, bond: 42.5, happiness: 70 });
    expect(result.pet.derived.needs.energy).toBe('EXHAUSTED');
    expect(result.debug.events[0]).toMatchObject({
      type: 'DEBUG_STATE_CHANGED',
      payload: { before: { hunger: 70, energy: 100, bond: 10 }, after: { hunger: 100, energy: 0, bond: 42.5 } },
    });
  });

  it('resets the pet and the debug clock so the Egg flow starts again', async () => {
    await harness.startBaby();
    await harness.advance({ days: 3 });

    const reset = successEnvelopeSchema(debugResetResultSchema).parse(
      await harness.expectOk({ method: 'POST', url: '/api/v1/debug/pet/reset' }),
    );

    expect(reset.data.reset).toBe(true);
    expect(harness.clock.offsetMs).toBe(0);
    await harness.expectError({ method: 'GET', url: '/api/v1/pet' }, 'PET_NOT_FOUND');
    await harness.expectOk({ method: 'POST', url: '/api/v1/pet' });
  });

  it('exposes debug state with clock and mood score breakdown', async () => {
    await harness.startBaby();
    await harness.expectOk({ method: 'PATCH', url: '/api/v1/debug/pet/state', payload: { energy: 8, hunger: 20 } });

    const state = await harness.state();

    expect(state.debug.clock.offsetMs).toBe(0);
    expect(state.debug.moodCandidates.map((candidate) => candidate.mood)).toEqual(['SLEEPY', 'HUNGRY', 'NEUTRAL']);
    expect(state.pet.derived.mood).toBe('SLEEPY');
  });

  it('requires a pet and valid input', async () => {
    await harness.expectError({ method: 'POST', url: '/api/v1/debug/time/advance', payload: { hours: 1 } }, 'PET_NOT_FOUND');
    expect(harness.clock.offsetMs).toBe(0);

    await harness.expectOk({ method: 'POST', url: '/api/v1/pet' });
    await harness.expectError({ method: 'POST', url: '/api/v1/debug/pet/sleep' }, 'INVALID_PET_STAGE');

    for (const payload of [{}, { hours: -1 }, { days: 400 }, { hours: 'six' }]) {
      await harness.expectError({ method: 'POST', url: '/api/v1/debug/time/advance', payload }, 'VALIDATION_ERROR');
    }
    for (const payload of [{}, { mood: 'HAPPY' }, { hunger: 'full' }]) {
      await harness.expectError({ method: 'PATCH', url: '/api/v1/debug/pet/state', payload }, 'VALIDATION_ERROR');
    }
  });
}

describe('Debug API (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  debugContract(() => ({ pets: store, events: store }));
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Debug API (PostgreSQL)', () => {
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

  debugContract(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
  }));
});

describe('debug gating', () => {
  it('does not register debug routes unless debug is enabled', async () => {
    const store = new InMemoryStore();
    const app = buildApp({
      pets: store,
      events: store,
      clock: new FakeClock(START),
      random: new SeededRandom(1),
    });

    for (const [method, url] of [
      ['GET', '/api/v1/debug/pet/state'],
      ['POST', '/api/v1/debug/time/advance'],
      ['POST', '/api/v1/debug/pet/reset'],
    ] as const) {
      const response = await app.inject(method === 'POST' ? { method, url, payload: { hours: 1 } } : { method, url });
      expect(response.statusCode).toBe(404);
      expect(apiErrorEnvelopeSchema.parse(response.json()).error.code).toBe('NOT_FOUND');
    }

    await app.close();
  });

  it('refuses debug mode when the game clock is not the debug clock', () => {
    const store = new InMemoryStore();
    const debugClock = new OffsetClock(new FakeClock(START));

    expect(() =>
      buildApp({
        pets: store,
        events: store,
        clock: new FakeClock(START),
        random: new SeededRandom(1),
        debug: { clock: debugClock },
      }),
    ).toThrow('requires the game clock to be the debug clock');
  });
});

describe('OffsetClock', () => {
  it('advances, catches up without moving backward, and resets', () => {
    const clock = new OffsetClock(new FakeClock(START));

    clock.advanceBy(HOUR_MS);
    expect(clock.now()).toEqual(new Date(START.getTime() + HOUR_MS));

    clock.catchUpTo(START);
    expect(clock.offsetMs).toBe(HOUR_MS);

    clock.catchUpTo(new Date(START.getTime() + 5 * HOUR_MS));
    expect(clock.offsetMs).toBe(5 * HOUR_MS);

    expect(() => clock.advanceBy(0)).toThrow('positive finite');
    clock.reset();
    expect(clock.now()).toEqual(START);
  });
});
