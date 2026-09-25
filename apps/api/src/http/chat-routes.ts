import { chatRequestSchema } from '@ai-virtual-pet/contracts';
import type { FastifyInstance } from 'fastify';

import type { ChatService } from '../application/chat-service.js';
import type { ConversationService } from '../application/conversation-service.js';
import { ok } from './envelope.js';

export function registerChatRoutes(app: FastifyInstance, history: ConversationService, chat: ChatService): void {
  app.get('/api/v1/pet/chat/history', async (request) => ok(request, await history.getHistory()));

  app.post('/api/v1/pet/chat', async (request) => {
    const body = chatRequestSchema.parse(request.body ?? {});
    return ok(request, await chat.chat(body));
  });
}
