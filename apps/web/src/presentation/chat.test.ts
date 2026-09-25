import type { ChatTurnResult } from '@ai-virtual-pet/contracts';
import { describe, expect, it } from 'vitest';

import { ApiError, ConnectionError } from '../api/client';
import { makeSnapshot } from '../testing/snapshot';
import { chatFailure, composeMessage, counterText, newClientMessageId, pendingTurnReducer, shouldSendOnKey, type PendingTurn } from './chat';
import { reactionForChat } from './reactions';

const send = { type: 'SEND', clientMessageId: 'id-1', message: 'Main yuk!' } as const;

describe('pendingTurnReducer', () => {
  it('starts a turn and clears it when the reply arrives', () => {
    const sending = pendingTurnReducer(null, send);

    expect(sending).toEqual({ clientMessageId: 'id-1', message: 'Main yuk!', status: 'sending' });
    expect(pendingTurnReducer(sending, { type: 'DONE' })).toBeNull();
  });

  it('keeps the same clientMessageId and message for Retry after a failure', () => {
    const failed = pendingTurnReducer(pendingTurnReducer(null, send), { type: 'FAILED' });
    const retried = pendingTurnReducer(failed, { type: 'RETRY' });

    expect(failed?.status).toBe('failed');
    expect(retried).toEqual({ clientMessageId: 'id-1', message: 'Main yuk!', status: 'sending' });
  });

  it('never starts a second turn while one is waiting or unsent', () => {
    const failed: PendingTurn = { clientMessageId: 'id-1', message: 'Main yuk!', status: 'failed' };

    expect(pendingTurnReducer(failed, { type: 'SEND', clientMessageId: 'id-2', message: 'Halo' })).toBe(failed);
  });

  it('only retries a failed turn', () => {
    const sending: PendingTurn = { clientMessageId: 'id-1', message: 'Hai', status: 'sending' };

    expect(pendingTurnReducer(sending, { type: 'RETRY' })).toBe(sending);
    expect(pendingTurnReducer(null, { type: 'RETRY' })).toBeNull();
  });
});

describe('composing', () => {
  it('trims and validates like the server', () => {
    expect(composeMessage('  Hai  ')).toEqual({ text: 'Hai', valid: true });
    expect(composeMessage('   ').valid).toBe(false);
    expect(composeMessage('a'.repeat(1_001)).valid).toBe(false);
  });

  it('sends on Enter, not on Shift+Enter or while an IME is composing', () => {
    expect(shouldSendOnKey({ key: 'Enter', shiftKey: false, isComposing: false })).toBe(true);
    expect(shouldSendOnKey({ key: 'Enter', shiftKey: true, isComposing: false })).toBe(false);
    expect(shouldSendOnKey({ key: 'Enter', shiftKey: false, isComposing: true })).toBe(false);
    expect(shouldSendOnKey({ key: 'a', shiftKey: false, isComposing: false })).toBe(false);
  });

  it('shows the counter only near the limit', () => {
    expect(counterText(100)).toBeNull();
    expect(counterText(800)).toBe('800/1000');
  });
});

describe('newClientMessageId', () => {
  const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('uses crypto.randomUUID when it exists (secure context)', () => {
    expect(newClientMessageId()).toMatch(v4);
  });

  it('falls back to getRandomValues when randomUUID is missing (plain HTTP)', () => {
    // crypto.randomUUID is only defined in secure contexts; a HTTP deployment on an IP has none.
    const original = crypto.randomUUID;
    // @ts-expect-error -- simulate the insecure-context API surface.
    crypto.randomUUID = undefined;

    try {
      const first = newClientMessageId();
      const second = newClientMessageId();

      expect(first).toMatch(v4);
      expect(first).not.toBe(second);
    } finally {
      crypto.randomUUID = original;
    }
  });
});

describe('chatFailure', () => {
  it.each([
    [new ApiError('AI_UNAVAILABLE', 'x', 503), { kind: 'RETRY', message: 'Momo belum bisa menjawab sekarang.' }],
    [new ApiError('INTERNAL_ERROR', 'x', 500), { kind: 'RETRY', message: 'Momo belum bisa menjawab sekarang.' }],
    [new ConnectionError(), { kind: 'RETRY', message: 'Momo belum bisa menjawab sekarang.' }],
    [new ApiError('CHAT_IN_PROGRESS', 'x', 409), { kind: 'RETRY', message: 'Pesan sebelumnya masih ditunggu. Coba lagi sebentar.' }],
    [new ApiError('PET_SLEEPING', 'x', 409), { kind: 'SLEEPING' }],
    [new ApiError('VALIDATION_ERROR', 'x', 400), { kind: 'DISCARD', message: 'Terjadi kesalahan. Coba lagi.' }],
  ])('maps %s', (error, expected) => {
    expect(chatFailure(error, 'Momo')).toEqual(expected);
  });

  it('never phrases a failure as the pet ignoring the player', () => {
    const failure = chatFailure(new ConnectionError(), 'Momo');

    expect(failure.kind === 'RETRY' && failure.message).not.toMatch(/nggak mau|tidak mau|marah/);
  });
});

describe('reactionForChat', () => {
  const result = (action: ChatTurnResult['action']): ChatTurnResult => ({
    message: { id: 2, role: 'ASSISTANT', content: 'Yay!', createdAt: '2026-09-25T12:00:00.000Z' },
    intent: action ? action.type : 'TALK',
    action,
    pet: makeSnapshot(),
  });

  it('speaks the AI reply and keeps the current look for plain Talk', () => {
    expect(reactionForChat(result(null))).toEqual({ kind: 'speech', text: 'Yay!' });
  });

  it('plays the same pose as the button for a chat-triggered action', () => {
    expect(reactionForChat(result({ type: 'PLAY', status: 'SUCCESS' })).visual).toMatchObject({ pose: 'toy', expression: 'excited' });
    expect(reactionForChat(result({ type: 'FEED', status: 'SUCCESS' })).visual).toMatchObject({ expression: 'eating' });
    expect(reactionForChat(result({ type: 'SLEEP', status: 'SUCCESS' })).visual).toMatchObject({ pose: 'bed' });
  });

  it('shows a tired, not an error, look for a rejected Play', () => {
    expect(reactionForChat(result({ type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' })).visual).toMatchObject({
      expression: 'tired',
    });
  });
});
