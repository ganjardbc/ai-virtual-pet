import type {
  DebugAdvanceTimeRequest,
  DebugAdvanceTimeResult,
  DebugAi,
  DebugCommandResult,
  DebugContext,
  DebugPersonality,
  DebugResetResult,
  DebugSetPersonalityRequest,
  DebugSetStateRequest,
  DebugState,
  DebugTurn,
  PetSnapshot,
} from '@ai-virtual-pet/contracts';
import { chatActionSchema, chatIntentSchema } from '@ai-virtual-pet/contracts';
import {
  PERSONALITY_PRESETS,
  clampStat,
  createDomainEvent,
  createPetState,
  derivePersonalityPromptProfile,
  setPersonalityTraits,
  wakePet,
  type PetPersonality,
  type PersonalityRules,
  type PersonalityState,
  type PetState,
} from '@ai-virtual-pet/domain';
import { moodCandidates } from '@ai-virtual-pet/simulation';

import { buildCharacterContext } from '../ai/context.js';
import {
  DEFAULT_CONVERSATION_LIMITS,
  type ConversationLimits,
} from '../application/conversation-service.js';
import { ApplicationError } from '../application/errors.js';
import { PetService, type Loaded, type PetServiceDependencies } from '../application/pet-service.js';
import { toPetEventDto } from '../application/snapshot.js';
import type { ConversationRepository, StoredMessage } from '../persistence/repositories.js';
import type { OffsetClock } from './offset-clock.js';

const HOUR_MS = 60 * 60 * 1_000;
const DEBUG_EVENT_LIMIT = 25;
const STAT_KEYS = ['hunger', 'energy', 'happiness', 'bond'] as const;

export interface DebugServiceDependencies extends PetServiceDependencies {
  readonly clock: OffsetClock;
  readonly conversations: ConversationRepository;
  readonly conversationLimits?: ConversationLimits;
}

/**
 * Development-only commands. They reuse the normal load → simulate → save-with-retry flow,
 * so time travel exercises the real simulation instead of editing stats directly.
 */
export class DebugPetService extends PetService {
  private readonly debugClock: OffsetClock;
  private readonly debugDeps: DebugServiceDependencies;

  constructor(deps: DebugServiceDependencies) {
    super(deps);
    this.debugClock = deps.clock;
    this.debugDeps = deps;
  }

  async getState(): Promise<DebugState> {
    return this.mutate((loaded) => ({
      pet: loaded.aggregate.pet,
      state: loaded.state,
      events: [],
      result: (snapshot) => this.debugState(snapshot, loaded.state, loaded.now),
    }));
  }

  async advanceTime(request: DebugAdvanceTimeRequest): Promise<DebugAdvanceTimeResult> {
    await this.requireCurrent();
    const advancedMs = (request.hours ?? 0) * HOUR_MS + (request.days ?? 0) * 24 * HOUR_MS;

    this.debugClock.advanceBy(advancedMs);
    return { ...(await this.getState()), advancedMs };
  }

