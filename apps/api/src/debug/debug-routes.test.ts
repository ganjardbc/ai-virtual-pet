import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  debugAdvanceTimeResultSchema,
  debugAiSchema,
  debugCommandResultSchema,
  debugResetResultSchema,
  debugStateSchema,
  personalityPresetSchema,
  successEnvelopeSchema,
  type ApiErrorCode,
  type DebugAdvanceTimeResult,
  type DebugAi,
  type DebugCommandResult,
  type DebugState,
} from '@ai-virtual-pet/contracts';
import { FakeClock, PERSONALITY_PRESET_NAMES, SeededRandom } from '@ai-virtual-pet/domain';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { DatabaseConnection } from '../db/client.js';
import {
  conversations as conversationsTable,
  events as eventsTable,
  messages as messagesTable,
  petPersonalities,
  petStates as petStatesTable,
  pets as petsTable,
} from '../db/schema.js';
import { DrizzleConversationRepository, DrizzleEventRepository, DrizzlePetRepository } from '../persistence/drizzle.js';
import { InMemoryStore } from '../persistence/memory.js';
import type { ConversationRepository, EventRepository, PetRepository } from '../persistence/repositories.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';
import { OffsetClock } from './offset-clock.js';

const HOUR_MS = 60 * 60 * 1_000;
const START = new Date('2026-09-25T08:00:00.000Z');

const stateEnvelope = successEnvelopeSchema(debugStateSchema);
const advanceEnvelope = successEnvelopeSchema(debugAdvanceTimeResultSchema);
const commandEnvelope = successEnvelopeSchema(debugCommandResultSchema);
const aiEnvelope = successEnvelopeSchema(debugAiSchema);
const actionEnvelope = successEnvelopeSchema(actionResultSchema);

interface DebugHarness {
  readonly app: FastifyInstance;
  readonly clock: OffsetClock;
  readonly conversations: ConversationRepository;
  request(options: InjectOptions): Promise<{ statusCode: number; body: unknown }>;
  expectOk(options: InjectOptions): Promise<unknown>;
  expectError(options: InjectOptions, code: ApiErrorCode): Promise<void>;
  state(): Promise<DebugState>;
  advance(body: Record<string, unknown>): Promise<DebugAdvanceTimeResult>;
  command(path: 'sleep' | 'wake'): Promise<DebugCommandResult>;
  ai(): Promise<DebugAi>;
  setPersonality(body: Record<string, unknown>): Promise<DebugAi>;
  startBaby(): Promise<void>;
}

function createDebugHarness(
  pets: PetRepository,
  events: EventRepository,
  conversations: ConversationRepository,
): DebugHarness {
  const clock = new OffsetClock(new FakeClock(START));
  const app = buildApp({ pets, events, conversations, clock, random: new SeededRandom(5), debug: { clock } });

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
    conversations,
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
    async ai() {
      return aiEnvelope.parse(await expectOk({ method: 'GET', url: '/api/v1/debug/ai' })).data;
    },
    async setPersonality(body) {
      const response = await expectOk({ method: 'PATCH', url: '/api/v1/debug/personality', payload: body });
      return aiEnvelope.parse(response).data;
    },
    async startBaby() {
      await expectOk({ method: 'POST', url: '/api/v1/pet' });
      await expectOk({ method: 'POST', url: '/api/v1/pet/hatch' });
    },
  };
}

const playerAction = (type: string) => ({ method: 'POST', url: '/api/v1/pet/actions', payload: { type } }) as const;

