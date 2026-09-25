import { z } from 'zod';

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
