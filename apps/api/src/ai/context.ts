import type {
  EnergyLabel,
  FullnessLabel,
  HappinessLabel,
  Mood,
  PetActivity,
  PetEventType,
  PetSnapshot,
  PetStage,
} from '@ai-virtual-pet/contracts';
import {
  DEFAULT_PERSONALITY_RULES,
  derivePersonalityPromptProfile,
  type PersonalityPromptProfile,
  type PersonalityRules,
  type PetPersonality,
} from '@ai-virtual-pet/domain';

import type { MessageRole, StoredMessage } from '../persistence/repositories.js';

/**
 * Provider-independent character context (plan Phase 6): the authoritative reality the AI
 * performs from. Built from the saved snapshot, never from raw database rows, and holding only
 * labels — the pet never sees or quotes raw stat numbers.
 */

export type RelationshipLevel = 'LOW' | 'DEVELOPING' | 'CLOSE';

export interface ContextEvent {
  readonly type: ContextEventType;
  readonly minutesAgo: number;
  /** For PET_STARTED_SLEEPING: the pet fell asleep on its own rather than being put to bed. */
  readonly autonomous?: true;
}

export interface ContextMessage {
  readonly role: MessageRole;
  readonly content: string;
}

export interface AICharacterContext {
  readonly pet: { readonly name: string | null; readonly stage: PetStage };
  readonly reality: {
    readonly activity: PetActivity;
    readonly asleep: boolean;
    readonly mood: Mood;
    readonly fullness: FullnessLabel;
    readonly energy: EnergyLabel;
    readonly happiness: HappinessLabel;
  };
  readonly personality: PersonalityPromptProfile;
  readonly relationship: RelationshipLevel;
  /** Oldest first, excluding the current message. Short-term context only — not Memory. */
  readonly recentMessages: readonly ContextMessage[];
  /** Oldest first. */
  readonly recentEvents: readonly ContextEvent[];
  readonly currentMessage: string;
  readonly usage: ContextUsage;
}

/** Approximate size, for observability and the size guard (plan Task 6.7). */
export interface ContextUsage {
  readonly approxChars: number;
  readonly approxTokens: number;
  readonly messagesIncluded: number;
  readonly messagesDropped: number;
  readonly eventsIncluded: number;
  readonly eventsDropped: number;
}

export interface ContextLimits {
  /** Plan Task 3.5 / 6.4. */
  readonly maxMessages: number;
  /** Plan Task 6.3. */
  readonly maxEvents: number;
  /** Beyond this, oldest messages then oldest events are dropped. */
  readonly maxChars: number;
}

export const DEFAULT_CONTEXT_LIMITS: ContextLimits = Object.freeze({
  maxMessages: 12,
  maxEvents: 5,
  // ≈ 2,000 tokens of variable context on top of the fixed instructions.
  maxChars: 8_000,
});

/** Events that give the pet immediate continuity. Activity noise and debug edits are excluded. */
export const CONTEXT_EVENT_TYPES = ['PET_FED', 'PET_PLAYED', 'PET_STARTED_SLEEPING', 'PET_WOKE_UP'] as const satisfies readonly PetEventType[];
export type ContextEventType = (typeof CONTEXT_EVENT_TYPES)[number];

/** Plan Task 6.2. AI context only; never shown to the player. */
export function relationshipLevel(bond: number): RelationshipLevel {
  if (bond < 25) {
    return 'LOW';
  }

  return bond < 60 ? 'DEVELOPING' : 'CLOSE';
}

export interface CharacterContextInput {
  /** The authoritative snapshot saved for this turn (after any action). */
  readonly snapshot: PetSnapshot;
  readonly personality: PetPersonality;
  /** Recent stored messages, any order; may include the current message, which is removed. */
  readonly messages: readonly StoredMessage[];
  readonly currentMessage: { readonly id?: number; readonly content: string };
  readonly limits?: ContextLimits;
  readonly personalityRules?: PersonalityRules;
}

// Fixed-size parts (instructions, reality, personality) are not counted: the guard only trims
// the variable parts, and the fixed parts are always kept.
const EVENT_CHARS = 40;
const CHARS_PER_TOKEN = 4;

export function buildCharacterContext(input: CharacterContextInput): AICharacterContext {
  const limits = input.limits ?? DEFAULT_CONTEXT_LIMITS;
  const { snapshot } = input;
  const now = new Date(snapshot.state.lastSimulatedAt).getTime();

  const history = [...input.messages]
    .filter((message) => message.id !== input.currentMessage.id)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id)
    .slice(-limits.maxMessages)
    .map(({ role, content }): ContextMessage => ({ role, content }));

  // Snapshot events are newest first.
  const events = snapshot.recentEvents
    .filter((event): event is typeof event & { type: ContextEventType } =>
      (CONTEXT_EVENT_TYPES as readonly PetEventType[]).includes(event.type),
    )
    .slice(0, limits.maxEvents)
    .reverse()
    .map((event): ContextEvent => ({
      type: event.type,
      minutesAgo: Math.max(0, Math.round((now - new Date(event.occurredAt).getTime()) / 60_000)),
      ...(event.type === 'PET_STARTED_SLEEPING' && event.payload.source === 'AUTONOMOUS' ? { autonomous: true } : {}),
    }));

  const fitted = fitToBudget(history, events, input.currentMessage.content.length, limits.maxChars);

  return {
    pet: { name: snapshot.pet.name, stage: snapshot.pet.stage },
    reality: {
      activity: snapshot.state.currentActivity,
      asleep: snapshot.state.currentActivity === 'SLEEPING',
      mood: snapshot.derived.mood,
      fullness: snapshot.derived.needs.fullness,
      energy: snapshot.derived.needs.energy,
      happiness: snapshot.derived.needs.happiness,
    },
    personality: derivePersonalityPromptProfile(input.personality, input.personalityRules ?? DEFAULT_PERSONALITY_RULES),
    relationship: relationshipLevel(snapshot.state.bond),
    recentMessages: fitted.messages,
    recentEvents: fitted.events,
    currentMessage: input.currentMessage.content,
    usage: {
      approxChars: fitted.chars,
      approxTokens: Math.ceil(fitted.chars / CHARS_PER_TOKEN),
      messagesIncluded: fitted.messages.length,
      messagesDropped: history.length - fitted.messages.length,
      eventsIncluded: fitted.events.length,
      eventsDropped: events.length - fitted.events.length,
    },
  };
}

/**
 * Plan Task 6.7: keep the current message, then drop the oldest conversation messages, then the
 * oldest events, until the variable context fits.
 */
function fitToBudget(
  messages: readonly ContextMessage[],
  events: readonly ContextEvent[],
  currentChars: number,
  maxChars: number,
): { messages: ContextMessage[]; events: ContextEvent[]; chars: number } {
  const kept = { messages: [...messages], events: [...events] };
  const size = () =>
    currentChars +
    kept.messages.reduce((sum, message) => sum + message.content.length, 0) +
    kept.events.length * EVENT_CHARS;

  while (size() > maxChars && kept.messages.length > 0) {
    kept.messages.shift();
  }

  while (size() > maxChars && kept.events.length > 0) {
    kept.events.shift();
  }

  return { ...kept, chars: size() };
}