function debugContract(
  getRepositories: () => {
    pets: PetRepository;
    events: EventRepository;
    conversations: ConversationRepository;
  },
): void {
  let harness: DebugHarness;

  beforeEach(() => {
    const { pets, events, conversations } = getRepositories();
    harness = createDebugHarness(pets, events, conversations);
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

  it('exposes personality, daily deltas, and context without any AI', async () => {
    await harness.startBaby();

    const initial = await harness.ai();
    expect(initial.personality).not.toBeNull();
    expect(initial.personality?.profile.primaryTrait).toMatch(/^(PLAYFUL|CURIOUS|SHY|INDEPENDENT|CLINGY)$/);
    expect(initial.personality?.daily).toMatchObject({
      day: null,
      capPerTrait: 0.03,
      deltas: { playful: 0, curious: 0, shy: 0, independent: 0, clingy: 0 },
    });
    expect(initial.lastTurn).toBeNull();
    expect(initial.context).toMatchObject({ relationship: 'LOW', recentMessageCount: 0, recentEventCount: 0 });
    expect(initial.context?.state.currentActivity).toBe('IDLE');

    await harness.expectOk(playerAction('PLAY'));
    const afterPlay = await harness.ai();

    expect(afterPlay.personality?.daily.day).toBe('2026-09-25');
    expect(afterPlay.personality?.daily.deltas.playful).toBeGreaterThan(0);
    expect(afterPlay.context?.recentEventCount).toBeGreaterThan(0);
  });

  it('sets personality from a preset and from explicit traits', async () => {
    await harness.startBaby();

    const preset = await harness.setPersonality({ preset: 'HIGH_CLINGY' });
    expect(preset.personality?.traits.clingy).toBe(0.8);
    expect(preset.personality?.profile).toMatchObject({
      primaryTrait: 'CLINGY',
      strength: 'STRONG',
      socialStyle: 'CLINGY',
    });

    const explicit = await harness.setPersonality({ playful: 0.8, curious: 0.9 });
    expect(explicit.personality?.traits).toMatchObject({ playful: 0.8, curious: 0.9 });
    expect(explicit.personality?.profile.dominantTraits).toEqual(expect.arrayContaining(['PLAYFUL', 'CURIOUS']));

    const clamped = await harness.setPersonality({ playful: 5, curious: -1 });
    expect(clamped.personality?.traits).toMatchObject({ playful: 0.95, curious: 0.05 });

    const state = await harness.state();
    expect(state.debug.events.find((event) => event.type === 'PERSONALITY_CHANGED')?.payload).toMatchObject({
      reason: 'DEBUG',
    });
  });

  it('normalizes the independent/clingy pair when both are set, without touching daily deltas', async () => {
    await harness.startBaby();

    const result = await harness.setPersonality({ independent: 0.95, clingy: 0.5 });
    const traits = result.personality!.traits;

    expect(traits.independent + traits.clingy).toBeLessThanOrEqual(1.4 + 1e-9);
    expect(result.personality?.daily.deltas).toEqual({ playful: 0, curious: 0, shy: 0, independent: 0, clingy: 0 });
  });

  it('validates personality requests and requires a hatched pet', async () => {
    await harness.expectError({ method: 'GET', url: '/api/v1/debug/ai' }, 'PET_NOT_FOUND');
    await harness.expectError(
      { method: 'PATCH', url: '/api/v1/debug/personality', payload: { preset: 'BALANCED' } },
      'PET_NOT_FOUND',
    );

    await harness.expectOk({ method: 'POST', url: '/api/v1/pet' });
    await harness.expectError(
      { method: 'PATCH', url: '/api/v1/debug/personality', payload: { preset: 'BALANCED' } },
      'INVALID_PET_STAGE',
    );

    await harness.expectOk({ method: 'POST', url: '/api/v1/pet/hatch' });
    for (const payload of [{}, { preset: 'BALANCED', playful: 0.5 }, { brave: 0.5 }, { preset: 'NOPE' }]) {
      await harness.expectError({ method: 'PATCH', url: '/api/v1/debug/personality', payload }, 'VALIDATION_ERROR');
    }
  });

  it('reports the latest AI turn from the stored reply metadata', async () => {
    await harness.startBaby();
    const petId = (await harness.state()).pet.pet.id;
    const now = harness.clock.now();
    const conversation = await harness.conversations.getOrCreateForPet({
      id: 'conversation-debug-ai',
      petId,
      createdAt: now,
      updatedAt: now,
    });
    const user = await harness.conversations.appendMessage(conversation.id, {
      role: 'USER',
      content: 'main yuk',
      clientMessageId: 'turn-debug-ai',
      createdAt: now,
    });
    await harness.conversations.appendMessage(conversation.id, {
      role: 'ASSISTANT',
      content: 'Ayo main!',
      replyToMessageId: user.id,
      createdAt: now,
      metadata: {
        intent: 'PLAY',
        intentConfidence: 0.9,
        classification: 'PLAYFUL',
        action: { type: 'PLAY', status: 'SUCCESS' },
        bondDelta: 1,
        fallbackUsed: false,
        provider: '9router',
        model: 'test-model',
        latencyMs: 1200,
        inputTokens: 300,
        outputTokens: 40,
      },
    });

    const ai = await harness.ai();

    expect(ai.lastTurn).toMatchObject({
      intent: 'PLAY',
      confidence: 0.9,
      classification: 'PLAYFUL',
      action: { type: 'PLAY', status: 'SUCCESS' },
      bondDelta: 1,
      fallbackUsed: false,
      provider: '9router',
      model: 'test-model',
      latencyMs: 1200,
      inputTokens: 300,
      outputTokens: 40,
    });
    expect(ai.lastTurn?.occurredAt).toBe(now.toISOString());
    expect(ai.context?.recentMessageCount).toBe(2);
  });
}

describe('Debug API (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  debugContract(() => ({ pets: store, events: store, conversations: store }));
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
    conversations: new DrizzleConversationRepository(connection.db),
  }));

  it('reset leaves no orphan personality, conversation, or message rows (Task 10.8)', async () => {
    const pets = new DrizzlePetRepository(connection.db);
    const events = new DrizzleEventRepository(connection.db);
    const conversations = new DrizzleConversationRepository(connection.db);
    const clock = new OffsetClock(new FakeClock(START));
    const app = buildApp({ pets, events, conversations, clock, random: new SeededRandom(5), debug: { clock } });

    try {
      await app.inject({ method: 'POST', url: '/api/v1/pet' });
      await app.inject({ method: 'POST', url: '/api/v1/pet/hatch' });
      await app.inject({ method: 'PATCH', url: '/api/v1/debug/personality', payload: { preset: 'HIGH_PLAYFUL' } });

      const current = await pets.findCurrent();
      const conversation = await conversations.getOrCreateForPet({
        id: 'conversation-reset',
        petId: current!.pet.id,
        createdAt: START,
        updatedAt: START,
      });
      const user = await conversations.appendMessage(conversation.id, {
        role: 'USER',
        content: 'hai',
        clientMessageId: 'turn-reset',
        createdAt: START,
      });
      await conversations.appendMessage(conversation.id, {
        role: 'ASSISTANT',
        content: 'halo',
        replyToMessageId: user.id,
        createdAt: START,
      });

      expect(await connection.db.$count(petPersonalities)).toBe(1);
      expect(await connection.db.$count(conversationsTable)).toBe(1);
      expect(await connection.db.$count(messagesTable)).toBe(2);

      await app.inject({ method: 'POST', url: '/api/v1/debug/pet/reset' });

      for (const [label, table] of [
        ['pets', petsTable],
        ['pet_states', petStatesTable],
        ['pet_personalities', petPersonalities],
        ['events', eventsTable],
        ['conversations', conversationsTable],
        ['messages', messagesTable],
      ] as const) {
        expect(await connection.db.$count(table), label).toBe(0);
      }
    } finally {
      await app.close();
    }
  });
});

