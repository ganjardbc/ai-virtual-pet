import type { DomainEvent, DomainEventType, Pet, PetId, PetState } from '@ai-virtual-pet/domain';

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

interface MemoryRecord {
  aggregate: PetAggregate;
  sequence: number;
}

/** In-process repositories with the same contract as the Drizzle implementation, for fast tests. */
export class InMemoryStore implements PetRepository, EventRepository {
  private readonly pets = new Map<PetId, MemoryRecord>();
  private readonly eventLog: StoredEvent[] = [];
  private nextEventId = 1;
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
    assertStateBelongsToPet(input.pet, input.state);
    const record = this.pets.get(input.pet.id);

    if (!record) {
      throw new PetNotFoundError(input.pet.id);
    }

    if (record.aggregate.version !== input.expectedVersion) {
      throw new ConcurrencyError(input.pet.id, input.expectedVersion);
    }

    const aggregate: PetAggregate = {
      pet: input.pet,
      state: input.state,
      version: input.expectedVersion + 1,
    };
    record.aggregate = structuredClone(aggregate);
    this.append(input.pet.id, input.events);
    return structuredClone(aggregate);
  }

  async deleteAll(): Promise<void> {
    this.pets.clear();
    this.eventLog.length = 0;
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

  private append(petId: PetId, events: readonly DomainEvent[]): void {
    for (const event of events) {
      this.eventLog.push(structuredClone({ ...event, id: this.nextEventId++, petId }));
    }
  }
}
