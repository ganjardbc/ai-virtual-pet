import { createEgg, createInitialPetState } from '@ai-virtual-pet/domain';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseConnection } from '../db/client.js';
import { openTestDatabase, testDatabaseUrl, truncateAll } from '../testing/database.js';
import { DrizzleConversationRepository, DrizzlePetRepository } from './drizzle.js';
import { InMemoryStore } from './memory.js';
import {
  ConversationNotFoundError,
  DuplicateMessageError,
  PetNotFoundError,
  type Conversation,
  type ConversationRepository,
  type PetRepository,
} from './repositories.js';

const start = new Date('2026-09-25T08:00:00.000Z');
const minutes = (count: number) => new Date(start.getTime() + count * 60 * 1_000);

interface Repositories {
  readonly pets: PetRepository;
  readonly conversations: ConversationRepository;
}

function candidate(id = 'conversation-1', petId = 'pet-1'): Conversation {
  return { id, petId, createdAt: start, updatedAt: start };
}

async function createPet(pets: PetRepository, id = 'pet-1'): Promise<void> {
  await pets.create(createEgg({ id, createdAt: start }), createInitialPetState(id, start));
}

/** Behavior every ConversationRepository implementation must share. */
function conversationContract(getRepositories: () => Repositories): void {
  let conversations: ConversationRepository;
  let conversation: Conversation;

  const say = (clientMessageId: string, at = minutes(1), content = 'Hai!') =>
    conversations.appendMessage(conversation.id, { role: 'USER', content, clientMessageId, createdAt: at });

  const reply = (replyToMessageId: number, at = minutes(2), metadata = {}) =>
    conversations.appendMessage(conversation.id, {
      role: 'ASSISTANT',
      content: 'Halo!',
      replyToMessageId,
      metadata,
      createdAt: at,
    });

  /** The prototype allows one pet, so a second pet replaces the first. */
  async function freshPet(id: string): Promise<void> {
    const { pets } = getRepositories();
    await pets.deleteAll();
    await createPet(pets, id);
  }

  beforeEach(async () => {
    const repositories = getRepositories();
    conversations = repositories.conversations;
    await createPet(repositories.pets);
    conversation = await conversations.getOrCreateForPet(candidate());
  });

  describe('default conversation', () => {
    it('creates one conversation per pet and returns it afterwards', async () => {
      const again = await conversations.getOrCreateForPet(candidate('conversation-2'));

      expect(conversation).toEqual(candidate());
      expect(again).toEqual(candidate());
      expect(await conversations.findForPet('pet-1')).toEqual(candidate());
    });

    it('creates only one conversation when creates race', async () => {
      await freshPet('pet-2');

      const results = await Promise.all(
        ['a', 'b', 'c'].map((id) => conversations.getOrCreateForPet(candidate(`race-${id}`, 'pet-2'))),
      );

      expect(new Set(results.map((result) => result.id)).size).toBe(1);
    });

    it('finds nothing for a pet without a conversation', async () => {
      await freshPet('pet-2');

      expect(await conversations.findForPet('pet-2')).toBeNull();
    });

    it('rejects a conversation for a pet that does not exist', async () => {
      await expect(conversations.getOrCreateForPet(candidate('orphan', 'missing'))).rejects.toBeInstanceOf(
        PetNotFoundError,
      );
    });
  });

  describe('messages', () => {
    it('stores a player message and its reply with metadata, and bumps updatedAt', async () => {
      const user = await say('turn-1');
      const assistant = await reply(user.id, minutes(2), { intent: 'TALK', fallbackUsed: false });

      expect(user).toMatchObject({
        role: 'USER',
        content: 'Hai!',
        clientMessageId: 'turn-1',
        replyToMessageId: null,
        metadata: {},
        createdAt: minutes(1),
      });
      expect(assistant).toMatchObject({
        role: 'ASSISTANT',
        clientMessageId: null,
        replyToMessageId: user.id,
        metadata: { intent: 'TALK', fallbackUsed: false },
      });
      expect((await conversations.findForPet('pet-1'))?.updatedAt).toEqual(minutes(2));
    });

    it('reloads history oldest first', async () => {
      const first = await say('turn-1', minutes(1));
      await reply(first.id, minutes(2));
      await say('turn-2', minutes(3));

      const history = await conversations.listRecentMessages(conversation.id, { limit: 50 });

      expect(history.map((message) => [message.role, message.clientMessageId])).toEqual([
        ['USER', 'turn-1'],
        ['ASSISTANT', null],
        ['USER', 'turn-2'],
      ]);
    });

    it('returns only the latest messages up to the limit', async () => {
      for (let turn = 1; turn <= 20; turn += 1) {
        await say(`turn-${turn}`, minutes(turn));
      }

      const recent = await conversations.listRecentMessages(conversation.id, { limit: 12 });

      expect(recent.map((message) => message.clientMessageId)).toEqual(
        Array.from({ length: 12 }, (_, index) => `turn-${index + 9}`),
      );
    });

    it('orders by time, then by insertion for identical times', async () => {
      await say('same-a', minutes(5));
      await say('same-b', minutes(5));
      await say('earlier', minutes(4));

      const history = await conversations.listRecentMessages(conversation.id, { limit: 10 });

      expect(history.map((message) => message.clientMessageId)).toEqual(['earlier', 'same-a', 'same-b']);
    });

    it('rejects empty content and unknown conversations', async () => {
      await expect(say('turn-1', minutes(1), '')).rejects.toThrow(RangeError);
      await expect(
        conversations.appendMessage('missing', { role: 'USER', content: 'Hai', clientMessageId: 'x', createdAt: start }),
      ).rejects.toBeInstanceOf(ConversationNotFoundError);
    });
  });

  describe('turn idempotency (plan Task 3.8)', () => {
    it('does not store a second player message with the same clientMessageId', async () => {
      await say('turn-1');

      await expect(say('turn-1', minutes(3))).rejects.toBeInstanceOf(DuplicateMessageError);
      expect(await conversations.listRecentMessages(conversation.id, { limit: 10 })).toHaveLength(1);
    });

    it('stores exactly one message when the same turn is submitted concurrently', async () => {
      const results = await Promise.allSettled([say('turn-1'), say('turn-1'), say('turn-1')]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      for (const result of results.filter((result) => result.status === 'rejected')) {
        expect((result as PromiseRejectedResult).reason).toBeInstanceOf(DuplicateMessageError);
      }
      expect(await conversations.listRecentMessages(conversation.id, { limit: 10 })).toHaveLength(1);
    });

    it('rejects a second reply to the same player message', async () => {
      const user = await say('turn-1');
      await reply(user.id);

      await expect(reply(user.id, minutes(3))).rejects.toBeInstanceOf(DuplicateMessageError);
    });

    it('rejects a reply to a reply or to a message that does not exist', async () => {
      const user = await say('turn-1');
      const assistant = await reply(user.id);

      await expect(reply(assistant.id)).rejects.toThrow(RangeError);
      await expect(reply(999_999)).rejects.toThrow(RangeError);
    });

    it('finds a turn by clientMessageId, with its reply once stored', async () => {
      const user = await say('turn-1');

      expect(await conversations.findTurn(conversation.id, 'turn-1')).toEqual({ user, reply: null });

      const assistant = await reply(user.id);

      expect(await conversations.findTurn(conversation.id, 'turn-1')).toEqual({ user, reply: assistant });
      expect(await conversations.findTurn(conversation.id, 'unknown')).toBeNull();
    });
  });

  it('removes conversations and messages with the pet on deleteAll', async () => {
    const { pets } = getRepositories();
    await say('turn-1');

    await pets.deleteAll();
    await createPet(pets);

    expect(await conversations.findForPet('pet-1')).toBeNull();
    const recreated = await conversations.getOrCreateForPet(candidate('conversation-new'));
    expect(await conversations.listRecentMessages(recreated.id, { limit: 10 })).toEqual([]);
  });
}

describe('InMemoryStore conversations', () => {
  let store = new InMemoryStore();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  conversationContract(() => ({ pets: store, conversations: store }));

  it('does not expose stored messages to caller mutation', async () => {
    const conversation = await store.getOrCreateForPet(candidate());
    const stored = await store.appendMessage(conversation.id, {
      role: 'USER',
      content: 'Hai',
      clientMessageId: 'x',
      createdAt: start,
    });
    (stored as { content: string }).content = 'changed';

    expect((await store.listRecentMessages(conversation.id, { limit: 1 }))[0]?.content).toBe('Hai');
  });
});

const databaseUrl = testDatabaseUrl();

describe.skipIf(!databaseUrl)('Drizzle conversations (PostgreSQL)', () => {
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

  conversationContract(() => ({
    pets: new DrizzlePetRepository(connection.db),
    conversations: new DrizzleConversationRepository(connection.db),
  }));

  async function seedTurn(): Promise<{ conversationId: string; userId: number }> {
    // The contract's beforeEach already stored pet-1 with its conversation.
    const conversations = new DrizzleConversationRepository(connection.db);
    const conversation = await conversations.getOrCreateForPet(candidate());
    const user = await conversations.appendMessage(conversation.id, {
      role: 'USER',
      content: 'Hai',
      clientMessageId: 'turn-db',
      createdAt: start,
    });
    return { conversationId: conversation.id, userId: user.id };
  }

  const failure = (statement: ReturnType<typeof sql>) =>
    connection.db.execute(statement).then(
      () => null,
      (caught: unknown) => caught,
    );

  it('enforces one reply per player message at the database level', async () => {
    const { conversationId, userId } = await seedTurn();
    const insertReply = sql`insert into messages (conversation_id, role, content, reply_to_message_id, created_at)
      values (${conversationId}, 'ASSISTANT', 'Halo', ${userId}, now())`;

    expect(await failure(insertReply)).toBeNull();
    // 23505 = PostgreSQL unique_violation.
    expect(await failure(insertReply)).toMatchObject({ cause: { code: '23505' } });
  });

  it.each([
    ['player message with a reply link', sql`update messages set reply_to_message_id = id`],
    ['player message without clientMessageId', sql`update messages set client_message_id = null`],
    ['unknown role', sql`update messages set role = 'SYSTEM'`],
    ['empty content', sql`update messages set content = ''`],
  ])('rejects %s at the database level', async (_label, statement) => {
    await seedTurn();

    // 23514 = PostgreSQL check_violation.
    expect(await failure(statement)).toMatchObject({ cause: { code: '23514' } });
  });
});