  async forceSleep(): Promise<DebugCommandResult> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);

      if (state.currentActivity === 'SLEEPING') {
        return this.rejected(loaded, 'SLEEPING');
      }

      // Not a player interaction: no Bond, no lastInteractionAt.
      const sleeping = createPetState({ ...state, currentActivity: 'SLEEPING', sleepStartedAt: now });

      return {
        pet: aggregate.pet,
        state: sleeping,
        events: [createDomainEvent('PET_STARTED_SLEEPING', now, { source: 'DEBUG' })],
        result: async (snapshot) => ({
          status: 'SUCCESS',
          state: await this.debugState(snapshot, sleeping, now),
        }),
      };
    });
  }

  async wake(): Promise<DebugCommandResult> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);
      const outcome = wakePet(state, now);

      if (!outcome.accepted) {
        return this.rejected(loaded, outcome.reason);
      }

      return {
        pet: aggregate.pet,
        state: outcome.state,
        events: [createDomainEvent('PET_WOKE_UP', now, { source: 'DEBUG' })],
        result: async (snapshot) => ({
          status: 'SUCCESS',
          state: await this.debugState(snapshot, outcome.state, now),
        }),
      };
    });
  }

  async setState(request: DebugSetStateRequest): Promise<DebugState> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);
      const before: Partial<Record<(typeof STAT_KEYS)[number], number>> = {};
      const after: Partial<Record<(typeof STAT_KEYS)[number], number>> = {};

      for (const key of STAT_KEYS) {
        const requested = request[key];

        if (requested !== undefined) {
          before[key] = state[key];
          after[key] = clampStat(requested);
        }
      }

      const next = createPetState({ ...state, ...after });

      return {
        pet: aggregate.pet,
        state: next,
        events: [createDomainEvent('DEBUG_STATE_CHANGED', now, { before, after })],
        result: (snapshot) => this.debugState(snapshot, next, now),
      };
    });
  }

  async reset(): Promise<DebugResetResult> {
    await this.deps.pets.deleteAll();
    this.debugClock.reset();
    return { reset: true };
  }

  /** Latest AI turn metadata, current personality with daily deltas, and bounded context (Tasks 10.5, 10.6). */
  async getAi(): Promise<DebugAi> {
    return this.mutate(async ({ aggregate, state, personality, now }) => ({
      pet: aggregate.pet,
      state,
      events: [],
      result: (snapshot) => this.debugAi(snapshot, personality, now),
    }));
  }

  /** Debug-only direct trait mutation; clamped, normalized, and never touching daily delta tracking (Task 10.3). */
  async setPersonality(request: DebugSetPersonalityRequest): Promise<DebugAi> {
    return this.mutate((loaded) => {
      const { aggregate, state, personality, now } = this.requireHatched(loaded);

      if (!personality) {
        throw new ApplicationError('INVALID_PET_STAGE', 'Debug personality commands need a hatched pet.');
      }

      const preset = request.preset ? PERSONALITY_PRESETS[request.preset] : undefined;

      if (request.preset && !preset) {
        throw new ApplicationError('VALIDATION_ERROR', `Unknown personality preset "${request.preset}".`);
      }

      const values: Partial<PetPersonality> =
        preset ??
        {
          ...(request.playful !== undefined ? { playful: request.playful } : {}),
          ...(request.curious !== undefined ? { curious: request.curious } : {}),
          ...(request.shy !== undefined ? { shy: request.shy } : {}),
          ...(request.independent !== undefined ? { independent: request.independent } : {}),
          ...(request.clingy !== undefined ? { clingy: request.clingy } : {}),
        };
      const result = setPersonalityTraits(personality, values, this.personalityRules);
      // Recorded as one reason-tagged event so a debug mutation is distinguishable in the log.
      const events =
        result.changes.length > 0
          ? [createDomainEvent('PERSONALITY_CHANGED', now, { changes: result.changes, reason: 'DEBUG' })]
          : [];

      return {
        pet: aggregate.pet,
        state,
        events,
        personality: result.state,
        result: (snapshot) => this.debugAi(snapshot, result.state, now),
      };
    });
  }

  private requireHatched(loaded: Loaded): Loaded {
    if (loaded.aggregate.pet.stage === 'EGG') {
      throw new ApplicationError('INVALID_PET_STAGE', 'Debug state commands need a hatched pet.');
    }

    return loaded;
  }

  /** A debug command that does not apply; simulated time is still saved. */
  private rejected(loaded: Loaded, reason: 'SLEEPING' | 'INVALID_STATE' | 'TOO_TIRED' | 'TOO_FULL') {
    return {
      pet: loaded.aggregate.pet,
      state: loaded.state,
      events: [],
      result: async (snapshot: PetSnapshot): Promise<DebugCommandResult> => ({
        status: 'REJECTED',
        reason,
        state: await this.debugState(snapshot, loaded.state, loaded.now),
      }),
    };
  }

  private async debugState(snapshot: PetSnapshot, state: PetState, now: Date): Promise<DebugState> {
    const petId = snapshot.pet.id;
    const excitedSince = new Date(now.getTime() - this.rules.mood.excitedWithinMs);
    const [events, recentPlays] = await Promise.all([
      this.deps.events.listRecent(petId, { limit: DEBUG_EVENT_LIMIT }),
      this.deps.events.listOccurrenceTimes(petId, 'PET_PLAYED', excitedSince),
    ]);

    return {
      pet: snapshot,
      debug: {
        clock: { now: now.toISOString(), offsetMs: this.debugClock.offsetMs },
        moodCandidates: moodCandidates({ state, now, lastPlayedAt: recentPlays.at(-1) ?? null }, this.rules),
        events: events.map(toPetEventDto),
      },
    };
  }

  private async debugAi(
    snapshot: PetSnapshot,
    personality: PersonalityState | null,
    now: Date,
  ): Promise<DebugAi> {
    if (snapshot.pet.stage === 'EGG' || !personality) {
      return { lastTurn: null, personality: null, context: null };
    }

    const dto = toDebugPersonality(personality, this.personalityRules);

    return {
      lastTurn: await this.latestTurn(snapshot.pet.id),
      personality: dto,
      context: await this.debugContext(snapshot, personality, dto),
    };
  }

  private async latestTurn(petId: string): Promise<DebugTurn | null> {
    const conversation = await this.debugDeps.conversations.findForPet(petId);

    if (!conversation) {
      return null;
    }

    const message = await this.debugDeps.conversations.findLatestAssistantMessage(conversation.id);
    return message ? toDebugTurn(message) : null;
  }

  /** The same bounded context the AI receives, so debug inspection matches reality (Task 10.6). */
  private async debugContext(
    snapshot: PetSnapshot,
    personality: PersonalityState,
    dto: DebugPersonality,
  ): Promise<DebugContext> {
    const limits = this.debugDeps.conversationLimits ?? DEFAULT_CONVERSATION_LIMITS;
    const conversation = await this.debugDeps.conversations.findForPet(snapshot.pet.id);
    const messages = conversation
      ? await this.debugDeps.conversations.listRecentMessages(conversation.id, { limit: limits.contextWindow + 1 })
      : [];
    // Same limits and personality rules as a real chat turn, with the latest player message standing
    // in for the current message so the budget matches what the AI would actually receive.
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'USER');
    const context = buildCharacterContext({
      snapshot,
      personality: personality.traits,
      messages,
      currentMessage: { content: lastUserMessage?.content ?? '' },
      personalityRules: this.personalityRules,
    });

    return {
      state: snapshot.state,
      mood: context.reality.mood,
      relationship: context.relationship,
      levels: dto.profile.levels,
      dominantTraits: [...dto.profile.dominantTraits],
      primaryTrait: dto.profile.primaryTrait,
      strength: dto.profile.strength,
      socialStyle: dto.profile.socialStyle,
      recentMessageCount: context.usage.messagesIncluded,
      recentEventCount: context.usage.eventsIncluded,
    };
  }
}

