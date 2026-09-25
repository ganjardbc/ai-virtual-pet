import { namePetRequestSchema, petActionRequestSchema } from '@ai-virtual-pet/contracts';
import type { FastifyInstance } from 'fastify';

import type { PetService } from '../application/pet-service.js';
import { ok } from './envelope.js';

/** Thin HTTP adapters: validate input, call the service, wrap the result. No game rules here. */
export function registerPetRoutes(app: FastifyInstance, service: PetService): void {
  app.post('/api/v1/pet', async (request, reply) => {
    const snapshot = await service.createPet();
    return reply.code(201).send(ok(request, snapshot));
  });

  app.get('/api/v1/pet', async (request) => ok(request, await service.getPet()));

  app.post('/api/v1/pet/hatch', async (request) =>
    ok(request, { status: 'SUCCESS' as const, pet: await service.hatch() }),
  );

  app.patch('/api/v1/pet/name', async (request) => {
    const body = namePetRequestSchema.parse(request.body ?? {});
    return ok(request, await service.name(body.name));
  });

  app.post('/api/v1/pet/actions', async (request) => {
    const body = petActionRequestSchema.parse(request.body ?? {});
    return ok(request, await service.act(body.type));
  });
}
