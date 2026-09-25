import type { FastifyInstance } from 'fastify';

import type { ConversationService } from '../application/conversation-service.js';
import { ok } from './envelope.js';

export function registerChatRoutes(app: FastifyInstance, service: ConversationService): void {
  app.get('/api/v1/pet/chat/history', async (request) => ok(request, await service.getHistory()));
}
