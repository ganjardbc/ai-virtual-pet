import type { DomainEvent, DomainEventType, Pet, PetId, PetState } from '@ai-virtual-pet/domain';

import {
  ConcurrencyError,
  ConversationNotFoundError,
  DuplicateMessageError,
  PetAlreadyExistsError,
  PetNotFoundError,
  assertMessageContent,
  assertStateBelongsToPet,
  type Conversation,
  type ConversationRepository,
  type ConversationTurn,
  type EventQuery,
  type EventRepository,
  type PetAggregate,
  type PetRepository,
  type MessageQuery,
  type NewMessage,
  type SavePetInput,
  type StoredEvent,
  type StoredMessage,
} from './repositories.js';

interface MemoryRecord {
  aggregate: PetAggregate;
  sequence: number;
}

/** In-process repositories with the same contract as the Drizzle implementation, for fast tests. */
export class InMemoryStore implements PetRepository, EventRepository, ConversationRepository {
  private readonly pets = new Map<PetId, MemoryRecord>();
  private readonly eventLog: StoredEvent[] = [];
  private readonly conversations = new Map<string, Conversation>();
  private readonly messageLog: StoredMessage[] = [];
  private nextEventId = 1;
  private nextMessageId = 1;
  private nextSequence = 1;

  async findCurrent(): Promise<PetAggregate | null> {
    let current: MemoryRecord | null = null;

    for (const record of this.pets.values()) {
      if (
        !current ||
        record.aggregate.pet.createdAt > current.aggregate.pet.createdAt ||
        (record.aggregate.pet.createdAt.getTime() === current.aggregate.pet.createdAt.getTime() &&
          record.sequence > current.sequence)
      ) {
        current = record;
      }
    }

    return current ? structuredClone(current.aggregate) : null;
  }

  async create(pet: Pet, state: PetState, events: readonly DomainEvent[] = []): Promise<PetAggregate> {
    assertStateBelongsToPet(pet, state);

    // Check and insert happen without awaiting, so concurrent creates cannot interleave.
    if (this.pets.size > 0) {
      throw new PetAlreadyExistsError();
    }

    const aggregate: PetAggregate = { pet, state, version: 0 };
    this.pets.set(pet.id, { aggregate: structuredClone(aggregate), sequence: this.nextSequence++ });
    this.append(pet.id, events);
    return structuredClone(aggregate);
  }

  async save(input: SavePetInput): Promise<PetAggregate> {
    assertStateBelongsToPet(input.pet, input.state, input.personality);
    const record = this.pets.get(input.pet.id);

    if (!record) {
      throw new PetNotFoundError(input.pet.id);
    }

    if (record.aggregate.version !== input.expectedVersion) {
      throw new ConcurrencyError(input.pet.id, input.expectedVersion);
    }

    const personality = input.personality ?? record.aggregate.personality;
    const aggregate: PetAggregate = {
      pet: input.pet,
      state: input.state,
      ...(personality ? { personality } : {}),
      version: input.expectedVersion + 1,
    };
    record.aggregate = structuredClone(aggregate);
    this.append(input.pet.id, input.events);
    return structuredClone(aggregate);
  }

  async deleteAll(): Promise<void> {
    // Mirrors the database cascade from pets to conversations and messages.
    this.pets.clear();
    this.eventLog.length = 0;
    this.conversations.clear();
    this.messageLog.length = 0;
  }

  async listRecent(petId: PetId, query: EventQuery): Promise<StoredEvent[]> {
    return this.eventLog
      .filter((event) => event.petId === petId)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id - a.id)
      .slice(0, query.limit)
      .map((event) => structuredClone(event));
  }

  async listOccurrenceTimes(petId: PetId, type: DomainEventType, since: Date): Promise<Date[]> {
    return this.eventLog
      .filter((event) => event.petId === petId && event.type === type && event.occurredAt >= since)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.id - b.id)
      .map((event) => new Date(event.occurredAt));
  }

  async findForPet(petId: PetId): Promise<Conversation | null> {
    const conversation = [...this.conversations.values()].find((candidate) => candidate.petId === petId);
    return conversation ? structuredClone(conversation) : null;
  }

  async getOrCreateForPet(candidate: Conversation): Promise<Conversation> {
    if (!this.pets.has(candidate.petId)) {
      throw new PetNotFoundError(candidate.petId);
    }

    // Check and insert happen without awaiting, so concurrent calls cannot both create one.
    const existing = [...this.conversations.values()].find((conversation) => conversation.petId === candidate.petId);

    if (existing) {
      return structuredClone(existing);
    }

    this.conversations.set(candidate.id, structuredClone(candidate));
    return structuredClone(candidate);
  }

  async appendMessage(conversationId: string, message: NewMessage): Promise<StoredMessage> {
    assertMessageContent(message.content);
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    const inConversation = this.messageLog.filter((stored) => stored.conversationId === conversationId);

    if (message.role === 'USER') {
      if (inConversation.some((stored) => stored.clientMessageId === message.clientMessageId)) {
        throw new DuplicateMessageError(conversationId);
      }
    } else {
      const target = inConversation.find((stored) => stored.id === message.replyToMessageId);

      if (target?.role !== 'USER') {
        throw new RangeError(`Message ${message.replyToMessageId} is not a player message in this conversation.`);
      }

      if (this.messageLog.some((stored) => stored.replyToMessageId === message.replyToMessageId)) {
        throw new DuplicateMessageError(conversationId);
      }
    }

    const stored: StoredMessage = {
      id: this.nextMessageId++,
      conversationId,
      role: message.role,
      content: message.content,
      clientMessageId: message.role === 'USER' ? message.clientMessageId : null,
      replyToMessageId: message.role === 'ASSISTANT' ? message.replyToMessageId : null,
      metadata: message.role === 'ASSISTANT' ? { ...message.metadata } : {},
      createdAt: message.createdAt,
    };
    this.messageLog.push(structuredClone(stored));
    this.conversations.set(conversationId, { ...conversation, updatedAt: message.createdAt });
    return structuredClone(stored);
  }

  async findTurn(conversationId: string, clientMessageId: string): Promise<ConversationTurn | null> {
    const user = this.messageLog.find(
      (stored) => stored.conversationId === conversationId && stored.clientMessageId === clientMessageId,
    );

    if (!user) {
      return null;
    }

    const reply = this.messageLog.find((stored) => stored.replyToMessageId === user.id) ?? null;
    return structuredClone({ user, reply });
  }

  async listRecentMessages(conversationId: string, query: MessageQuery): Promise<StoredMessage[]> {
    const ordered = this.messageLog
      .filter((stored) => stored.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);

    return ordered.slice(Math.max(0, ordered.length - query.limit)).map((stored) => structuredClone(stored));
  }

  private append(petId: PetId, events: readonly DomainEvent[]): void {
    for (const event of events) {
      this.eventLog.push(structuredClone({ ...event, id: this.nextEventId++, petId }));
    }
  }
}
