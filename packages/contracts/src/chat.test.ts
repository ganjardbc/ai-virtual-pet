import { describe, expect, it } from 'vitest';

import { chatHistorySchema, chatMessageDtoSchema } from './chat.js';

const message = { id: 1, role: 'USER', content: 'Hai!', createdAt: '2026-09-25T08:00:00.000Z' } as const;

describe('chat history contract', () => {
  it('accepts a visible message', () => {
    expect(chatHistorySchema.parse({ messages: [message] })).toEqual({ messages: [message] });
  });

  it('rejects debug metadata leaking into a visible message', () => {
    expect(chatMessageDtoSchema.safeParse({ ...message, metadata: { intent: 'PLAY' } }).success).toBe(false);
    expect(chatMessageDtoSchema.safeParse({ ...message, clientMessageId: 'turn-1' }).success).toBe(false);
  });

  it('rejects unknown roles', () => {
    expect(chatMessageDtoSchema.safeParse({ ...message, role: 'SYSTEM' }).success).toBe(false);
  });
});
