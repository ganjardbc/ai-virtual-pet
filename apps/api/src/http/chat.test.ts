import { randomUUID } from 'node:crypto';

import { chatHistorySchema, successEnvelopeSchema } from '@ai-virtual-pet/contracts';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from '../db/client.js';
import { DrizzleConversationRepository, DrizzleEventRepository, DrizzlePetRepository } from '../persistence/drizzle.js';
import { InMemoryStore } from '../persistence/memory.js';
import { ChatHarness, type Repositories } from '../testing/chat-harness.js';
import { fakeOutcome } from '../testing/fake-ai-provider.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';

const historyEnvelope = successEnvelopeSchema(chatHistorySchema);

function chatSuite(getRepositories: () => Repositories): void {
  let chat: ChatHarness;

  beforeEach(async () => {
    chat = new ChatHarness(getRepositories());
    await chat.startBaby();
  });

  afterEach(async () => {
    await chat.app.close();
  });

  describe('canonical turns', () => {
    it('talks without any action, using the pet reality and recent conversation', async () => {
      chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.value({ message: 'Aku juga sayang kamu!' }) });

      const result = await chat.chat('Aku sayang kamu, Momo.');

      expect(result).toMatchObject({
        message: { role: 'ASSISTANT', content: 'Aku juga sayang kamu!' },
        intent: 'TALK',
        action: null,
      });
      expect(chat.ai.requestsOf('INTERPRETATION')[0]?.messages.at(-1)).toEqual({ role: 'user', content: 'Aku sayang kamu, Momo.' });
      expect(chat.systemPrompt()).toContain('Your name is Momo.');
      expect(chat.systemPrompt()).toContain('no action happened');
      expect(chat.ai.requestsOf('RESPONSE')[0]?.messages.at(-1)).toEqual({ role: 'user', content: 'Aku sayang kamu, Momo.' });
    });

    it('feeds through chat via the Game Engine and tells the AI the real result', async () => {
      await chat.setStats({ hunger: 20 });
      chat.turn('FEED', { classification: 'CARE' });

      const result = await chat.chat('Nih makan dulu.');
      const [user] = await chat.stored();

      expect(result.action).toEqual({ type: 'FEED', status: 'SUCCESS' });
      expect(result.pet.state.hunger).toBe(45);
      expect(await chat.events('PET_FED')).toMatchObject([{ payload: { turnMessageId: user?.id } }]);
      expect(chat.systemPrompt()).toContain('The player offered you food, and you ate');
    });

    it('plays through chat and earns Play Bond only, not Talk Bond', async () => {
      const before = (await chat.aggregate()).state.bond;
      chat.turn('PLAY', { classification: 'PLAYFUL' });

      const result = await chat.chat('Main yuk!');

      expect(result.action).toEqual({ type: 'PLAY', status: 'SUCCESS' });
      expect(result.pet.state.bond).toBeCloseTo(before + 1, 6);
      expect(await chat.events('PET_TALKED')).toEqual([]);
      expect(chat.systemPrompt()).toContain('you played together');
    });

    it('puts the pet to sleep through chat, after which Talk is unavailable', async () => {
      await chat.setStats({ energy: 40 });
      chat.turn('SLEEP', { classification: 'CARE', reply: fakeOutcome.value({ message: 'Selamat tidur…' }) });

      const result = await chat.chat('Tidur dulu ya.');
      const storedBefore = (await chat.stored()).length;

      expect(result.action).toEqual({ type: 'SLEEP', status: 'SUCCESS' });
      expect(result.pet.state.currentActivity).toBe('SLEEPING');
      await chat.expectError('Halo?', 'PET_SLEEPING');
      expect(await chat.stored()).toHaveLength(storedBefore);
    });

    it('reacts honestly to a rejected Play without any Play effect', async () => {
      await chat.setStats({ energy: 10 });
      const before = await chat.aggregate();
      chat.turn('PLAY', { classification: 'PLAYFUL' });

      const result = await chat.chat('Main yuk!');
      const after = await chat.aggregate();

      expect(result.action).toEqual({ type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' });
      expect(await chat.events('PET_PLAYED')).toEqual([]);
      expect(after.state.happiness).toBe(before.state.happiness);
      // Task 2.5: a rejected Play does not teach Playful, even through its playful tone.
      expect(after.personality?.traits).toEqual(before.personality?.traits);
      expect(chat.systemPrompt()).toMatch(/you are too tired, so you did NOT play/);
    });

    it('applies the message tone to personality when a care action is rejected', async () => {
      await chat.setStats({ energy: 10 });
      const before = await chat.personality();
      chat.turn('PLAY', { classification: 'PRAISE' });

      await chat.chat('Kamu hebat, main yuk!');

      expect((await chat.personality()).traits.shy).toBeCloseTo(before.traits.shy - 0.002, 6);
    });

    it('does not act on an ambiguous, low-confidence care intent', async () => {
      const before = await chat.aggregate();
      chat.turn('PLAY', { confidence: 0.6, classification: 'PLAYFUL' });

      const result = await chat.chat('Seru kali ya kalau main.');

      expect(result).toMatchObject({ intent: 'NONE', action: null });
      expect(await chat.events('PET_PLAYED')).toEqual([]);
      expect((await chat.aggregate()).state.bond).toBe(before.state.bond);
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({ intent: 'NONE', rawIntent: 'PLAY', intentConfidence: 0.6 });
    });

    it('still replies when interpretation output is malformed, as NONE without effects', async () => {
      chat.ai.script('INTERPRETATION', fakeOutcome.raw('I think they want to play!'));
      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Hmm?' }));

      const result = await chat.chat('Main yuk!');

      expect(result).toMatchObject({ intent: 'NONE', action: null, message: { content: 'Hmm?' } });
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({
        interpretationFallback: true,
        interpretationFailure: 'MALFORMED_OUTPUT',
        classification: 'CASUAL',
      });
      expect(await chat.events('PET_PLAYED')).toEqual([]);
    });

    it('still replies when interpretation times out', async () => {
      chat.ai.script('INTERPRETATION', fakeOutcome.failure('TIMEOUT'));
      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Halo!' }));

      expect(await chat.chat('Tidur dulu ya.')).toMatchObject({ intent: 'NONE', action: null });
      expect((await chat.aggregate()).state.currentActivity).not.toBe('SLEEPING');
    });

    it('executes at most one action even if the model tries to return several', async () => {
      chat.ai.script(
        'INTERPRETATION',
        fakeOutcome.raw('{"intent":"FEED","confidence":0.9,"classification":"CARE"}\n{"intent":"PLAY","confidence":0.9,"classification":"PLAYFUL"}'),
      );
      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Hmm?' }));

      await chat.chat('Makan terus main lalu tidur.');

      const acted = (await chat.events()).filter((event) => ['PET_FED', 'PET_PLAYED', 'PET_STARTED_SLEEPING'].includes(event.type));
      expect(acted).toEqual([]);
    });
  });

  describe('Talk Bond and personality', () => {
    it('grants Talk Bond and a personality signal for a meaningful Talk turn, with events', async () => {
      const before = await chat.aggregate();
      chat.turn('TALK', { classification: 'AFFECTION' });

      const result = await chat.chat('Aku kangen kamu.');
      const after = await chat.aggregate();

      expect(result.pet.state.bond).toBeCloseTo(before.state.bond + 0.25, 6);
      expect(after.personality?.traits.clingy).toBeCloseTo((before.personality?.traits.clingy ?? 0) + 0.003, 6);
      expect(await chat.events('PET_TALKED')).toMatchObject([{ payload: { bondDelta: 0.25, classification: 'AFFECTION' } }]);
      expect(await chat.events('PERSONALITY_CHANGED')).toHaveLength(1);
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({ bondDelta: 0.25, fallbackUsed: false });
    });

    it('never puts message text in event payloads, and hides talk and personality events from the player', async () => {
      chat.turn('TALK', { classification: 'AFFECTION' });

      const result = await chat.chat('Rahasia: aku suka kamu.');

      expect(JSON.stringify(await chat.events())).not.toContain('Rahasia');
      expect(await chat.events('PET_TALKED')).toHaveLength(1);
      expect(result.pet.recentEvents.map((event) => event.type)).not.toContain('PET_TALKED');
      expect(result.pet.recentEvents.map((event) => event.type)).not.toContain('PERSONALITY_CHANGED');
    });

    it('caps Talk Bond at +2 per UTC day and resets the next day', async () => {
      const before = (await chat.aggregate()).state.bond;

      for (let turn = 0; turn < 10; turn += 1) {
        chat.turn('TALK', { classification: 'PRAISE' });
        await chat.chat(`Kamu pintar ${turn}`);
      }

      expect((await chat.aggregate()).state.bond).toBeCloseTo(before + 2, 6);
      expect(await chat.events('PET_TALKED')).toHaveLength(10);

      chat.clock.advanceBy(16 * 60 * 60 * 1_000); // 08:00 → 00:00 next UTC day.
      await chat.app.inject({ method: 'POST', url: '/api/v1/debug/pet/wake' });
      chat.turn('TALK', { classification: 'PRAISE' });
      const nextDay = await chat.chat('Pagi, Momo!');

      expect(nextDay.pet.state.bond).toBeCloseTo(before + 2.25, 6);
    });

    it('gives nothing for CASUAL small talk', async () => {
      const before = await chat.aggregate();

      for (const message of ['hi', 'hi', 'hi']) {
        chat.turn('TALK', { classification: 'CASUAL' });
        await chat.chat(message);
      }

      const after = await chat.aggregate();
      expect(after.state.bond).toBe(before.state.bond);
      expect(after.personality).toEqual(before.personality);
      expect(await chat.events('PET_TALKED')).toEqual([]);
      expect(await chat.events('PERSONALITY_CHANGED')).toEqual([]);
    });

    it('gives nothing for NONE', async () => {
      const before = await chat.aggregate();
      chat.turn('NONE', { classification: 'AFFECTION' });

      await chat.chat('asdfgh');

      expect(await chat.aggregate()).toMatchObject({ state: { bond: before.state.bond }, personality: before.personality });
    });
  });

  describe('failures', () => {
    it('falls back to the button reaction when the reply fails after an action, keeping the action', async () => {
      chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.failure('TIMEOUT') });

      const result = await chat.chat('Main yuk!');
      const reply = (await chat.stored()).at(-1);

      expect(result).toMatchObject({ action: { type: 'PLAY', status: 'SUCCESS' }, message: { content: 'Lagi! Lagi!' } });
      expect(reply?.metadata).toMatchObject({ fallbackUsed: true, responseFailure: 'TIMEOUT' });
      expect(await chat.events('PET_PLAYED')).toHaveLength(1);
    });

    it('uses the rejection words when the reply fails after a rejected action', async () => {
      await chat.setStats({ energy: 10 });
      chat.turn('PLAY', { classification: 'PLAYFUL', reply: fakeOutcome.failure('PROVIDER_ERROR') });

      expect((await chat.chat('Main yuk!')).message.content).toBe('Aku capek banget…');
    });

    it('reports AI_UNAVAILABLE for plain Talk when the reply fails, without faking a reply or rewards', async () => {
      const before = await chat.aggregate();
      chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.failure('PROVIDER_ERROR') });

      await chat.expectError('Aku kangen kamu.', 'AI_UNAVAILABLE');

      const stored = await chat.stored();
      expect(stored.map((message) => message.role)).toEqual(['USER']);
      expect(await chat.aggregate()).toMatchObject({ state: { bond: before.state.bond }, personality: before.personality });
    });

    it('rejects Talk while sleeping without calling the AI or storing the message', async () => {
      await chat.app.inject({ method: 'POST', url: '/api/v1/debug/pet/sleep' });

      await chat.expectError('Halo?', 'PET_SLEEPING');

      expect(chat.ai.requests).toEqual([]);
      expect(await chat.stored()).toEqual([]);
    });
  });

  describe('turn idempotency', () => {
    it('returns the stored reply for a retried completed turn without calling the AI or applying again', async () => {
      const id = randomUUID();
      chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.value({ message: 'Hehe, iya!' }) });
      const first = await chat.chat('Aku kangen kamu.', id);
      const afterFirst = await chat.aggregate();
      const calls = chat.ai.requests.length;

      const retried = await chat.chat('Aku kangen kamu.', id);

      expect(retried.message).toEqual(first.message);
      expect(retried).toMatchObject({ intent: 'TALK', action: null });
      expect(chat.ai.requests).toHaveLength(calls);
      expect(await chat.stored()).toHaveLength(2);
      expect(await chat.aggregate()).toMatchObject({ state: { bond: afterFirst.state.bond }, personality: afterFirst.personality });
    });

    it('returns the same action result for a retried completed action turn without acting twice', async () => {
      const id = randomUUID();
      chat.turn('PLAY', { classification: 'PLAYFUL' });
      await chat.chat('Main yuk!', id);

      const retried = await chat.chat('Main yuk!', id);

      expect(retried.action).toEqual({ type: 'PLAY', status: 'SUCCESS' });
      expect(await chat.events('PET_PLAYED')).toHaveLength(1);
    });

    it('resumes a failed turn on retry without duplicating the message or rewards', async () => {
      const id = randomUUID();
      const before = (await chat.aggregate()).state.bond;
      chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.failure('TIMEOUT') });
      await chat.expectError('Aku kangen kamu.', 'AI_UNAVAILABLE', id);

      chat.turn('TALK', { classification: 'AFFECTION', reply: fakeOutcome.value({ message: 'Aku juga!' }) });
      const resumed = await chat.chat('Aku kangen kamu.', id);

      const stored = await chat.stored();
      expect(stored.map((message) => message.role)).toEqual(['USER', 'ASSISTANT']);
      expect(stored[1]?.replyToMessageId).toBe(stored[0]?.id);
      expect(resumed.message.content).toBe('Aku juga!');
      expect((await chat.aggregate()).state.bond).toBeCloseTo(before + 0.25, 6);
      expect(await chat.events('PET_TALKED')).toHaveLength(1);
    });

    it('rejects a clientMessageId reused for a different message', async () => {
      const id = randomUUID();
      chat.turn('TALK');
      await chat.chat('Hai!', id);

      await chat.expectError('Main yuk!', 'VALIDATION_ERROR', id);
    });
  });

  describe('shared engine path and guards', () => {
    it('runs chat Play through the same rules as the button, including repeat diminishing', async () => {
      await chat.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'PLAY' } });
      const before = (await chat.aggregate()).state.bond;
      chat.turn('PLAY', { classification: 'PLAYFUL' });

      const result = await chat.chat('Main lagi yuk!');

      // Second Play within two hours: 0.75 of the base Bond, exactly like a second button press.
      expect(result.pet.state.bond).toBeCloseTo(before + 0.75, 6);
    });

    it('rejects a second chat while one is in flight, then accepts the next', async () => {
      const held = fakeOutcome.hold(fakeOutcome.value({ intent: 'TALK', confidence: 0.9, classification: 'CASUAL' }));
      chat.ai.script('INTERPRETATION', held.outcome);
      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Hai!' }));

      const first = chat.send('Hai!');
      await expect.poll(() => chat.ai.requests.length).toBe(1);
      await chat.expectError('Halo?', 'CHAT_IN_PROGRESS');

      held.release();
      expect((await first).statusCode).toBe(200);
      chat.turn('TALK');
      expect((await chat.chat('Lagi?')).intent).toBe('TALK');
    });

    it('caps the reply call by what is left of the turn budget', async () => {
      await chat.app.close();
      chat = new ChatHarness(getRepositories(), {
        aiTimeouts: { interpretationMs: 5_000, responseMs: 10_000, turnBudgetMs: 15_000 },
      });
      const slow = fakeOutcome.hold(fakeOutcome.value({ intent: 'TALK', confidence: 0.9, classification: 'CASUAL' }));
      chat.ai.script('INTERPRETATION', slow.outcome).script('RESPONSE', fakeOutcome.value({ message: 'Hai!' }));

      const pending = chat.chat('Hai!');
      await expect.poll(() => chat.ai.requests.length).toBe(1);
      chat.monotonic = 12_000; // Interpretation took 12 s of the 15 s turn.
      slow.release();
      await pending;

      expect(chat.ai.requests.map((request) => request.timeoutMs)).toEqual([5_000, 3_000]);
    });

    it('records usage metadata for debugging but never exposes it to the player', async () => {
      chat.turn('TALK', { classification: 'CURIOUS' });

      const response = await chat.send('Kamu lagi apa?');
      const history = await chat.app.inject({ method: 'GET', url: '/api/v1/pet/chat/history' });

      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({
        provider: 'fake',
        model: 'fake-model',
        latencyMs: 240,
        inputTokens: 600,
        outputTokens: 40,
      });
      expect(JSON.stringify(response.body)).not.toMatch(/fake-model|inputTokens|confidence|classification/);
      expect(historyEnvelope.parse(history.json()).data.messages).toHaveLength(2);
    });
  });
}

