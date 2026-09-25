import { randomUUID } from 'node:crypto';

import type { Clock, GameRules, PersonalityRules, Random } from '@ai-virtual-pet/domain';
import Fastify, { type FastifyInstance } from 'fastify';

import { ConversationService, type ConversationLimits } from './application/conversation-service.js';
import { PetService } from './application/pet-service.js';
import { registerDebugRoutes } from './debug/debug-routes.js';
import { DebugPetService } from './debug/debug-service.js';
import type { OffsetClock } from './debug/offset-clock.js';
import { registerChatRoutes } from './http/chat-routes.js';
import { registerErrorHandling } from './http/error-handler.js';
import { registerPetRoutes } from './http/pet-routes.js';
import type { ConversationRepository, EventRepository, PetRepository } from './persistence/repositories.js';

export interface AppDependencies {
  readonly pets: PetRepository;
  readonly events: EventRepository;
  readonly conversations: ConversationRepository;
  readonly conversationLimits?: ConversationLimits;
  readonly clock: Clock;
  readonly random: Random;
  readonly rules?: GameRules;
  readonly personalityRules?: PersonalityRules;
  /** Draws new personalities; separate from `random` so it never shifts simulation. */
  readonly personalityRandom?: Random;
  readonly logger?: boolean;
  /** Enables development-only debug routes. The game clock must then be this debug clock. */
  readonly debug?: { readonly clock: OffsetClock };
}

export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify({
    logger: dependencies.logger ?? false,
    genReqId: () => randomUUID(),
  });

  registerErrorHandling(app);
  app.get('/health', async () => ({ status: 'ok' as const }));

  if (dependencies.debug) {
    if (dependencies.clock !== dependencies.debug.clock) {
      throw new Error('Debug mode requires the game clock to be the debug clock.');
    }

    const service = new DebugPetService({ ...dependencies, clock: dependencies.debug.clock });
    registerPetRoutes(app, service);
    registerDebugRoutes(app, service);
  } else {
    registerPetRoutes(app, new PetService(dependencies));
  }

  registerChatRoutes(app, new ConversationService(dependencies));

  return app;
}
