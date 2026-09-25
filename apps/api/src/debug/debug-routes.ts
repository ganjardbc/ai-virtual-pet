import { debugAdvanceTimeRequestSchema, debugSetStateRequestSchema } from '@ai-virtual-pet/contracts';
import type { FastifyInstance } from 'fastify';

import { ok } from '../http/envelope.js';
import type { DebugPetService } from './debug-service.js';

/** Development-only routes. Registered only when debug is explicitly enabled. */
export function registerDebugRoutes(app: FastifyInstance, service: DebugPetService): void {
  app.get('/api/v1/debug/pet/state', async (request) => ok(request, await service.getState()));

  app.post('/api/v1/debug/time/advance', async (request) => {
    const body = debugAdvanceTimeRequestSchema.parse(request.body ?? {});
    return ok(request, await service.advanceTime(body));
  });

  app.post('/api/v1/debug/pet/sleep', async (request) => ok(request, await service.forceSleep()));

  app.post('/api/v1/debug/pet/wake', async (request) => ok(request, await service.wake()));

  app.patch('/api/v1/debug/pet/state', async (request) => {
    const body = debugSetStateRequestSchema.parse(request.body ?? {});
    return ok(request, await service.setState(body));
  });

  app.post('/api/v1/debug/pet/reset', async (request) => ok(request, await service.reset()));
}
