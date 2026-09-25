import { z } from 'zod';

import { responseMetaSchema } from './responses.js';

/** Clients branch on `error.code`, never on the human-readable message. */
export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'PET_NOT_FOUND',
  'PET_ALREADY_EXISTS',
  'INVALID_PET_STAGE',
  'PET_STATE_CONFLICT',
  'PET_SLEEPING',
  'CHAT_IN_PROGRESS',
  'AI_UNAVAILABLE',
  'INTERNAL_ERROR',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const API_ERROR_STATUS: Readonly<Record<ApiErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  PET_NOT_FOUND: 404,
  PET_ALREADY_EXISTS: 409,
  INVALID_PET_STAGE: 409,
  PET_STATE_CONFLICT: 409,
  PET_SLEEPING: 409,
  CHAT_IN_PROGRESS: 409,
  AI_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
  meta: responseMetaSchema,
});
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
