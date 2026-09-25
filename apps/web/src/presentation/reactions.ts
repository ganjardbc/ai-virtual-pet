import type { ActionResult, PetSnapshot } from '@ai-virtual-pet/contracts';

import { activityText } from './copy';
import type { PetVisual } from './visual';

/** Speech is the pet talking; narration describes what it is doing. */
export interface Reaction {
  readonly kind: 'speech' | 'narration';
  readonly text: string;
  /** Temporary look while the reaction plays; absent means "use the current state". */
  readonly visual?: PetVisual;
}

/** Below this, a successful Feed was the diminished near-full kind. */
const HEARTY_MEAL_MIN_FULLNESS_GAIN = 20;
/** Below this, Play was heavily diminished by repetition. */
const FULL_FUN_MIN_HAPPINESS_GAIN = 6;

const speech = (text: string, visual?: PetVisual): Reaction =>
  visual ? { kind: 'speech', text, visual } : { kind: 'speech', text };

/** The pet's immediate response to a care action, derived only from the server's result. */
export function reactionForAction(result: ActionResult): Reaction {
  if (result.status === 'REJECTED') {
    switch (result.reason) {
      case 'TOO_TIRED':
        return speech('Aku capek banget…', { expression: 'tired', pose: 'center', motion: 'slow' });
      case 'TOO_FULL':
        return speech('Aku udah kenyang…', { expression: 'content', pose: 'center', motion: 'shake' });
      case 'SLEEPING':
        return { kind: 'narration', text: activityText.SLEEPING ?? '' };
      case 'INVALID_STATE':
        return speech('Hmm?', { expression: 'curious', pose: 'center', motion: 'breathe' });
    }
  }

  switch (result.action.type) {
    case 'FEED':
      return result.changes.hunger >= HEARTY_MEAL_MIN_FULLNESS_GAIN
        ? speech('Nyam!', { expression: 'eating', pose: 'center', motion: 'chew' })
        : speech('Udah mulai kenyang…', { expression: 'content', pose: 'center', motion: 'chew' });
    case 'PLAY':
      return result.changes.happiness >= FULL_FUN_MIN_HAPPINESS_GAIN
        ? speech('Lagi! Lagi!', { expression: 'excited', pose: 'toy', motion: 'bounce' })
        : speech('Seru juga.', { expression: 'happy', pose: 'toy', motion: 'breathe' });
    case 'SLEEP':
      return speech('Selamat tidur…', { expression: 'sleeping', pose: 'bed', motion: 'slow' });
  }
}

/** What the pet expresses when nothing just happened: important needs first, then activity, then mood. */
export function idleReaction(snapshot: PetSnapshot): Reaction {
  const { state, derived } = snapshot;

  if (state.currentActivity === 'SLEEPING') {
    return { kind: 'narration', text: activityText.SLEEPING ?? '' };
  }

  if (derived.needs.fullness === 'VERY_HUNGRY') {
    return speech('Aku lapar banget.');
  }

  if (derived.needs.energy === 'EXHAUSTED') {
    return speech('Ngantuk banget…');
  }

  if (derived.mood === 'HUNGRY') {
    return speech('Aku mulai lapar.');
  }

  if (derived.mood === 'SLEEPY') {
    return speech('Aku mulai ngantuk…');
  }

  const narration = activityText[state.currentActivity];

  if (narration) {
    return { kind: 'narration', text: narration };
  }

  switch (derived.mood) {
    case 'EXCITED':
      return speech('Tadi seru banget!');
    case 'HAPPY':
      return speech('Aku lagi senang.');
    case 'BORED':
      return speech('Nggak ada yang seru…');
    default:
      return speech('Hai!');
  }
}

/** Greeting after a meaningful absence. Never moralizes; mentions an urgent need if there is one. */
export function returnReaction(snapshot: PetSnapshot): Reaction {
  if (snapshot.state.currentActivity === 'SLEEPING') {
    return { kind: 'narration', text: activityText.SLEEPING ?? '' };
  }

  if (snapshot.derived.needs.fullness === 'VERY_HUNGRY') {
    return speech('Kamu balik! Aku lapar banget.');
  }

  return speech('Kamu balik!');
}
