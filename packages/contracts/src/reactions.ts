import type { ActionResult } from './responses.js';

/**
 * The pet's immediate words for a care action result. Shared so a button action (web) and a chat
 * action whose AI reply failed (API fallback) sound the same (Prototype 0.2 plan Task 7.14).
 */
export type ActionReactionKind =
  | 'HEARTY_MEAL'
  | 'LIGHT_MEAL'
  | 'FULL_FUN'
  | 'LIGHT_FUN'
  | 'GOOD_NIGHT'
  | 'TOO_TIRED'
  | 'TOO_FULL'
  | 'SLEEPING'
  | 'INVALID_STATE';

/** Below this, a successful Feed was the diminished near-full kind. */
export const HEARTY_MEAL_MIN_FULLNESS_GAIN = 20;
/** Below this, Play was heavily diminished by repetition. */
export const FULL_FUN_MIN_HAPPINESS_GAIN = 6;

/** Player language is Indonesian; the pet's casual "aku" voice. */
export const ACTION_REACTION_TEXT: Readonly<Record<Exclude<ActionReactionKind, 'SLEEPING'>, string>> = {
  HEARTY_MEAL: 'Nyam!',
  LIGHT_MEAL: 'Udah mulai kenyang…',
  FULL_FUN: 'Lagi! Lagi!',
  LIGHT_FUN: 'Seru juga.',
  GOOD_NIGHT: 'Selamat tidur…',
  TOO_TIRED: 'Aku capek banget…',
  TOO_FULL: 'Aku udah kenyang…',
  INVALID_STATE: 'Hmm?',
};

type ReactionInput =
  | { readonly status: 'SUCCESS'; readonly action: Pick<ActionResult['action'], 'type'>; readonly changes: { readonly hunger: number; readonly happiness: number } }
  | { readonly status: 'REJECTED'; readonly action: Pick<ActionResult['action'], 'type'>; readonly reason: 'TOO_TIRED' | 'TOO_FULL' | 'SLEEPING' | 'INVALID_STATE' };

export function actionReactionKind(result: ReactionInput): ActionReactionKind {
  if (result.status === 'REJECTED') {
    return result.reason;
  }

  switch (result.action.type) {
    case 'FEED':
      return result.changes.hunger >= HEARTY_MEAL_MIN_FULLNESS_GAIN ? 'HEARTY_MEAL' : 'LIGHT_MEAL';
    case 'PLAY':
      return result.changes.happiness >= FULL_FUN_MIN_HAPPINESS_GAIN ? 'FULL_FUN' : 'LIGHT_FUN';
    case 'SLEEP':
      return 'GOOD_NIGHT';
  }
}
