import {
  createPersonalityState,
  createPetState,
  type DomainEvent,
  type DomainEventType,
  type Pet,
  type PetActivity,
  type PersonalityState,
  type PetId,
  type PetState,
} from '@ai-virtual-pet/domain';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { conversations, events, messages, petPersonalities, pets, petStates } from '../db/schema.js';
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
  type MessageRole,
  type NewMessage,
  type SavePetInput,
  type StoredEvent,
  type StoredMessage,
} from './repositories.js';

/** Arbitrary application-wide advisory lock key guarding single-pet creation. */
const SINGLE_PET_CREATE_LOCK = 42_01;

type PetRow = typeof pets.$inferSelect;
type PetStateRow = typeof petStates.$inferSelect;
type EventRow = typeof events.$inferSelect;
type PersonalityRow = typeof petPersonalities.$inferSelect;
type ConversationRow = typeof conversations.$inferSelect;
type MessageRow = typeof messages.$inferSelect;

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export class DrizzlePetRepository implements PetRepository {
  constructor(private readonly db: Database) {}

  async findCurrent(): Promise<PetAggregate | null> {
    const [row] = await this.db
      .select({ pet: pets, state: petStates, personality: petPersonalities })
      .from(pets)
      .innerJoin(petStates, eq(petStates.petId, pets.id))
      .leftJoin(petPersonalities, eq(petPersonalities.petId, pets.id))
      .orderBy(desc(pets.createdAt))
      .limit(1);

    return row ? toAggregate(row.pet, row.state, row.personality) : null;
  }

  async create(pet: Pet, state: PetState, initialEvents: readonly DomainEvent[] = []): Promise<PetAggregate> {
    assertStateBelongsToPet(pet, state);

    return this.db.transaction(async (tx) => {
      // Serialize creates so two concurrent requests cannot both see "no pet" and insert.
      await tx.execute(sql`select pg_advisory_xact_lock(${SINGLE_PET_CREATE_LOCK})`);
      const [existing] = await tx.select({ id: pets.id }).from(pets).limit(1);

      if (existing) {
        throw new PetAlreadyExistsError();
      }

      const [petRow] = await tx.insert(pets).values({ ...toPetValues(pet), version: 0 }).returning();
      const [stateRow] = await tx.insert(petStates).values(toStateValues(state)).returning();
      await insertEvents(tx, pet.id, initialEvents);

      return toAggregate(required(petRow), required(stateRow), null);
    });
  }

  async save(input: SavePetInput): Promise<PetAggregate> {
    assertStateBelongsToPet(input.pet, input.state, input.personality);

    return this.db.transaction(async (tx) => {
      const now = new Date();
      const [petRow] = await tx
        .update(pets)
        .set({ ...toPetValues(input.pet), updatedAt: now, version: input.expectedVersion + 1 })
        .where(and(eq(pets.id, input.pet.id), eq(pets.version, input.expectedVersion)))
        .returning();

      if (!petRow) {
        const [existing] = await tx.select({ id: pets.id }).from(pets).where(eq(pets.id, input.pet.id));
        throw existing
          ? new ConcurrencyError(input.pet.id, input.expectedVersion)
          : new PetNotFoundError(input.pet.id);
      }

      const [stateRow] = await tx
        .update(petStates)
        .set({ ...toStateValues(input.state), updatedAt: now })
        .where(eq(petStates.petId, input.pet.id))
        .returning();
      const personalityRow = input.personality
        ? await upsertPersonality(tx, input.personality, now)
        : await findPersonality(tx, input.pet.id);
      await insertEvents(tx, input.pet.id, input.events);

      return toAggregate(petRow, required(stateRow), personalityRow);
    });
  }

  async deleteAll(): Promise<void> {
    // pet_states, pet_personalities, events, conversations, and messages cascade.
    await this.db.delete(pets);
  }
}

export class DrizzleEventRepository implements EventRepository {
  constructor(private readonly db: Database) {}

  async listRecent(petId: PetId, query: EventQuery): Promise<StoredEvent[]> {
    const rows = await this.db
      .select()
      .from(events)
      .where(eq(events.petId, petId))
      .orderBy(desc(events.occurredAt), desc(events.id))
      .limit(query.limit);

    return rows.map(toStoredEvent);
  }

