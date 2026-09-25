import { randomUUID } from 'node:crypto';

import {
  ACTION_REACTION_TEXT,
  actionReactionKind,
  chatActionSchema,
  chatIntentSchema,
  type ActionResult,
  type ChatAction,
  type ChatRequest,
  type ChatTurnResult,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';
import type { Clock, PersonalitySignal } from '@ai-virtual-pet/domain';

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
  readonly conversations: ConversationRepository;
  readonly ai: AIProvider;
  readonly clock: Clock;
  readonly guard?: ChatTurnGuard;
  readonly aiTimeouts?: AITimeouts;
  readonly conversationLimits?: ConversationLimits;
  readonly interpretationRules?: InterpretationRules;
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

    return this.completeTurn(conversation, user, loaded);
  }

  private async completeTurn(conversation: Conversation, user: StoredMessage, loaded: PetSnapshot): Promise<ChatTurnResult> {
    const budget = new TurnBudget(this.deps.aiTimeouts ?? DEFAULT_AI_TIMEOUTS, this.deps.monotonicNow);
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
    const action = actionResult ? toChatAction(actionResult) : null;
    let snapshot = actionResult?.pet ?? loaded;

    const response = await generateCharacterResponse(
      this.deps.ai,
      await this.characterContext(conversation, user, snapshot),
      action,
      budget.timeoutFor('RESPONSE'),
    );

    const content = response.message ?? (actionResult ? fallbackReaction(actionResult) : null);

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
      bondDelta: actionResult?.status === 'SUCCESS' ? actionResult.changes.bond : talkBondDelta,
      fallbackUsed: response.message === null,
      responseFailure: response.failure?.reason ?? null,
      ...usageMetadata(interpreted, response, this.deps.ai),
    });

    return { message: toChatMessageDto(reply), intent: interpretation.intent, action, pet: snapshot };
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
    });
  }
}

function toChatAction(result: ActionResult): ChatAction {
  return result.status === 'SUCCESS'
    ? { type: result.action.type, status: 'SUCCESS' }
    : { type: result.action.type, status: 'REJECTED', reason: result.reason };
}

/** Same words as the button reaction for this result (plan Task 7.14). */
function fallbackReaction(result: ActionResult): string {
  const kind = actionReactionKind(result);
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
