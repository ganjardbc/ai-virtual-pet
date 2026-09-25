import type {
  DomainEvent,
  DomainEventType,
  PersonalityState,
  Pet,
  PetId,
  PetState,
} from '@ai-virtual-pet/domain';

/** A pet with its current state, as last persisted. `version` guards against stale writes. */
export interface PetAggregate {
  readonly pet: Pet;
  readonly state: PetState;
  /** Absent for an Egg, and for a Baby stored before personality existed (initialized on load). */
  readonly personality?: PersonalityState;
  readonly version: number;
}

export interface StoredEvent extends DomainEvent {
  readonly id: number;
  readonly petId: PetId;
}

export interface SavePetInput {
  readonly pet: Pet;
  readonly state: PetState;
  readonly expectedVersion: number;
  readonly events: readonly DomainEvent[];
  /**
   * Written in the same transaction, under the pet's version check, so an action and the
   * personality signal it causes commit together. Omitted: stored personality is unchanged.
   */
  readonly personality?: PersonalityState;
}

export interface PetRepository {
  /** The prototype's single pet, if one exists. */
  findCurrent(): Promise<PetAggregate | null>;
  /**
   * Creates pet, state, and initial events atomically. The prototype supports one pet, so this
   * rejects with `PetAlreadyExistsError` when any pet exists, even under concurrent creates.
   */
  create(pet: Pet, state: PetState, events?: readonly DomainEvent[]): Promise<PetAggregate>;
  /** Writes pet, state, personality, and new events atomically; rejects a stale `expectedVersion`. */
  save(input: SavePetInput): Promise<PetAggregate>;
  /** Removes every pet with its state, personality, and events (debug reset). */
  deleteAll(): Promise<void>;
}

export interface EventQuery {
  readonly limit: number;
}

export interface EventRepository {
  /** Newest first; ties keep reverse insertion order. */
  listRecent(petId: PetId, query: EventQuery): Promise<StoredEvent[]>;
  /** Occurrence times of one event type at or after `since`, oldest first (e.g. Play diminishing). */
  listOccurrenceTimes(petId: PetId, type: DomainEventType, since: Date): Promise<Date[]>;
}

export class ConcurrencyError extends Error {
  constructor(petId: PetId, expectedVersion: number) {
    super(`Pet ${petId} was modified concurrently (expected version ${expectedVersion}).`);
    this.name = 'ConcurrencyError';
  }
}

export class PetAlreadyExistsError extends Error {
  constructor() {
    super('A pet already exists.');
    this.name = 'PetAlreadyExistsError';
  }
}

export class PetNotFoundError extends Error {
  constructor(petId: PetId) {
    super(`Pet ${petId} does not exist.`);
    this.name = 'PetNotFoundError';
  }
}

export function assertStateBelongsToPet(pet: Pet, state: PetState, personality?: PersonalityState): void {
  if (pet.id !== state.petId) {
    throw new RangeError(`State for pet ${state.petId} cannot be stored on pet ${pet.id}.`);
  }

  if (personality && personality.petId !== pet.id) {
    throw new RangeError(`Personality for pet ${personality.petId} cannot be stored on pet ${pet.id}.`);
  }
}