describe('POST /api/v1/pet/chat (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  describe('turns', () => {
    chatSuite(() => ({ pets: store, events: store, conversations: store }));
  });

  describe('request and lifecycle errors', () => {
    it.each([
      ['a missing clientMessageId', { message: 'Hai' }],
      ['an empty message', { clientMessageId: randomUUID(), message: '   ' }],
      ['a message over 1000 characters', { clientMessageId: randomUUID(), message: 'a'.repeat(1_001) }],
    ])('rejects %s', async (_label, payload) => {
      const chat = new ChatHarness({ pets: store, events: store, conversations: store });
      const response = await chat.app.inject({ method: 'POST', url: '/api/v1/pet/chat', payload });

      expect(response.statusCode).toBe(400);
      expect(chat.ai.requests).toEqual([]);
      await chat.app.close();
    });

    it('reports PET_NOT_FOUND before a pet exists and INVALID_PET_STAGE for an Egg', async () => {
      const chat = new ChatHarness({ pets: store, events: store, conversations: store });

      await chat.expectError('Hai', 'PET_NOT_FOUND');
      await chat.app.inject({ method: 'POST', url: '/api/v1/pet' });
      await chat.expectError('Hai', 'INVALID_PET_STAGE');
      await chat.app.close();
    });

    it('keeps the game playable without an AI provider: Talk is AI_UNAVAILABLE, buttons work', async () => {
      const chat = new ChatHarness({ pets: store, events: store, conversations: store }, { ai: null });
      await chat.startBaby();

      await chat.expectError('Hai', 'AI_UNAVAILABLE');
      const fed = await chat.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } });

      expect(fed.statusCode).toBe(200);
      await chat.app.close();
    });
  });
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('POST /api/v1/pet/chat (PostgreSQL)', () => {
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

  chatSuite(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
    conversations: new DrizzleConversationRepository(connection.db),
  }));
});
