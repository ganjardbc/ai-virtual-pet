import { apiErrorEnvelopeSchema, chatHistorySchema, successEnvelopeSchema } from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom } from '@ai-virtual-pet/domain';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import { InMemoryStore } from '../persistence/memory.js';

const START = new Date('2026-09-25T08:00:00.000Z');
const minutes = (count: number) => new Date(START.getTime() + count * 60 * 1_000);
const historyEnvelope = successEnvelopeSchema(chatHistorySchema);

describe('GET /api/v1/pet/chat/history', () => {
  let store: InMemoryStore;
  let app: FastifyInstance;

  function start(historyLimit?: number): void {
    app = buildApp({
      pets: store,
      events: store,
      conversations: store,
      clock: new FakeClock(START),
      random: new SeededRandom(1),
      ...(historyLimit ? { conversationLimits: { contextWindow: 12, historyLimit } } : {}),
    });
  }

  async function history() {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' });
    expect(response.statusCode, response.body).toBe(200);
    return historyEnvelope.parse(response.json()).data;
  }

  /** Stores `turns` player messages, each with a reply carrying debug metadata. */
  async function seedTurns(turns: number): Promise<void> {
    const pet = (await store.findCurrent())?.pet;
    const conversation = await store.getOrCreateForPet({
      id: 'conversation-1',
      petId: pet?.id ?? '',
      createdAt: START,
      updatedAt: START,
    });

    for (let turn = 1; turn <= turns; turn += 1) {
      const user = await store.appendMessage(conversation.id, {
        role: 'USER',
        content: `pesan ${turn}`,
        clientMessageId: `turn-${turn}`,
        createdAt: minutes(turn * 2),
      });
      await store.appendMessage(conversation.id, {
        role: 'ASSISTANT',
        content: `balasan ${turn}`,
        replyToMessageId: user.id,
        metadata: { intent: 'TALK', intentConfidence: 0.9, inputTokens: 120, provider: 'openai-compatible' },
        createdAt: minutes(turn * 2 + 1),
      });
    }
  }

  beforeEach(async () => {
    store = new InMemoryStore();
    start();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports PET_NOT_FOUND before a pet exists', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' });

    expect(response.statusCode).toBe(404);
    expect(apiErrorEnvelopeSchema.parse(response.json()).error.code).toBe('PET_NOT_FOUND');
  });

  it('returns an empty history without creating a conversation', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    const petId = (await store.findCurrent())?.pet.id ?? '';

    expect(await history()).toEqual({ messages: [] });
    expect(await store.findForPet(petId)).toBeNull();
  });

  it('returns messages oldest first with only visible fields', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    await seedTurns(1);

    const { messages } = await history();

    expect(messages).toEqual([
      { id: 1, role: 'USER', content: 'pesan 1', createdAt: minutes(2).toISOString() },
      { id: 2, role: 'ASSISTANT', content: 'balasan 1', createdAt: minutes(3).toISOString() },
    ]);
  });

  it('never exposes turn debug metadata or idempotency keys', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    await seedTurns(2);

    const response = await app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' });

    expect(response.body).not.toMatch(/intent|Confidence|Tokens|provider|clientMessageId|turn-1|replyTo/);
  });

  it('limits history to the latest 50 messages by default', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    await seedTurns(30);

    const { messages } = await history();

    expect(messages).toHaveLength(50);
    expect(messages[0]?.content).toBe('pesan 6');
    expect(messages.at(-1)?.content).toBe('balasan 30');
  });

  it('uses a configured history limit', async () => {
    await app.close();
    start(4);
    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    await seedTurns(5);

    expect((await history()).messages.map((message) => message.content)).toEqual([
      'pesan 4',
      'balasan 4',
      'pesan 5',
      'balasan 5',
    ]);
  });
});
