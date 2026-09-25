import type { ActionType, ChatAction } from '@ai-virtual-pet/contracts';
import { z } from 'zod';

import { buildCharacterSystemPrompt, buildConversationMessages } from './character-prompt.js';
import type { AICharacterContext } from './context.js';
import type { AIFailureReason, AIMessage, AIProvider, AIUsage } from './provider.js';

/**
 * Character response stage (plan Tasks 7.9–7.12): the AI performs the result the Game Engine
 * already decided. It receives the saved reality and the actual action result, never a guess.
 */

/** Plain text reply. No expression hint in 0.2: presentation comes from the real result. */
export const characterResponseSchema = z.object({
  message: z.string().trim().min(1).max(1_000),
});

export interface ResponseRules {
  /** Brevity is asked for in the prompt; this only stops runaway output. */
  readonly maxOutputTokens: number;
  readonly temperature: number;
}

export const DEFAULT_RESPONSE_RULES: ResponseRules = Object.freeze({
  maxOutputTokens: 200,
  temperature: 0.8,
});

const ASKED: Readonly<Record<ActionType, string>> = {
  FEED: 'The player offered you food',
  PLAY: 'The player invited you to play',
  SLEEP: 'The player told you to go to sleep',
};

const HAPPENED: Readonly<Record<ActionType, string>> = {
  FEED: 'you ate',
  PLAY: 'you played together',
  SLEEP: 'you are going to sleep now (say good night briefly)',
};

const DID_NOT: Readonly<Record<ActionType, string>> = {
  FEED: 'you did NOT eat',
  PLAY: 'you did NOT play',
  SLEEP: 'you did NOT go to sleep',
};

const REJECTION_REASON: Readonly<Record<Extract<ChatAction, { status: 'REJECTED' }>['reason'], string>> = {
  TOO_TIRED: 'you are too tired',
  TOO_FULL: 'you are too full',
  SLEEPING: 'you are asleep',
  INVALID_STATE: 'it could not happen right now',
};

/** The authoritative outcome of this turn, stated so the reply cannot contradict it. */
export function turnResultDescription(action: ChatAction | null): string {
  if (!action) {
    return 'This turn (authoritative): no action happened — nothing was eaten, played, or slept. Just talk.';
  }

  if (action.status === 'SUCCESS') {
    return `This turn (authoritative): ${ASKED[action.type]}, and ${HAPPENED[action.type]}. React to that.`;
  }

  return `This turn (authoritative): ${ASKED[action.type]}, but ${REJECTION_REASON[action.reason]}, so ${DID_NOT[action.type]}. React to that honestly; do not pretend it happened.`;
}

const RESPONSE_FORMAT = `Reply rules:
- Never claim success when the action was rejected. Never claim an action happened when no action happened.
- Never invent memories.
- Keep it short, like a Baby pet: 1–3 short sentences.
Return only a JSON object, no markdown: {"message": "<your reply to the player>"}`;

export function buildCharacterResponseMessages(context: AICharacterContext, action: ChatAction | null): AIMessage[] {
  return [
    {
      role: 'system',
      content: [buildCharacterSystemPrompt(context), turnResultDescription(action), RESPONSE_FORMAT].join('\n\n'),
    },
    ...buildConversationMessages(context),
  ];
}

export interface ResponseOutcome {
  /** Null when generation failed; the caller decides on a fallback. */
  readonly message: string | null;
  readonly usage: AIUsage | null;
  readonly failure: { readonly reason: AIFailureReason; readonly detail: string } | null;
}

export async function generateCharacterResponse(
  provider: AIProvider,
  context: AICharacterContext,
  action: ChatAction | null,
  timeoutMs: number,
  rules: ResponseRules = DEFAULT_RESPONSE_RULES,
): Promise<ResponseOutcome> {
  const result = await provider.generateStructured({
    kind: 'RESPONSE',
    messages: buildCharacterResponseMessages(context, action),
    schema: characterResponseSchema,
    timeoutMs,
    maxOutputTokens: rules.maxOutputTokens,
    temperature: rules.temperature,
  });

  return result.ok
    ? { message: result.value.message, usage: result.usage, failure: null }
    : { message: null, usage: result.usage, failure: { reason: result.reason, detail: result.detail } };
}
