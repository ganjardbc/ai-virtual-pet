import { randomUUID } from 'node:crypto';

import {
  ACTION_REACTION_TEXT,
  actionReactionKind,
  chatActionSchema,
  chatIntentSchema,
  type ActionResult,
  type ActionType,
  type ChatAction,
  type ChatRequest,
  type ChatTurnResult,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';
import type { Clock, PersonalityRules, PersonalitySignal } from '@ai-virtual-pet/domain';

import { DEFAULT_AI_TIMEOUTS, type AITimeouts } from '../ai/config.js';
import { buildCharacterContext } from '../ai/context.js';
import { generateCharacterResponse, type ResponseOutcome } from '../ai/character-response.js';
import {
  DEFAULT_INTERPRETATION_RULES,
  interpretMessage,
  isCareIntent,
  type ConversationClassification,
  type InterpretationOutcome,
  type InterpretationRules,
} from '../ai/interpretation.js';
import type { AIProvider, AIUsage } from '../ai/provider.js';
import { TurnBudget } from '../ai/turn-budget.js';
import {
  DuplicateMessageError,
  type Conversation,
  type ConversationRepository,
  type EventRepository,
  type StoredEvent,
  type MessageMetadata,
  type PetRepository,
  type StoredMessage,
} from '../persistence/repositories.js';
import { ChatTurnGuard } from './chat-guard.js';
import { DEFAULT_CONVERSATION_LIMITS, toChatMessageDto, type ConversationLimits } from './conversation-service.js';
import { ApplicationError } from './errors.js';
import { ACTION_PERSONALITY_SIGNAL, type PetService } from './pet-service.js';

/** Plan Task 7.7: each classification maps 1:1 to a personality signal. */
const CLASSIFICATION_SIGNAL: Readonly<Record<ConversationClassification, PersonalitySignal>> = {
  PLAYFUL: 'PLAY',
  CURIOUS: 'CURIOSITY',
  AFFECTION: 'AFFECTION',
  COMFORTING: 'COMFORT',
  CARE: 'CARE',
  PRAISE: 'PRAISE',
  TEASING: 'TEASING',
  CASUAL: 'CASUAL',
};

export interface ChatServiceDependencies {
  /** Care actions and Talk go through the same service as the buttons (plan Task 7.5). */
  readonly petService: PetService;
  readonly pets: PetRepository;
  readonly events: EventRepository;
  readonly conversations: ConversationRepository;
  readonly ai: AIProvider;
  readonly clock: Clock;
  readonly guard?: ChatTurnGuard;
  readonly aiTimeouts?: AITimeouts;
  readonly conversationLimits?: ConversationLimits;
  readonly interpretationRules?: InterpretationRules;
  /** Personality thresholds for the prompt profile; the same rules the pet evolves under. */
  readonly personalityRules?: PersonalityRules;
  /** Monotonic milliseconds for the turn budget (wall time spent waiting, not game time). */
  readonly monotonicNow?: () => number;
  readonly createId?: () => string;
}

/**
 * The canonical chat turn (plan Phase 7): AI interprets → Game Engine decides → AI performs the
 * actual result. The AI never changes state itself; every state change goes through PetService.
 * No database transaction is held open during an AI call (scope §103).
 */
export class ChatService {
  private readonly guard: ChatTurnGuard;

  constructor(private readonly deps: ChatServiceDependencies) {
    this.guard = deps.guard ?? new ChatTurnGuard();
  }

  async chat(request: ChatRequest): Promise<ChatTurnResult> {
    const current = await this.deps.pets.findCurrent();

    if (!current) {
      throw new ApplicationError('PET_NOT_FOUND', 'No pet exists yet.');
    }

    return this.guard.run(current.pet.id, () => this.runTurn(request));
  }

  private async runTurn(request: ChatRequest): Promise<ChatTurnResult> {
    // Catch up on elapsed time and persist it before anything else (plan Task 7.2).
    const loaded = await this.deps.petService.getPet();

    if (loaded.pet.stage === 'EGG') {
      throw new ApplicationError('INVALID_PET_STAGE', 'An Egg cannot talk yet.');
    }

    const existing = await this.findExistingTurn(loaded.pet.id, request);

    if (existing?.reply) {
      // A retry of a completed turn: same reply, no AI call, nothing applied again (Task 3.8).
      return storedTurnResult(existing.reply, loaded);
    }

    if (loaded.state.currentActivity === 'SLEEPING') {
      // Checked before the message is stored: a sleeping pet's Talk never begins (Task 7.3).
      throw new ApplicationError('PET_SLEEPING', 'The pet is sleeping.');
    }

    const conversation = await this.conversation(loaded.pet.id);
    const user = existing?.user ?? (await this.appendUserMessage(conversation, request));
    // A resumed turn may already have acted before the process failed to store the reply.
    const executed = existing ? executedAction(await this.deps.events.listForTurn(loaded.pet.id, user.id)) : null;

    return executed
      ? this.completeResumedActionTurn(conversation, user, loaded, executed)
      : this.completeTurn(conversation, user, loaded);
  }

  private async completeTurn(conversation: Conversation, user: StoredMessage, loaded: PetSnapshot): Promise<ChatTurnResult> {
    const budget = this.budget();
    const interpreted = await interpretMessage(
      this.deps.ai,
      { message: user.content, petName: loaded.pet.name },
      budget.timeoutFor('INTERPRETATION'),
      this.deps.interpretationRules ?? DEFAULT_INTERPRETATION_RULES,
    );
    const { interpretation } = interpreted;
    const signal = CLASSIFICATION_SIGNAL[interpretation.classification];

    // The Game Engine revalidates against the latest state and may still reject (Task 7.5).
    const actionResult = isCareIntent(interpretation.intent)
      ? await this.deps.petService.act(interpretation.intent, {
          turnMessageId: user.id,
          // A rejected "Main yuk!" must not still teach Playful through its PLAYFUL tone (Task 2.5).
          ...(signal === ACTION_PERSONALITY_SIGNAL[interpretation.intent] ? {} : { rejectedSignal: signal }),
        })
      : null;
    const outcome = actionResult ? fromActionResult(actionResult) : null;
    const action = outcome?.action ?? null;
    let snapshot = actionResult?.pet ?? loaded;

    const response = await generateCharacterResponse(
      this.deps.ai,
      await this.characterContext(conversation, user, snapshot),
      action,
      budget.timeoutFor('RESPONSE'),
    );

    const content = response.message ?? (outcome ? fallbackReaction(outcome) : null);

    if (content === null) {
      // No action happened and the pet could not answer: say so honestly instead of faking a
      // conversation. The player message stays stored; Retry resumes this turn (Task 7.16).
      throw new ApplicationError('AI_UNAVAILABLE', 'The pet could not respond right now.', {
        reason: response.failure?.reason ?? 'UNAVAILABLE',
      });
    }

    let talkBondDelta = 0;

    if (interpretation.intent === 'TALK' && response.message !== null) {
      const talk = await this.deps.petService.recordTalk({
        turnMessageId: user.id,
        classification: interpretation.classification,
        signal,
        meaningful: interpretation.classification !== 'CASUAL',
      });
      snapshot = talk.pet;
      talkBondDelta = talk.bondDelta;
    }

    const reply = await this.appendReply(conversation, user, content, {
      intent: interpretation.intent,
      rawIntent: interpretation.rawIntent,
      intentConfidence: interpretation.confidence,
      classification: interpretation.classification,
      interpretationFallback: interpretation.fallbackUsed,
      interpretationFailure: interpreted.failure?.reason ?? null,
      action,
      bondDelta: outcome ? outcome.bondDelta : talkBondDelta,
      fallbackUsed: response.message === null,
      responseFailure: response.failure?.reason ?? null,
      ...usageMetadata(interpreted, response, this.deps.ai),
    });

    return { message: toChatMessageDto(reply), intent: interpretation.intent, action, pet: snapshot };
  }

  /**
   * The action of this turn already committed; only the reply is missing (e.g. the process failed
   * before storing it). Never interpret or act again — react to what actually happened.
   */
  private async completeResumedActionTurn(
    conversation: Conversation,
    user: StoredMessage,
    snapshot: PetSnapshot,
    outcome: ActionOutcome,
  ): Promise<ChatTurnResult> {
    const response = await generateCharacterResponse(
      this.deps.ai,
      await this.characterContext(conversation, user, snapshot),
      outcome.action,
      this.budget().timeoutFor('RESPONSE'),
    );
    const reply = await this.appendReply(conversation, user, response.message ?? fallbackReaction(outcome), {
      intent: outcome.action.type,
      rawIntent: outcome.action.type,
      intentConfidence: null,
      classification: null,
      resumedAction: true,
      action: outcome.action,
      bondDelta: outcome.bondDelta,
      fallbackUsed: response.message === null,
      responseFailure: response.failure?.reason ?? null,
      provider: this.deps.ai.name,
      model: this.deps.ai.model,
      latencyMs: response.usage?.latencyMs ?? 0,
      inputTokens: response.usage?.inputTokens ?? null,
      outputTokens: response.usage?.outputTokens ?? null,
    });

    return { message: toChatMessageDto(reply), intent: outcome.action.type, action: outcome.action, pet: snapshot };
  }

  private budget(): TurnBudget {
    return new TurnBudget(this.deps.aiTimeouts ?? DEFAULT_AI_TIMEOUTS, this.deps.monotonicNow);
  }

  private async findExistingTurn(petId: string, request: ChatRequest) {
    const conversation = await this.deps.conversations.findForPet(petId);
    const turn = conversation ? await this.deps.conversations.findTurn(conversation.id, request.clientMessageId) : null;

    if (turn && turn.user.content !== request.message) {
      throw new ApplicationError('VALIDATION_ERROR', 'clientMessageId was already used for a different message.');
    }

    return turn;
  }

  private conversation(petId: string): Promise<Conversation> {
    const now = this.deps.clock.now();
    return this.deps.conversations.getOrCreateForPet({
      id: (this.deps.createId ?? randomUUID)(),
      petId,
      createdAt: now,
      updatedAt: now,
    });
  }

  private async appendUserMessage(conversation: Conversation, request: ChatRequest): Promise<StoredMessage> {
    return this.withoutDuplicate(() =>
      this.deps.conversations.appendMessage(conversation.id, {
        role: 'USER',
        content: request.message,
        clientMessageId: request.clientMessageId,
        createdAt: this.deps.clock.now(),
      }),
    );
  }

  private async appendReply(
    conversation: Conversation,
    user: StoredMessage,
    content: string,
    metadata: MessageMetadata,
  ): Promise<StoredMessage> {
    return this.withoutDuplicate(() =>
      this.deps.conversations.appendMessage(conversation.id, {
        role: 'ASSISTANT',
        content,
        replyToMessageId: user.id,
        metadata,
        createdAt: this.deps.clock.now(),
      }),
    );
  }

  /** The guard serializes turns per pet, so a duplicate means another process raced this turn. */
  private async withoutDuplicate(append: () => Promise<StoredMessage>): Promise<StoredMessage> {
    try {
      return await append();
    } catch (error) {
      if (error instanceof DuplicateMessageError) {
        throw new ApplicationError('CHAT_IN_PROGRESS', 'This message is already being answered.');
      }

      throw error;
    }
  }

  /** Context rebuilt after the action, from what was actually saved (plan Task 7.9). */
  private async characterContext(conversation: Conversation, user: StoredMessage, snapshot: PetSnapshot) {
    const limits = this.deps.conversationLimits ?? DEFAULT_CONVERSATION_LIMITS;
    const [aggregate, messages] = await Promise.all([
      this.deps.pets.findCurrent(),
      this.deps.conversations.listRecentMessages(conversation.id, { limit: limits.contextWindow + 1 }),
    ]);

    if (!aggregate?.personality) {
      throw new ApplicationError('INVALID_PET_STAGE', 'The pet has no personality yet.');
    }

    return buildCharacterContext({
      snapshot,
      personality: aggregate.personality.traits,
      messages,
      currentMessage: { id: user.id, content: user.content },
      ...(this.deps.personalityRules ? { personalityRules: this.deps.personalityRules } : {}),
    });
  }
}

/** What a care action did this turn, enough to describe it and to pick fallback words. */
interface ActionOutcome {
  readonly action: ChatAction;
  readonly changes: { readonly hunger: number; readonly happiness: number } | null;
  readonly bondDelta: number;
}

function fromActionResult(result: ActionResult): ActionOutcome {
  return result.status === 'SUCCESS'
    ? {
        action: { type: result.action.type, status: 'SUCCESS' },
        changes: { hunger: result.changes.hunger, happiness: result.changes.happiness },
        bondDelta: result.changes.bond,
      }
    : { action: { type: result.action.type, status: 'REJECTED', reason: result.reason }, changes: null, bondDelta: 0 };
}

const SUCCESS_EVENT_ACTION: Readonly<Partial<Record<StoredEvent['type'], ActionType>>> = {
  PET_FED: 'FEED',
  PET_PLAYED: 'PLAY',
  PET_STARTED_SLEEPING: 'SLEEP',
};

/** Rebuilds a committed action from the events tagged with its turn, if there is one. */
function executedAction(events: readonly StoredEvent[]): ActionOutcome | null {
  const number = (value: unknown) => (typeof value === 'number' ? value : 0);

  for (const event of events) {
    const type = SUCCESS_EVENT_ACTION[event.type];

    if (type) {
      return {
        action: { type, status: 'SUCCESS' },
        changes: { hunger: number(event.payload.hungerDelta), happiness: number(event.payload.happinessDelta) },
        bondDelta: number(event.payload.bondDelta),
      };
    }

    const rejected = chatActionSchema.safeParse({
      type: event.payload.action,
      status: 'REJECTED',
      reason: event.payload.reason,
    });

    if (event.type === 'ACTION_REJECTED' && rejected.success) {
      return { action: rejected.data, changes: null, bondDelta: 0 };
    }
  }

  return null;
}

/** Same words as the button reaction for this result (plan Task 7.14). */
function fallbackReaction(outcome: ActionOutcome): string {
  const { action } = outcome;
  const kind =
    action.status === 'REJECTED'
      ? actionReactionKind({ status: 'REJECTED', action: { type: action.type }, reason: action.reason })
      : actionReactionKind({
          status: 'SUCCESS',
          action: { type: action.type },
          changes: outcome.changes ?? { hunger: Number.POSITIVE_INFINITY, happiness: Number.POSITIVE_INFINITY },
        });

  // SLEEPING is narration on the web, not speech; the pet just sounds unsure here.
  return ACTION_REACTION_TEXT[kind === 'SLEEPING' ? 'INVALID_STATE' : kind];
}

function storedTurnResult(reply: StoredMessage, pet: PetSnapshot): ChatTurnResult {
  const intent = chatIntentSchema.safeParse(reply.metadata.intent);
  const action = chatActionSchema.nullable().safeParse(reply.metadata.action ?? null);

  return {
    message: toChatMessageDto(reply),
    intent: intent.success ? intent.data : 'NONE',
    action: action.success ? action.data : null,
    pet,
  };
}

function usageMetadata(interpreted: InterpretationOutcome, response: ResponseOutcome, ai: AIProvider): MessageMetadata {
  const usages = [interpreted.usage, response.usage].filter((usage): usage is AIUsage => usage !== null);
  const total = (pick: (usage: AIUsage) => number | null) =>
    usages.some((usage) => pick(usage) !== null) ? usages.reduce((sum, usage) => sum + (pick(usage) ?? 0), 0) : null;

  return {
    provider: ai.name,
    model: ai.model,
    latencyMs: usages.reduce((sum, usage) => sum + usage.latencyMs, 0),
    inputTokens: total((usage) => usage.inputTokens),
    outputTokens: total((usage) => usage.outputTokens),
  };
}
