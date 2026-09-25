import { randomUUID } from 'node:crypto';

import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  chatHistorySchema,
  petSnapshotSchema,
  successEnvelopeSchema,
} from '@ai-virtual-pet/contracts';
import { createEgg, createInitialPetState, hatchPet, type PersonalityState } from '@ai-virtual-pet/domain';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from './db/client.js';
import { DrizzleConversationRepository, DrizzleEventRepository, DrizzlePetRepository } from './persistence/drizzle.js';
import { InMemoryStore } from './persistence/memory.js';
import { CHAT_START, ChatHarness, type Repositories } from './testing/chat-harness.js';
import { fakeOutcome } from './testing/fake-ai-provider.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from './testing/database.js';

const historyEnvelope = successEnvelopeSchema(chatHistorySchema);
const snapshotEnvelope = successEnvelopeSchema(petSnapshotSchema);
const actionEnvelope = successEnvelopeSchema(actionResultSchema);

/** Prototype 0.2 integration hardening (plan Phase 11, Tasks 11.1–11.9). */
function hardeningSuite(getRepositories: () => Repositories): void {
  let chat: ChatHarness;

  beforeEach(async () => {
    chat = new ChatHarness(getRepositories());
  });

  afterEach(async () => {
    await chat.app.close();
  });

  async function history(): Promise<{ role: string; content: string }[]> {
    const response = await chat.app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' });
    expect(response.statusCode, response.body).toBe(200);
    return historyEnvelope.parse(response.json()).data.messages;
  }

  async function personality(): Promise<PersonalityState> {
    const current = await getRepositories().pets.findCurrent();
    expect(current?.personality).toBeDefined();
    return current?.personality as PersonalityState;
  }

  it('11.1 runs egg → chat Play → personality → reload → same personality and conversation', async () => {
    await chat.startBaby();
    chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.value({ message: 'Ayo main!' }) });

    const turn = await chat.chat('main yuk', randomUUID());
    expect(turn.action).toMatchObject({ type: 'PLAY', status: 'SUCCESS' });
    const playfulAfterPlay = (await personality()).traits.playful;
    expect((await history()).map((message) => message.role)).toEqual(['USER', 'ASSISTANT']);

    // Reload: a new API instance over the same storage keeps both personality and conversation.
    await chat.app.close();
    const restarted = new ChatHarness(getRepositories());
    try {
      expect((await personality()).traits.playful).toBe(playfulAfterPlay);
      const messages = historyEnvelope.parse(
        (await restarted.app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' })).json(),
      ).data.messages;
      expect(messages.map((message) => [message.role, message.content])).toEqual([
        ['USER', 'main yuk'],
        ['ASSISTANT', 'Ayo main!'],
      ]);
    } finally {
      await restarted.app.close();
    }
  });

  it('11.3 keeps simulation, care buttons, and debug time travel working with AI disabled', async () => {
    const offline = new ChatHarness(getRepositories(), { ai: null });
    try {
      await offline.startBaby();
      await offline.expectError('Hai', 'AI_UNAVAILABLE');

      const fed = await offline.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } });
      expect(fed.statusCode).toBe(200);
      const fedSnapshot = actionEnvelope.parse(fed.json()).data;

      const played = await offline.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'PLAY' } });
      expect(played.statusCode).toBe(200);
      const playedSnapshot = actionEnvelope.parse(played.json()).data;

      const slept = await offline.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'SLEEP' } });
      expect(slept.statusCode).toBe(200);
      expect(actionEnvelope.parse(slept.json()).data.pet.state.currentActivity).toBe('SLEEPING');

      const advanced = await offline.app.inject({ method: 'POST', url: '/api/v1/debug/time/advance', payload: { hours: 1 } });
      expect(advanced.statusCode).toBe(200);

      const after = snapshotEnvelope.parse(
        (await offline.app.inject({ method: 'GET', url: '/api/v1/pet' })).json(),
      ).data;
      // Simulation decayed hunger while asleep and sleep recovered the Energy Play spent.
      expect(after.state.hunger).toBeLessThan(fedSnapshot.pet.state.hunger);
      expect(after.state.energy).toBeGreaterThan(playedSnapshot.pet.state.energy);
    } finally {
      await offline.app.close();
    }
  });

  it('11.4 rejects an engine-rejected chat Play without recording PET_PLAYED', async () => {
    await chat.startBaby();
    await chat.setStats({ energy: 5 });
    chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.value({ message: 'Aku capek…' }) });

    const turn = await chat.chat('main yuk', randomUUID());

    expect(turn.action).toMatchObject({ type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' });
    expect(await chat.events('PET_PLAYED')).toHaveLength(0);
    expect(await chat.events('ACTION_REJECTED')).toHaveLength(1);
    expect(turn.pet.state.currentActivity).toBe('IDLE');
  });

  it('11.4 records PET_FED only when the engine accepts the chat Feed, matching the reply truth', async () => {
    await chat.startBaby();
    await chat.setStats({ hunger: 40 });
    chat.turn('FEED', { classification: 'CARE', reply: fakeOutcome.value({ message: 'Makasih!' }) });

    const turn = await chat.chat('aku lapar', randomUUID());

    expect(turn.action).toMatchObject({ type: 'FEED', status: 'SUCCESS' });
    expect(turn.pet.state.hunger).toBe(65);
    expect(await chat.events('PET_FED')).toHaveLength(1);
    expect(chat.systemPrompt()).toContain('Fullness:');
  });

  it('11.4 uses no AI-invented state: the reply prompt carries the engine result, not the model', async () => {
    await chat.startBaby();
    chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.value({ message: 'Yeay!' }) });

    const turn = await chat.chat('main yuk', randomUUID());

    expect(turn.pet.state.happiness).toBeGreaterThan(70);
    // The character context is rebuilt from what was saved, so it names the real activity and mood.
    expect(chat.systemPrompt()).toContain('Reality (authoritative)');
    expect(chat.systemPrompt()).toContain('Current activity:');
  });

  it('11.5 applies a duplicated submission once', async () => {
    await chat.startBaby();
    chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.value({ message: 'Ayo!' }) });

    const duplicateId = randomUUID();
    const responses = await Promise.all([chat.send('main yuk', duplicateId), chat.send('main yuk', duplicateId)]);
    const codes = responses.map((response) => response.statusCode);
    expect(codes.every((code) => code === 200 || code === 409), JSON.stringify(codes)).toBe(true);

    const conflict = responses.find((response) => response.statusCode === 409);
    if (conflict) {
      expect(apiErrorEnvelopeSchema.parse(conflict.body).error.code).toBe('CHAT_IN_PROGRESS');
    }

    expect(await chat.events('PET_PLAYED')).toHaveLength(1);
    expect((await chat.stored()).filter((message) => message.role === 'USER')).toHaveLength(1);
  });

  it('11.5 applies a duplicated TALK once, without double Bond or personality', async () => {
    await chat.startBaby();
    const before = (await personality()).traits;
    chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.value({ message: 'Aku sayang kamu!' }) });

    const duplicateId = randomUUID();
    const responses = await Promise.all([chat.send('hai', duplicateId), chat.send('hai', duplicateId)]);
    expect(responses.every((response) => response.statusCode === 200 || response.statusCode === 409)).toBe(true);

    expect(await chat.events('PET_TALKED')).toHaveLength(1);
    const after = (await personality()).traits;
    // The AFFECTION signal raises Clingy once (+0.003), not twice.
    expect(after.clingy - before.clingy).toBeCloseTo(0.003, 6);
  });

  it('11.6 keeps a long conversation bounded in the AI context', async () => {
    await chat.startBaby();

    for (let turn = 1; turn <= 15; turn += 1) {
      chat.turn('TALK', { classification: 'CASUAL', reply: fakeOutcome.value({ message: `balasan ${turn}` }) });
      await chat.chat(`pesan ${turn}`, randomUUID());
    }

    expect(await history()).toHaveLength(30);

    const lastRequest = chat.ai.requestsOf('RESPONSE').at(-1);
    expect(lastRequest).toBeDefined();
    // system + bounded recent window (default max 12) + the current player message.
    expect(lastRequest?.messages.length).toBeLessThanOrEqual(1 + 12 + 1);

    const sentContents = lastRequest?.messages.map((message) => message.content) ?? [];
    expect(sentContents).toContain('pesan 15');
    // The oldest turns are outside the window, so they never reach the model.
    expect(sentContents).not.toContain('pesan 1');
  });

  it('11.7 uses at most two AI calls per chat turn', async () => {
    await chat.startBaby();
    chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.value({ message: 'Ayo!' }) });

    await chat.chat('main yuk', randomUUID());

    expect(chat.ai.requestsOf('INTERPRETATION')).toHaveLength(1);
    expect(chat.ai.requestsOf('RESPONSE')).toHaveLength(1);
  });

  it('11.9 lets a pre-personality pet talk, creating and persisting its personality', async () => {
    const repositories = getRepositories();
    const egg = createEgg({ id: 'legacy-pet', createdAt: CHAT_START });
    const baby = hatchPet(egg, CHAT_START);
    await repositories.pets.create(baby, createInitialPetState(baby.id, CHAT_START), []);
    expect((await repositories.pets.findCurrent())?.personality).toBeUndefined();

    const legacy = new ChatHarness(repositories);
    try {
      legacy.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.value({ message: 'Hai kamu!' }) });
      const turn = await legacy.chat('halo', randomUUID());

      expect(turn.message.content).toBe('Hai kamu!');
      expect((await repositories.pets.findCurrent())?.personality).toBeDefined();
    } finally {
      await legacy.app.close();
    }
  });
}

describe('Prototype 0.2 hardening (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  hardeningSuite(() => ({ pets: store, events: store, conversations: store }));
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Prototype 0.2 hardening (PostgreSQL)', () => {
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

  hardeningSuite(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
    conversations: new DrizzleConversationRepository(connection.db),
  }));
});
