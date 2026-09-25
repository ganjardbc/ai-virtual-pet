import { describe, expect, it } from 'vitest';

import { CHAT_MESSAGE_MAX_LENGTH, chatHistorySchema, chatMessageDtoSchema, chatRequestSchema } from './chat.js';

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

describe('chat request contract', () => {
  const clientMessageId = '5b0c8f5e-2f1a-4c1e-9a7b-3c2d1e0f9a8b';

  it('accepts a message up to 1000 characters and trims it', () => {
    expect(chatRequestSchema.parse({ clientMessageId, message: '  Main yuk!  ' })).toEqual({
      clientMessageId,
      message: 'Main yuk!',
    });
    expect(chatRequestSchema.safeParse({ clientMessageId, message: 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH) }).success).toBe(
      true,
    );
  });

  it.each([
    ['empty message', { clientMessageId, message: '' }],
    ['whitespace-only message', { clientMessageId, message: '   ' }],
    ['message over 1000 characters', { clientMessageId, message: 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1) }],
    ['missing clientMessageId', { message: 'Hai' }],
    ['non-UUID clientMessageId', { clientMessageId: 'turn-1', message: 'Hai' }],
    ['unknown field', { clientMessageId, message: 'Hai', intent: 'FEED' }],
  ])('rejects %s', (_label, body) => {
    expect(chatRequestSchema.safeParse(body).success).toBe(false);
  });
});
