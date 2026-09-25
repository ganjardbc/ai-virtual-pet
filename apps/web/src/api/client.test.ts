import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeSnapshot } from '../testing/snapshot';
import { ApiError, ConnectionError, petApi } from './client';

const meta = { requestId: 'req-1' };

function respond(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('petApi', () => {
  it('returns the validated snapshot', async () => {
    const snapshot = makeSnapshot();
    vi.stubGlobal('fetch', respond(200, { data: snapshot, meta }));

    expect(await petApi.get()).toEqual(snapshot);
  });

  it('treats a missing pet as null rather than an error', async () => {
    vi.stubGlobal('fetch', respond(404, { error: { code: 'PET_NOT_FOUND', message: 'No pet' }, meta }));

    expect(await petApi.get()).toBeNull();
  });

  it('raises coded API errors for processed failures', async () => {
    vi.stubGlobal('fetch', respond(409, { error: { code: 'INVALID_PET_STAGE', message: 'Egg' }, meta }));

    await expect(petApi.act('FEED')).rejects.toMatchObject({ code: 'INVALID_PET_STAGE', status: 409 });
    await expect(petApi.act('FEED')).rejects.toBeInstanceOf(ApiError);
  });

  it('reports unreachable servers and malformed responses as connection errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(petApi.get()).rejects.toBeInstanceOf(ConnectionError);

    vi.stubGlobal('fetch', respond(502, { oops: true }));
    await expect(petApi.get()).rejects.toBeInstanceOf(ConnectionError);

    vi.stubGlobal('fetch', respond(200, { data: { nope: true }, meta }));
    await expect(petApi.get()).rejects.toBeInstanceOf(ConnectionError);
  });

  it('sends intents only, and no JSON header on body-less requests', async () => {
    const fetchMock = respond(200, { data: { status: 'REJECTED', action: { type: 'FEED' }, reason: 'TOO_FULL', pet: makeSnapshot() }, meta });
    vi.stubGlobal('fetch', fetchMock);
    await petApi.act('FEED');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/pet/actions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'FEED' }),
    });

    const hatchMock = respond(200, { data: { status: 'SUCCESS', pet: makeSnapshot() }, meta });
    vi.stubGlobal('fetch', hatchMock);
    await petApi.hatch();
    expect(hatchMock).toHaveBeenCalledWith('/api/v1/pet/hatch', { method: 'POST' });
  });
});