  async listOccurrenceTimes(petId: PetId, type: DomainEventType, since: Date): Promise<Date[]> {
    const rows = await this.db
      .select({ occurredAt: events.occurredAt })
      .from(events)
      .where(and(eq(events.petId, petId), eq(events.type, type), gte(events.occurredAt, since)))
      .orderBy(asc(events.occurredAt), asc(events.id));

    return rows.map((row) => row.occurredAt);
  }
}

export class DrizzleConversationRepository implements ConversationRepository {
  constructor(private readonly db: Database) {}

  async findForPet(petId: PetId): Promise<Conversation | null> {
    const [row] = await this.db.select().from(conversations).where(eq(conversations.petId, petId));
    return row ? toConversation(row) : null;
  }

  async getOrCreateForPet(candidate: Conversation): Promise<Conversation> {
    try {
      // The unique pet_id makes a concurrent second insert a no-op; both callers then read the winner.
      await this.db.insert(conversations).values(candidate).onConflictDoNothing({ target: conversations.petId });
    } catch (error) {
      if (hasPostgresCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new PetNotFoundError(candidate.petId);
      }

      throw error;
    }

    const existing = await this.findForPet(candidate.petId);

    if (!existing) {
      throw new PetNotFoundError(candidate.petId);
    }

    return existing;
  }

  async appendMessage(conversationId: string, message: NewMessage): Promise<StoredMessage> {
    assertMessageContent(message.content);

    try {
      return await this.db.transaction(async (tx) => {
        const [conversation] = await tx
          .update(conversations)
          .set({ updatedAt: message.createdAt })
          .where(eq(conversations.id, conversationId))
          .returning({ id: conversations.id });

        if (!conversation) {
          throw new ConversationNotFoundError(conversationId);
        }

        if (message.role === 'ASSISTANT') {
          const [target] = await tx
            .select({ role: messages.role })
            .from(messages)
            .where(and(eq(messages.id, message.replyToMessageId), eq(messages.conversationId, conversationId)));

          if (target?.role !== 'USER') {
            throw new RangeError(`Message ${message.replyToMessageId} is not a player message in this conversation.`);
          }
        }

        const [row] = await tx
          .insert(messages)
          .values({
            conversationId,
            role: message.role,
            content: message.content,
            clientMessageId: message.role === 'USER' ? message.clientMessageId : null,
            replyToMessageId: message.role === 'ASSISTANT' ? message.replyToMessageId : null,
            metadata: message.role === 'ASSISTANT' ? { ...message.metadata } : {},
            createdAt: message.createdAt,
          })
          .returning();

        return toStoredMessage(required(row));
      });
    } catch (error) {
      if (hasPostgresCode(error, UNIQUE_VIOLATION)) {
        throw new DuplicateMessageError(conversationId);
      }

      throw error;
    }
  }

  async findTurn(conversationId: string, clientMessageId: string): Promise<ConversationTurn | null> {
    const [user] = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), eq(messages.clientMessageId, clientMessageId)));

    if (!user) {
      return null;
    }

    const [reply] = await this.db.select().from(messages).where(eq(messages.replyToMessageId, user.id));
    return { user: toStoredMessage(user), reply: reply ? toStoredMessage(reply) : null };
  }

  async listRecentMessages(conversationId: string, query: MessageQuery): Promise<StoredMessage[]> {
    const rows = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(query.limit);

    return rows.reverse().map(toStoredMessage);
  }
}

/** Drizzle wraps driver errors, so the PostgreSQL code may be on the error or its `cause`. */
function hasPostgresCode(error: unknown, code: string): boolean {
  const codeOf = (value: unknown) => (value as { code?: unknown } | null)?.code;
  return codeOf(error) === code || codeOf((error as { cause?: unknown } | null)?.cause) === code;
}

async function upsertPersonality(tx: Transaction, personality: PersonalityState, now: Date): Promise<PersonalityRow> {
  const values = toPersonalityValues(personality);
  const [row] = await tx
    .insert(petPersonalities)
    .values(values)
    .onConflictDoUpdate({ target: petPersonalities.petId, set: { ...values, updatedAt: now } })
    .returning();

  return required(row);
}

