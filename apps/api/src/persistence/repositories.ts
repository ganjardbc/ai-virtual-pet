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
  /** Event types to leave out (e.g. debug-only events from the player snapshot). */
  readonly excludeTypes?: readonly DomainEventType[];
}

export interface EventRepository {
  /** Newest first; ties keep reverse insertion order. */
  listRecent(petId: PetId, query: EventQuery): Promise<StoredEvent[]>;
  /** Occurrence times of one event type at or after `since`, oldest first (e.g. Play diminishing). */
  listOccurrenceTimes(petId: PetId, type: DomainEventType, since: Date): Promise<Date[]>;
  /** Events of one type at or after `since`, oldest first (e.g. today's Talk Bond). */
  listSince(petId: PetId, type: DomainEventType, since: Date): Promise<StoredEvent[]>;
  /** Events recorded for one chat turn (payload `turnMessageId`), oldest first — turn idempotency. */
  listForTurn(petId: PetId, turnMessageId: number): Promise<StoredEvent[]>;
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

// ---- Conversation (Prototype 0.2). Chat history is short-term context, never Memory. ----

export type MessageRole = 'USER' | 'ASSISTANT';

/** Turn observability for debugging (intent, provider, latency…). Never prompts or reasoning. */
export type MessageMetadata = Readonly<Record<string, unknown>>;

export interface Conversation {
  readonly id: string;
  readonly petId: PetId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A player message carries the client's idempotency key; a reply names the message it answers. */
export type NewMessage =
  | {
      readonly role: 'USER';
      readonly content: string;
      readonly clientMessageId: string;
      readonly createdAt: Date;
    }
  | {
      readonly role: 'ASSISTANT';
      readonly content: string;
      readonly replyToMessageId: number;
      readonly metadata?: MessageMetadata;
      readonly createdAt: Date;
    };

export interface StoredMessage {
  readonly id: number;
  readonly conversationId: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly clientMessageId: string | null;
  readonly replyToMessageId: number | null;
  readonly metadata: MessageMetadata;
  readonly createdAt: Date;
}

/** A player turn found by its idempotency key, with the reply if one was stored. */
export interface ConversationTurn {
  readonly user: StoredMessage;
  readonly reply: StoredMessage | null;
}

export interface MessageQuery {
  readonly limit: number;
}

export interface ConversationRepository {
  findForPet(petId: PetId): Promise<Conversation | null>;
  /** The pet's single conversation, stored from `candidate` if it has none yet (safe under races). */
  getOrCreateForPet(candidate: Conversation): Promise<Conversation>;
  /**
   * Appends a message and bumps the conversation's `updatedAt`. Rejects with
   * `DuplicateMessageError` for a reused `clientMessageId` or a second reply to the same message,
   * and with `RangeError` for a reply to anything other than a player message in this conversation.
   */
  appendMessage(conversationId: string, message: NewMessage): Promise<StoredMessage>;
  findTurn(conversationId: string, clientMessageId: string): Promise<ConversationTurn | null>;
  /** The latest `limit` messages, oldest first. AI context and visible history use different limits. */
  listRecentMessages(conversationId: string, query: MessageQuery): Promise<StoredMessage[]>;
}

export class DuplicateMessageError extends Error {
  constructor(conversationId: string) {
    super(`Message already stored for this turn in conversation ${conversationId}.`);
    this.name = 'DuplicateMessageError';
  }
}

export class ConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} does not exist.`);
    this.name = 'ConversationNotFoundError';
  }
}

export function assertMessageContent(content: string): void {
  if (content.length === 0) {
    throw new RangeError('Message content cannot be empty.');
  }
}
