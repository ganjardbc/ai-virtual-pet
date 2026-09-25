import { afterEach, describe, expect, it } from 'vitest';

import { FakeClock, SequenceRandom } from '@ai-virtual-pet/domain';

import { buildApp } from './app.js';
import { InMemoryStore } from './persistence/memory.js';

const apps = new Set<ReturnType<typeof buildApp>>();

afterEach(async () => {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
});

describe('GET /health', () => {
  it('reports that the API is healthy without opening a network port', async () => {
    const store = new InMemoryStore();
    const app = buildApp({
      pets: store,
      events: store,
      conversations: store,
      clock: new FakeClock(new Date('2026-09-25T00:00:00.000Z')),
      random: new SequenceRandom([]),
    });
    apps.add(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