describe('debug gating', () => {
  it('does not register debug routes unless debug is enabled', async () => {
    const store = new InMemoryStore();
    const app = buildApp({
      pets: store,
      events: store,
      conversations: store,
      clock: new FakeClock(START),
      random: new SeededRandom(1),
    });

    for (const [method, url] of [
      ['GET', '/api/v1/debug/pet/state'],
      ['GET', '/api/v1/debug/ai'],
      ['POST', '/api/v1/debug/time/advance'],
      ['PATCH', '/api/v1/debug/personality'],
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
        conversations: store,
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

describe('debug personality presets', () => {
  it('keeps the contract enum and the domain presets in sync', () => {
    expect([...personalityPresetSchema.options].sort()).toEqual([...PERSONALITY_PRESET_NAMES].sort());
  });
});

describe('debug AI context window', () => {
  it('mirrors the chat context window rather than the history window', async () => {
    const store = new InMemoryStore();
    const clock = new OffsetClock(new FakeClock(START));
    const app = buildApp({
      pets: store,
      events: store,
      conversations: store,
      clock,
      random: new SeededRandom(5),
      conversationLimits: { contextWindow: 2, historyLimit: 50 },
      debug: { clock },
    });

    try {
      await app.inject({ method: 'POST', url: '/api/v1/pet' });
      await app.inject({ method: 'POST', url: '/api/v1/pet/hatch' });
      const petId = (await store.findCurrent())!.pet.id;
      const conversation = await store.getOrCreateForPet({ id: 'conversation-window', petId, createdAt: START, updatedAt: START });

      for (let turn = 1; turn <= 3; turn += 1) {
        await store.appendMessage(conversation.id, {
          role: 'USER',
          content: `m${turn}`,
          clientMessageId: `turn-${turn}`,
          createdAt: new Date(START.getTime() + turn * 60_000),
        });
      }

      // Chat lists contextWindow + 1 messages and lets the context builder keep its own default;
      // debug must not slice down to the context window.
      const body = successEnvelopeSchema(debugAiSchema).parse(
        (await app.inject({ method: 'GET', url: '/api/v1/debug/ai' })).json(),
      ).data;

      expect(body.context?.recentMessageCount).toBe(3);
    } finally {
      await app.close();
    }
  });
});
