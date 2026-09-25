import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  debugCommandResultSchema,
  debugStateSchema,
  petSnapshotSchema,
  petActivitySchema,
  successEnvelopeSchema,
  type ActionResult,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom } from '@ai-virtual-pet/domain';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';
import type { DatabaseConnection } from './db/client.js';
import { OffsetClock } from './debug/offset-clock.js';
import { DrizzleEventRepository, DrizzlePetRepository } from './persistence/drizzle.js';
import { InMemoryStore } from './persistence/memory.js';
import type { EventRepository, PetRepository } from './persistence/repositories.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from './testing/database.js';

const HOUR_MS = 60 * 60 * 1_000;
const MINUTE_MS = 60 * 1_000;
const START = new Date('2026-09-25T08:00:00.000Z');

const snapshotEnvelope = successEnvelopeSchema(petSnapshotSchema);
const actionEnvelope = successEnvelopeSchema(actionResultSchema);
const debugStateEnvelope = successEnvelopeSchema(debugStateSchema);
const debugCommandEnvelope = successEnvelopeSchema(debugCommandResultSchema);

interface Repositories {
  readonly pets: PetRepository;
  readonly events: EventRepository;
}

/** A running API over given repositories, with a controllable clock (debug harness enabled). */
class Client {
  readonly clock: OffsetClock;
  readonly app: FastifyInstance;

  constructor(repositories: Repositories, start = START, seed = 3) {
    this.clock = new OffsetClock(new FakeClock(start));
    this.app = buildApp({ ...repositories, clock: this.clock, random: new SeededRandom(seed), debug: { clock: this.clock } });
  }

  advance(ms: number): void {
    this.clock.advanceBy(ms);
  }

  async get(): Promise<PetSnapshot> {
    const response = await this.app.inject({ method: 'GET', url: '/api/v1/pet' });
    expect(response.statusCode, response.body).toBe(200);
    return snapshotEnvelope.parse(response.json()).data;
  }

  async act(type: 'FEED' | 'PLAY' | 'SLEEP'): Promise<ActionResult> {
    const response = await this.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type } });
    expect(response.statusCode, response.body).toBe(200);
    return actionEnvelope.parse(response.json()).data;
  }

  async startNamedBaby(name = 'Momo'): Promise<PetSnapshot> {
    await this.app.inject({ method: 'POST', url: '/api/v1/pet' });
    await this.app.inject({ method: 'POST', url: '/api/v1/pet/hatch' });
    const response = await this.app.inject({ method: 'PATCH', url: '/api/v1/pet/name', payload: { name } });
    return snapshotEnvelope.parse(response.json()).data;
  }

  async setStats(stats: Record<string, number>): Promise<PetSnapshot> {
    const response = await this.app.inject({ method: 'PATCH', url: '/api/v1/debug/pet/state', payload: stats });
    expect(response.statusCode, response.body).toBe(200);
    return debugStateEnvelope.parse(response.json()).data.pet;
  }

  async wakeIfSleeping(): Promise<void> {
    const response = await this.app.inject({ method: 'POST', url: '/api/v1/debug/pet/wake' });
    debugCommandEnvelope.parse(response.json());
  }
}

function expectValidState(snapshot: PetSnapshot): void {
  for (const stat of ['hunger', 'energy', 'happiness', 'bond'] as const) {
    expect(snapshot.state[stat]).toBeGreaterThanOrEqual(0);
    expect(snapshot.state[stat]).toBeLessThanOrEqual(100);
  }
  expect(petActivitySchema.safeParse(snapshot.state.currentActivity).success).toBe(true);
  expect(snapshot.state.sleepStartedAt === null).toBe(snapshot.state.currentActivity !== 'SLEEPING');
}

