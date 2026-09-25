import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from '../db/client.js';
import { DrizzleConversationRepository, DrizzleEventRepository, DrizzlePetRepository } from '../persistence/drizzle.js';
import { InMemoryStore } from '../persistence/memory.js';
import { ChatHarness, type Repositories } from '../testing/chat-harness.js';
import { fakeOutcome } from '../testing/fake-ai-provider.js';
import { FlakyConversations } from '../testing/flaky-conversations.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';

/**
 * Chat failure hardening (Unit 08): AI failures and crashes at every step of a turn must never
 * duplicate an action, Bond, personality, or message, and never roll back a committed action.
 */
function failureSuite(getRepositories: () => Repositories): void {
  let flaky: FlakyConversations;
  let chat: ChatHarness;

  beforeEach(async () => {
    const repositories = getRepositories();
    flaky = new FlakyConversations(repositories.conversations);
    chat = new ChatHarness({ ...repositories, conversations: flaky });
    await chat.startBaby();
  });

  afterEach(async () => {
    await chat.app.close();
  });

  const roles = async () => (await chat.stored()).map((message) => message.role);

  describe('crash after the Game Engine committed, before the reply was stored', () => {
    it('resumes an accepted Play without interpreting or playing again', async () => {
      const id = randomUUID();
      const bondBefore = (await chat.aggregate()).state.bond;
      chat.turn('PLAY', { classification: 'PLAYFUL' });
      flaky.failNextReply = true;

      expect((await chat.send('Main yuk!', id)).statusCode).toBe(500);
      expect(await chat.events('PET_PLAYED')).toHaveLength(1);
      expect(await roles()).toEqual(['USER']);

      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Seru banget tadi!' }));
      const resumed = await chat.chat('Main yuk!', id);

      expect(resumed).toMatchObject({
        intent: 'PLAY',
        action: { type: 'PLAY', status: 'SUCCESS' },
        message: { content: 'Seru banget tadi!' },
      });
      expect(chat.ai.requestsOf('INTERPRETATION')).toHaveLength(1);
      expect(await chat.events('PET_PLAYED')).toHaveLength(1);
      expect((await chat.aggregate()).state.bond).toBeCloseTo(bondBefore + 1, 6);
      expect(await roles()).toEqual(['USER', 'ASSISTANT']);
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({ resumedAction: true, bondDelta: 1 });
      // The regenerated reply is still told the real result.
      expect(chat.systemPrompt()).toContain('you played together');
    });

    it('resumes a rejected action with the same rejection, without a second rejection event', async () => {
      const id = randomUUID();
      await chat.setStats({ energy: 10 });
      chat.turn('PLAY', { classification: 'PLAYFUL' });
      flaky.failNextReply = true;
      await chat.send('Main yuk!', id);
      await chat.setStats({ energy: 100 }); // Even if Play would now succeed, the turn already decided.

      chat.ai.script('RESPONSE', fakeOutcome.value({ message: 'Tadi aku capek…' }));
      const resumed = await chat.chat('Main yuk!', id);

      expect(resumed.action).toEqual({ type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' });
      expect(await chat.events('PET_PLAYED')).toEqual([]);
      expect((await chat.events('ACTION_REJECTED')).filter((event) => event.payload.turnMessageId !== undefined)).toHaveLength(1);
    });

    it('falls back to the button words from the committed result when the resumed reply also fails', async () => {
      const id = randomUUID();
      await chat.setStats({ hunger: 20 });
      chat.turn('FEED', { classification: 'CARE' });
      flaky.failNextReply = true;
      await chat.send('Nih makan.', id);

      chat.ai.script('RESPONSE', fakeOutcome.failure('PROVIDER_ERROR'));
      const resumed = await chat.chat('Nih makan.', id);

      expect(resumed.message.content).toBe('Nyam!');
      expect(await chat.events('PET_FED')).toHaveLength(1);
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({ fallbackUsed: true, resumedAction: true });
    });

    it('resumes a Talk turn whose Bond was already applied without applying it again', async () => {
      const id = randomUUID();
      const before = await chat.aggregate();
      chat.turn('TALK', { classification: 'AFFECTION' });
      flaky.failNextReply = true;
      expect((await chat.send('Aku kangen kamu.', id)).statusCode).toBe(500);
      const afterCrash = await chat.aggregate();

      chat.turn('TALK', { classification: 'AFFECTION' });
      await chat.chat('Aku kangen kamu.', id);
      const after = await chat.aggregate();

      expect(afterCrash.state.bond).toBeCloseTo(before.state.bond + 0.25, 6);
      expect(after.state.bond).toBe(afterCrash.state.bond);
      expect(after.personality).toEqual(afterCrash.personality);
      expect(await chat.events('PET_TALKED')).toHaveLength(1);
      expect(await roles()).toEqual(['USER', 'ASSISTANT']);
    });
  });

  describe('AI failures', () => {
    it('reports AI_UNAVAILABLE when both calls fail, keeps the message, and lets Retry complete it', async () => {
      const id = randomUUID();
      chat.ai.script('INTERPRETATION', fakeOutcome.failure('TIMEOUT'));
      chat.ai.script('RESPONSE', fakeOutcome.failure('PROVIDER_ERROR'));

      await chat.expectError('Halo Momo', 'AI_UNAVAILABLE', id);
      expect(await roles()).toEqual(['USER']);

      chat.turn('TALK', { classification: 'CASUAL', reply: fakeOutcome.value({ message: 'Halo!' }) });
      expect((await chat.chat('Halo Momo', id)).message.content).toBe('Halo!');
      expect(await roles()).toEqual(['USER', 'ASSISTANT']);
    });

    it('never rolls back a committed action when the reply fails', async () => {
      chat.turn('SLEEP', { classification: 'CARE', reply: fakeOutcome.failure('MALFORMED_OUTPUT') });

      const result = await chat.chat('Tidur dulu ya.');

      expect(result).toMatchObject({ action: { type: 'SLEEP', status: 'SUCCESS' }, message: { content: 'Selamat tidur…' } });
      expect((await chat.aggregate()).state.currentActivity).toBe('SLEEPING');
    });

    it('does not call the model for the reply once the turn budget is spent', async () => {
      const slow = fakeOutcome.hold(fakeOutcome.value({ intent: 'PLAY', confidence: 0.95, classification: 'PLAYFUL' }));
      chat.ai.script('INTERPRETATION', slow.outcome);

      const pending = chat.chat('Main yuk!');
      await expect.poll(() => chat.ai.requests.length).toBe(1);
      chat.monotonic = 20_000; // Interpretation used the whole 15 s budget.
      slow.release();
      const result = await pending;

      expect(chat.ai.requestsOf('RESPONSE')[0]?.timeoutMs).toBe(0);
      expect(result).toMatchObject({ action: { type: 'PLAY', status: 'SUCCESS' }, message: { content: 'Lagi! Lagi!' } });
      expect((await chat.stored()).at(-1)?.metadata).toMatchObject({ fallbackUsed: true, responseFailure: 'TIMEOUT' });
    });

    it('recovers from an unexpected provider exception: guard released, turn resumable', async () => {
      const id = randomUUID();
      // Nothing scripted: the fake throws, standing in for a bug in an adapter.
      expect((await chat.send('Hai', id)).statusCode).toBe(500);

      chat.turn('TALK', { reply: fakeOutcome.value({ message: 'Hai juga!' }) });
      expect((await chat.chat('Hai', id)).message.content).toBe('Hai juga!');
      expect(await roles()).toEqual(['USER', 'ASSISTANT']);
    });

    it('keeps care buttons working while Talk fails', async () => {
      chat.turn('TALK', { reply: fakeOutcome.failure('PROVIDER_ERROR') });
      await chat.expectError('Hai', 'AI_UNAVAILABLE');

      for (const type of ['FEED', 'PLAY', 'SLEEP']) {
        const response = await chat.app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type } });
        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('concurrent reply from another process', () => {
    it('reports CHAT_IN_PROGRESS instead of a second reply, and Retry returns the stored one', async () => {
      const id = randomUUID();
      chat.turn('TALK');
      flaky.raceNextReply = true;

      await chat.expectError('Hai', 'CHAT_IN_PROGRESS', id);
      const retried = await chat.chat('Hai', id);

      expect(retried.message.content).toBe('Balasan dari proses lain.');
      expect(await roles()).toEqual(['USER', 'ASSISTANT']);
    });
  });
}

describe('chat failure hardening (in-memory store)', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  failureSuite(() => ({ pets: store, events: store, conversations: store }));
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('chat failure hardening (PostgreSQL)', () => {
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

  failureSuite(() => ({
    pets: new DrizzlePetRepository(connection.db),
    events: new DrizzleEventRepository(connection.db),
    conversations: new DrizzleConversationRepository(connection.db),
  }));
});
