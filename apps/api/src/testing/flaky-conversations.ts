import type {
  Conversation,
  ConversationRepository,
  ConversationTurn,
  MessageQuery,
  NewMessage,
  StoredMessage,
} from '../persistence/repositories.js';

/**
 * Wraps a conversation store to inject failures at the worst moment of a chat turn — after the
 * Game Engine committed, before the reply is stored — standing in for a crash or lost connection.
 */
export class FlakyConversations implements ConversationRepository {
  /** The next assistant reply append throws, as if the process died. */
  failNextReply = false;
  /** Before the next assistant reply, another process stores its own reply for the same turn. */
  raceNextReply = false;

  constructor(private readonly inner: ConversationRepository) {}

  findForPet(petId: string): Promise<Conversation | null> {
    return this.inner.findForPet(petId);
  }

  getOrCreateForPet(candidate: Conversation): Promise<Conversation> {
    return this.inner.getOrCreateForPet(candidate);
  }

  async appendMessage(conversationId: string, message: NewMessage): Promise<StoredMessage> {
    if (message.role === 'ASSISTANT' && this.failNextReply) {
      this.failNextReply = false;
      throw new Error('Simulated crash before the reply was stored.');
    }

    if (message.role === 'ASSISTANT' && this.raceNextReply) {
      this.raceNextReply = false;
      await this.inner.appendMessage(conversationId, { ...message, content: 'Balasan dari proses lain.' });
    }

    return this.inner.appendMessage(conversationId, message);
  }

  findTurn(conversationId: string, clientMessageId: string): Promise<ConversationTurn | null> {
    return this.inner.findTurn(conversationId, clientMessageId);
  }

  listRecentMessages(conversationId: string, query: MessageQuery): Promise<StoredMessage[]> {
    return this.inner.listRecentMessages(conversationId, query);
  }

  findLatestAssistantMessage(conversationId: string): Promise<StoredMessage | null> {
    return this.inner.findLatestAssistantMessage(conversationId);
  }
}