function integrationSuite(getRepositories: () => Repositories, reopen: () => Promise<Repositories>): void {
  let client: Client;

  beforeEach(() => {
    client = new Client(getRepositories());
  });

  it('8.1 runs the full lifecycle and presents a return after elapsed time', async () => {
    const named = await client.startNamedBaby();
    expect(named.pet).toMatchObject({ stage: 'BABY', name: 'Momo' });

    client.advance(24 * HOUR_MS);
    expect((await client.act('FEED')).status).toBe('SUCCESS');
    expect((await client.act('PLAY')).status).toBe('SUCCESS');
    const slept = await client.act('SLEEP');
    expect(slept.pet.state.currentActivity).toBe('SLEEPING');

    client.advance(20 * HOUR_MS);
    const returned = await client.get();
    const types = returned.recentEvents.map((event) => event.type);

    expectValidState(returned);
    expect(returned.state.currentActivity).not.toBe('SLEEPING');
    expect(returned.state.energy).toBeGreaterThan(slept.pet.state.energy);
    expect(returned.state.lastSimulatedAt).toBe(client.clock.now().toISOString());
    const history = await getRepositories().events.listRecent(returned.pet.id, { limit: 1_000 });
    expect(history.map((event) => event.type)).toContain('PET_WOKE_UP');
    expect(types.some((type) => type === 'PET_ACTIVITY_CHANGED')).toBe(true);
  });

  it('8.2/8.3 keeps the same pet and state across a new API instance and connection', async () => {
    await client.startNamedBaby();
    client.advance(24 * HOUR_MS);
    await client.act('FEED');
    const before = await client.get();
    await client.app.close();

    const restarted = new Client(await reopen(), client.clock.now(), 99);
    const after = await restarted.get();

    expect(after).toEqual(before);
    await restarted.app.close();
  });

  it('8.4 survives +7 days: alive, Bond kept, valid, recoverable, reasonable history', async () => {
    await client.startNamedBaby();
    await client.setStats({ bond: 40 });

    client.advance(7 * 24 * HOUR_MS);
    const away = await client.get();
    const { events } = getRepositories();
    const history = await events.listRecent(away.pet.id, { limit: 1_000 });

    expectValidState(away);
    expect(away.pet.stage).toBe('BABY');
    expect(away.state.bond).toBe(40);
    expect(away.state.happiness).toBeGreaterThanOrEqual(30);
    expect(away.derived.needs.fullness).toBe('VERY_HUNGRY');
    expect(history.length).toBeLessThan(80);

    await client.wakeIfSleeping();
    for (let meal = 0; meal < 3; meal += 1) {
      expect((await client.act('FEED')).status).toBe('SUCCESS');
    }
    await client.act('SLEEP');
    client.advance(8 * HOUR_MS);
    const recovered = await client.get();
    expect(recovered.derived.needs.fullness).not.toMatch(/HUNGRY/);
    expect(recovered.state.energy).toBeGreaterThan(80);
  });

  it('8.5 handles repeated Feed and Play without overflow, with diminishing and rejection', async () => {
    await client.startNamedBaby();
    await client.setStats({ hunger: 20 });

    const feeds = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      feeds.push(await client.act('FEED'));
    }
    expect(feeds.map((result) => result.status)).toEqual([
      'SUCCESS', 'SUCCESS', 'SUCCESS', 'REJECTED', 'REJECTED', 'REJECTED', 'REJECTED', 'REJECTED',
    ]);
    // 20 → 45 → 70 → 95, then TOO_FULL (Hunger ≥ 90) without further change.
    expect(feeds.at(-1)).toMatchObject({ status: 'REJECTED', reason: 'TOO_FULL' });
    expect(feeds.at(-1)?.pet.state.hunger).toBe(95);

    const plays = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      plays.push(await client.act('PLAY'));
    }
    const bondGains = plays.flatMap((result) => (result.status === 'SUCCESS' ? [result.changes.bond] : []));
    expect(bondGains.slice(0, 4)).toEqual([1, 0.75, 0.5, 0.25]);
    expect(plays.at(-1)).toMatchObject({ status: 'REJECTED', reason: 'TOO_TIRED' });
    expectValidState(plays.at(-1)?.pet as PetSnapshot);
  });

  it('8.5 applies rapid concurrent Feeds without lost updates', async () => {
    await client.startNamedBaby();
    const before = await client.setStats({ hunger: 0 });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        client.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } }),
      ),
    );
    const succeeded = responses.filter((response) => response.statusCode === 200);
    const conflicted = responses.filter((response) => response.statusCode === 409);
    const after = await client.get();

    // Every request either applied on top of the previous commit or reported a conflict.
    expect(succeeded.length + conflicted.length).toBe(5);
    for (const response of conflicted) {
      expect(apiErrorEnvelopeSchema.parse(response.json()).error.code).toBe('PET_STATE_CONFLICT');
    }
    const sequentialHunger = [25, 50, 75, 85, 95];
    expect(after.state.hunger).toBe(sequentialHunger[succeeded.length - 1]);
    expect(after.pet.version).toBe(before.pet.version + succeeded.length);
    expect(after.recentEvents.filter((event) => event.type === 'PET_FED')).toHaveLength(succeeded.length);
  });

  describe('8.6 sleep boundaries', () => {
    const wakeEvent = (snapshot: PetSnapshot) => snapshot.recentEvents.find((event) => event.type === 'PET_WOKE_UP');

    it('sleeps at low Energy until restored, waking at the exact recovery time', async () => {
      await client.startNamedBaby();
      await client.setStats({ energy: 5 });
      const slept = await client.act('SLEEP');

      client.advance(7 * HOUR_MS);
      expect((await client.get()).state.currentActivity).toBe('SLEEPING');

      client.advance(1 * HOUR_MS);
      const woke = await client.get();
      const sleepStart = Date.parse(slept.pet.state.sleepStartedAt as string);

      expect(woke.state.currentActivity).not.toBe('SLEEPING');
      expect(wakeEvent(woke)).toMatchObject({
        occurredAt: new Date(sleepStart + 7.5 * HOUR_MS).toISOString(),
        payload: { cause: 'ENERGY_RESTORED' },
      });
    });

    it('keeps a nearly rested pet asleep for the minimum duration', async () => {
      await client.startNamedBaby();
      await client.setStats({ energy: 98 });
      await client.act('SLEEP');

      client.advance(15 * MINUTE_MS);
      expect((await client.get()).state.currentActivity).toBe('SLEEPING');

      client.advance(20 * MINUTE_MS);
      const woke = await client.get();
      expect(woke.state.currentActivity).not.toBe('SLEEPING');
      expect(woke.state.energy).toBeLessThanOrEqual(100);
    });

    it('splits one request that spans past auto-wake into sleep and awake time', async () => {
      await client.startNamedBaby();
      await client.setStats({ energy: 50, hunger: 100 });
      const slept = await client.act('SLEEP');

      client.advance(10 * HOUR_MS);
      const after = await client.get();
      const sleepStart = Date.parse(slept.pet.state.sleepStartedAt as string);

      expect(wakeEvent(after)?.occurredAt).toBe(new Date(sleepStart + 3.75 * HOUR_MS).toISOString());
      expect(after.state.energy).toBeLessThan(95);
      expect(after.state.energy).toBeGreaterThan(80);
      // 3.75h asleep at −1/h, 6.25h awake at −2/h.
      expect(after.state.hunger).toBeCloseTo(100 - 3.75 - 12.5, 6);
    });

    it('handles a long elapsed request that started asleep', async () => {
      await client.startNamedBaby();
      await client.setStats({ energy: 5 });
      await client.act('SLEEP');

      client.advance(3 * 24 * HOUR_MS);
      const after = await client.get();

      expectValidState(after);
      expect(after.state.lastSimulatedAt).toBe(client.clock.now().toISOString());
    });
  });
}

describe('Integration (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  integrationSuite(
    () => ({ pets: store, events: store }),
    async () => ({ pets: store, events: store }),
  );
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Integration (PostgreSQL)', () => {
  let connection: DatabaseConnection;
  const extraConnections: DatabaseConnection[] = [];

  beforeAll(async () => {
    connection = await openTestDatabase(databaseUrl as string);
  });

  beforeEach(async () => {
    await truncateAll(connection);
  });

  afterAll(async () => {
    await Promise.all([connection, ...extraConnections].map((c) => c?.close()));
  });

  integrationSuite(
    () => ({ pets: new DrizzlePetRepository(connection.db), events: new DrizzleEventRepository(connection.db) }),
    async () => {
      // A separate connection pool stands in for a restarted API process.
      const reopened = await openTestDatabase(databaseUrl as string);
      extraConnections.push(reopened);
      return { pets: new DrizzlePetRepository(reopened.db), events: new DrizzleEventRepository(reopened.db) };
    },
  );
});
