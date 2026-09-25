import { CHAT_MESSAGE_MAX_LENGTH } from '@ai-virtual-pet/contracts';

import { ApiError } from '../api/client';
import { copy } from './copy';

/**
 * The player's turn that has no reply yet. Its `clientMessageId` is kept until a reply arrives,
 * so Retry resends the same turn and the server can never apply it twice (plan Tasks 3.8, 9.10).
 */
export interface PendingTurn {
  readonly clientMessageId: string;
  readonly message: string;
  readonly status: 'sending' | 'failed';
}

export type PendingTurnEvent =
  | { readonly type: 'SEND'; readonly clientMessageId: string; readonly message: string }
  | { readonly type: 'RETRY' }
  | { readonly type: 'FAILED' }
  | { readonly type: 'DONE' };

export function pendingTurnReducer(turn: PendingTurn | null, event: PendingTurnEvent): PendingTurn | null {
  switch (event.type) {
    case 'SEND':
      // A new turn only starts when none is waiting; otherwise the player must Retry it first.
      return turn ?? { clientMessageId: event.clientMessageId, message: event.message, status: 'sending' };
    case 'RETRY':
      return turn?.status === 'failed' ? { ...turn, status: 'sending' } : turn;
    case 'FAILED':
      return turn ? { ...turn, status: 'failed' } : turn;
    case 'DONE':
      return null;
  }
}

export interface ComposedMessage {
  readonly text: string;
  readonly valid: boolean;
}

/** Same rule as the server: trimmed, 1–1000 characters. */
export function composeMessage(draft: string): ComposedMessage {
  const text = draft.trim();
  return { text, valid: text.length > 0 && text.length <= CHAT_MESSAGE_MAX_LENGTH };
}

/** Enter sends; Shift+Enter is a new line; Enter that confirms an IME composition never sends. */
export function shouldSendOnKey(key: { readonly key: string; readonly shiftKey: boolean; readonly isComposing: boolean }): boolean {
  return key.key === 'Enter' && !key.shiftKey && !key.isComposing;
}

/** Shown near the limit only, so the counter does not clutter normal chat. */
export function counterText(length: number): string | null {
  return length >= CHAT_MESSAGE_MAX_LENGTH * 0.8 ? copy.chat.counter(length, CHAT_MESSAGE_MAX_LENGTH) : null;
}

export type ChatFailure =
  /** Talk cannot start: the pet is asleep. Nothing was stored. */
  | { readonly kind: 'SLEEPING' }
  /** The turn may be stored; the same turn can be retried. */
  | { readonly kind: 'RETRY'; readonly message: string }
  /** The request itself was wrong; retrying the same turn will not help. */
  | { readonly kind: 'DISCARD'; readonly message: string };

/** System voice for chat failures — never words put in the pet's mouth (plan Task 9.10). */
export function chatFailure(error: unknown, petName: string): ChatFailure {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'PET_SLEEPING':
        return { kind: 'SLEEPING' };
      case 'CHAT_IN_PROGRESS':
        return { kind: 'RETRY', message: copy.chat.inProgress };
      case 'VALIDATION_ERROR':
      case 'INVALID_PET_STAGE':
      case 'PET_NOT_FOUND':
        return { kind: 'DISCARD', message: copy.system.actionFailed };
      default:
        break;
    }
  }

  return { kind: 'RETRY', message: copy.chat.unavailable(petName) };
}
