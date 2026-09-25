import {
  createPetState,
  type DomainEvent,
  type DomainEventType,
  type Pet,
  type PetActivity,
  type PetId,
  type PetState,
} from '@ai-virtual-pet/domain';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { events, pets, petStates } from '../db/schema.js';
import {
  ConcurrencyError,
  PetAlreadyExistsError,
  PetNotFoundError,
  assertStateBelongsToPet,
  type EventQuery,
  type EventRepository,
  type PetAggregate,
  type PetRepository,
  type SavePetInput,
  type StoredEvent,
} from './repositories.js';

/** Arbitrary application-wide advisory lock key guarding single-pet creation. */
const SINGLE_PET_CREATE_LOCK = 42_01;

type PetRow = typeof pets.$inferSelect;
type PetStateRow = typeof petStates.$inferSelect;
type EventRow = typeof events.$inferSelect;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export class DrizzlePetRepository implements PetRepository {
  constructor(private readonly db: Database) {}

  async findCurrent(): Promise<PetAggregate | null> {
    const [row] = await this.db
      .select({ pet: pets, state: petStates })
      .from(pets)
      .innerJoin(petStates, eq(petStates.petId, pets.id))
      .orderBy(desc(pets.createdAt))
      .limit(1);

    return row ? toAggregate(row.pet, row.state) : null;
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

      return toAggregate(required(petRow), required(stateRow));
    });
  }

  async save(input: SavePetInput): Promise<PetAggregate> {
    assertStateBelongsToPet(input.pet, input.state);

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
      await insertEvents(tx, input.pet.id, input.events);

      return toAggregate(petRow, required(stateRow));
    });
  }

  async deleteAll(): Promise<void> {
    // pet_states and events cascade.
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

function toAggregate(petRow: PetRow, stateRow: PetStateRow): PetAggregate {
  return { pet: toPet(petRow), state: toPetState(stateRow), version: petRow.version };
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

function required<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('Database write did not return a row.');
  }

  return value;
}