async function findPersonality(tx: Transaction, petId: PetId): Promise<PersonalityRow | null> {
  const [row] = await tx.select().from(petPersonalities).where(eq(petPersonalities.petId, petId));
  return row ?? null;
}

async function insertEvents(tx: Transaction, petId: PetId, domainEvents: readonly DomainEvent[]): Promise<void> {
  if (domainEvents.length === 0) {
    return;
  }

  await tx.insert(events).values(
    domainEvents.map((event) => ({
      petId,
      type: event.type,
      occurredAt: event.occurredAt,
      data: { ...event.payload },
    })),
  );
}

// ---- Row ↔ domain mapping (kept inside the infrastructure boundary) ----

function toPetValues(pet: Pet) {
  return {
    id: pet.id,
    name: pet.name,
    stage: pet.stage,
    createdAt: pet.createdAt,
    hatchedAt: pet.hatchedAt,
  };
}

function toStateValues(state: PetState) {
  return {
    petId: state.petId,
    hunger: state.hunger,
    energy: state.energy,
    happiness: state.happiness,
    bond: state.bond,
    currentActivity: state.currentActivity,
    lastInteractionAt: state.lastInteractionAt,
    lastSimulatedAt: state.lastSimulatedAt,
    sleepStartedAt: state.sleepStartedAt,
  };
}

function toPersonalityValues(personality: PersonalityState) {
  const { traits, daily } = personality;

  return {
    petId: personality.petId,
    ...traits,
    dailyDeltaDate: daily.day,
    playfulDailyDelta: daily.deltas.playful,
    curiousDailyDelta: daily.deltas.curious,
    shyDailyDelta: daily.deltas.shy,
    independentDailyDelta: daily.deltas.independent,
    clingyDailyDelta: daily.deltas.clingy,
    independentSignalDate: personality.lastIndependentSignalDay,
  };
}

function toAggregate(petRow: PetRow, stateRow: PetStateRow, personalityRow: PersonalityRow | null): PetAggregate {
  return {
    pet: toPet(petRow),
    state: toPetState(stateRow),
    ...(personalityRow ? { personality: toPersonality(personalityRow) } : {}),
    version: petRow.version,
  };
}

function toPersonality(row: PersonalityRow): PersonalityState {
  return createPersonalityState({
    petId: row.petId,
    traits: {
      playful: row.playful,
      curious: row.curious,
      shy: row.shy,
      independent: row.independent,
      clingy: row.clingy,
    },
    daily: {
      day: row.dailyDeltaDate,
      deltas: {
        playful: row.playfulDailyDelta,
        curious: row.curiousDailyDelta,
        shy: row.shyDailyDelta,
        independent: row.independentDailyDelta,
        clingy: row.clingyDailyDelta,
      },
    },
    lastIndependentSignalDay: row.independentSignalDate,
  });
}

function toPet(row: PetRow): Pet {
  if (row.stage === 'EGG') {
    return { id: row.id, stage: 'EGG', name: null, createdAt: row.createdAt, hatchedAt: null };
  }

  if (row.stage === 'BABY' && row.hatchedAt) {
    return { id: row.id, stage: 'BABY', name: row.name, createdAt: row.createdAt, hatchedAt: row.hatchedAt };
  }

  throw new RangeError(`Stored pet ${row.id} has an unsupported stage "${row.stage}".`);
}

function toPetState(row: PetStateRow): PetState {
  return createPetState({
    petId: row.petId,
    hunger: row.hunger,
    energy: row.energy,
    happiness: row.happiness,
    bond: row.bond,
    currentActivity: row.currentActivity as PetActivity,
    lastInteractionAt: row.lastInteractionAt,
    lastSimulatedAt: row.lastSimulatedAt,
    sleepStartedAt: row.sleepStartedAt,
  });
}

function toStoredEvent(row: EventRow): StoredEvent {
  return {
    id: row.id,
    petId: row.petId,
    type: row.type as DomainEventType,
    occurredAt: row.occurredAt,
    payload: row.data,
  };
}

function toConversation(row: ConversationRow): Conversation {
  return { id: row.id, petId: row.petId, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

function toStoredMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as MessageRole,
    content: row.content,
    clientMessageId: row.clientMessageId,
    replyToMessageId: row.replyToMessageId,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

function required<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('Database write did not return a row.');
  }

  return value;
}
