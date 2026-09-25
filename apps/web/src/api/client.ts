import {
  actionResultSchema,
  apiErrorEnvelopeSchema,
  hatchResultSchema,
  petSnapshotSchema,
  successEnvelopeSchema,
  type ActionResult,
  type ActionType,
  type ApiErrorCode,
  type HatchResult,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';
import type { z } from 'zod';

const API_BASE = '/api/v1';

/** The server processed the request and answered with a known error code. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The game server could not be reached or answered with something unexpected. */
export class ConnectionError extends Error {
  constructor(message = 'Could not reach the game server.') {
    super(message);
    this.name = 'ConnectionError';
  }
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  // Body-less requests must not declare JSON, or the server rejects the empty body.
  const init: RequestInit =
    body === undefined
      ? { method }
      : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ConnectionError();
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = apiErrorEnvelopeSchema.safeParse(json);

    if (parsed.success) {
      throw new ApiError(parsed.data.error.code, parsed.data.error.message, response.status);
    }

    throw new ConnectionError(`Unexpected response from the game server (${response.status}).`);
  }

  const parsed = successEnvelopeSchema(schema).safeParse(json);

  if (!parsed.success) {
    throw new ConnectionError('The game server sent a response this version does not understand.');
  }

  return parsed.data.data;
}

export const petApi = {
  /** The current pet, or `null` when none exists yet. */
  async get(): Promise<PetSnapshot | null> {
    try {
      return await request('GET', '/pet', petSnapshotSchema);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PET_NOT_FOUND') {
        return null;
      }

      throw error;
    }
  },
  create: (): Promise<PetSnapshot> => request('POST', '/pet', petSnapshotSchema),
  hatch: (): Promise<HatchResult> => request('POST', '/pet/hatch', hatchResultSchema),
  name: (name: string): Promise<PetSnapshot> => request('PATCH', '/pet/name', petSnapshotSchema, { name }),
  act: (type: ActionType): Promise<ActionResult> =>
    request('POST', '/pet/actions', actionResultSchema, { type }),
};
