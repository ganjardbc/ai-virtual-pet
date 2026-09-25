import type { ChatHistory, ChatMessageDto } from '@ai-virtual-pet/contracts';

import type { ConversationRepository, PetRepository, StoredMessage } from '../persistence/repositories.js';
import { ApplicationError } from './errors.js';

/** Conversation bounds (plan Tasks 3.5, 3.6). Starting hypotheses, tuned in evaluation. */
export interface ConversationLimits {
  /** Recent messages given to the AI as short-term context. Older ones are not Memory. */
  readonly contextWindow: number;
  /** Messages shown in the player's conversation history. */
  readonly historyLimit: number;
}

export const DEFAULT_CONVERSATION_LIMITS: ConversationLimits = Object.freeze({
  contextWindow: 12,
  historyLimit: 50,
});

export interface ConversationServiceDependencies {
  readonly pets: PetRepository;
  readonly conversations: ConversationRepository;
  readonly conversationLimits?: ConversationLimits;
}

/** Read side of the pet's single conversation. Chat turns (Phase 7) write through the repository. */
export class ConversationService {
  readonly limits: ConversationLimits;

  constructor(private readonly deps: ConversationServiceDependencies) {
    this.limits = deps.conversationLimits ?? DEFAULT_CONVERSATION_LIMITS;
  }

  /** Read-only: viewing history never creates a conversation. */
  async getHistory(): Promise<ChatHistory> {
    const current = await this.deps.pets.findCurrent();

    if (!current) {
      throw new ApplicationError('PET_NOT_FOUND', 'No pet exists yet.');
    }

    const conversation = await this.deps.conversations.findForPet(current.pet.id);
    const stored = conversation
      ? await this.deps.conversations.listRecentMessages(conversation.id, { limit: this.limits.historyLimit })
      : [];

    return { messages: stored.map(toChatMessageDto) };
  }
}

export function toChatMessageDto(message: StoredMessage): ChatMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