function toDebugPersonality(personality: PersonalityState, rules: PersonalityRules): DebugPersonality {
  const prompt = derivePersonalityPromptProfile(personality.traits, rules);

  return {
    traits: { ...personality.traits },
    daily: {
      day: personality.daily.day,
      capPerTrait: rules.dailyCapPerTrait,
      deltas: { ...personality.daily.deltas },
    },
    profile: {
      levels: {
        playful: prompt.playful,
        curious: prompt.curious,
        shy: prompt.shy,
        independent: prompt.independent,
        clingy: prompt.clingy,
      },
      dominantTraits: [...prompt.dominantTraits],
      primaryTrait: prompt.primaryTrait,
      strength: prompt.strength,
      socialStyle: prompt.socialStyle,
    },
  };
}

function toDebugTurn(message: StoredMessage): DebugTurn {
  const metadata = message.metadata;
  const number = (value: unknown) => (typeof value === 'number' ? value : null);
  const boolean = (value: unknown) => (typeof value === 'boolean' ? value : null);
  const text = (value: unknown) => (typeof value === 'string' ? value : null);
  const intent = chatIntentSchema.safeParse(metadata.intent);
  const action = chatActionSchema.nullable().safeParse(metadata.action ?? null);

  return {
    intent: intent.success ? intent.data : null,
    confidence: number(metadata.intentConfidence),
    classification: text(metadata.classification),
    action: action.success ? action.data : null,
    bondDelta: number(metadata.bondDelta),
    fallbackUsed: boolean(metadata.fallbackUsed),
    responseFailure: text(metadata.responseFailure),
    interpretationFallback: boolean(metadata.interpretationFallback),
    interpretationFailure: text(metadata.interpretationFailure),
    provider: text(metadata.provider),
    model: text(metadata.model),
    latencyMs: number(metadata.latencyMs),
    inputTokens: number(metadata.inputTokens),
    outputTokens: number(metadata.outputTokens),
    occurredAt: message.createdAt.toISOString(),
  };
}
