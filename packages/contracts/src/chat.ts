import { z } from 'zod';

import { actionRejectionReasonSchema, actionTypeSchema } from './enums.js';
import { petSnapshotSchema } from './responses.js';

/** Prototype limit for one player message (plan Task 4.6). */
export const CHAT_MESSAGE_MAX_LENGTH = 1000;

/**
 * One player turn. `clientMessageId` is generated once per turn and resent unchanged on Retry,
 * so a retried turn is never applied twice (plan Task 3.8).
 */
export const chatRequestSchema = z.strictObject({
  clientMessageId: z.uuid(),
  message: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatMessageRoleSchema = z.enum(['USER', 'ASSISTANT']);
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

/** A visible conversation message. Turn debug metadata (intent, tokens…) is never included. */
export const chatMessageDtoSchema = z.strictObject({
  id: z.number().int(),
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.iso.datetime(),
});
export type ChatMessageDto = z.infer<typeof chatMessageDtoSchema>;

/** Oldest first, bounded to the latest messages. */
export const chatHistorySchema = z.object({
  messages: z.array(chatMessageDtoSchema),
});
export type ChatHistory = z.infer<typeof chatHistorySchema>;

/** Intent the turn acted on, after the confidence threshold. */
export const chatIntentSchema = z.enum(['FEED', 'PLAY', 'SLEEP', 'TALK', 'NONE']);
export type ChatIntent = z.infer<typeof chatIntentSchema>;

/** Outcome of a care action a chat turn triggered — decided by the Game Engine, not the AI. */
export const chatActionSchema = z.discriminatedUnion('status', [
  z.object({ type: actionTypeSchema, status: z.literal('SUCCESS') }),
  z.object({ type: actionTypeSchema, status: z.literal('REJECTED'), reason: actionRejectionReasonSchema }),
]);
export type ChatAction = z.infer<typeof chatActionSchema>;

/**
 * Result of `POST /api/v1/pet/chat`. No provider output or debug metadata.
 *
 * Client retry contract (plan Tasks 3.8, 7.16):
 * - 200: turn complete. A repeated request with the same `clientMessageId` returns this same reply.
 * - 503 `AI_UNAVAILABLE`, 500, or a network error: the player message may be stored. Retry with the
 *   SAME `clientMessageId` and message; the server resumes the turn and never repeats an action,
 *   Bond gain, or personality change.
 * - 409 `CHAT_IN_PROGRESS`: a turn is still running; keep the pending id and retry later.
 * - 409 `PET_SLEEPING`: Talk is unavailable; nothing was stored. Show the sleeping hint.
 * - 400 `VALIDATION_ERROR`: fix the request; a new message needs a NEW `clientMessageId`.
 */
export const chatTurnResultSchema = z.object({
  message: chatMessageDtoSchema,
  intent: chatIntentSchema,
  action: chatActionSchema.nullable(),
  pet: petSnapshotSchema,
});
export type ChatTurnResult = z.infer<typeof chatTurnResultSchema>;
