import {
  ACTION_REACTION_TEXT,
  actionReactionKind,
  type ActionResult,
  type PetSnapshot,
} from '@ai-virtual-pet/contracts';

import { activityText } from './copy';
import type { PetVisual } from './visual';

/** Speech is the pet talking; narration describes what it is doing. */
export interface Reaction {
  readonly kind: 'speech' | 'narration';
  readonly text: string;
  /** Temporary look while the reaction plays; absent means "use the current state". */
  readonly visual?: PetVisual;
}

const speech = (text: string, visual?: PetVisual): Reaction =>
  visual ? { kind: 'speech', text, visual } : { kind: 'speech', text };

/** The pet's immediate response to a care action, derived only from the server's result. */
// Words come from the shared table so chat fallbacks sound the same; the look is web-only.
const REACTION_VISUAL: Readonly<Record<Exclude<ReturnType<typeof actionReactionKind>, 'SLEEPING'>, PetVisual>> = {
  HEARTY_MEAL: { expression: 'eating', pose: 'center', motion: 'chew' },
  LIGHT_MEAL: { expression: 'content', pose: 'center', motion: 'chew' },
  FULL_FUN: { expression: 'excited', pose: 'toy', motion: 'bounce' },
  LIGHT_FUN: { expression: 'happy', pose: 'toy', motion: 'breathe' },
  GOOD_NIGHT: { expression: 'sleeping', pose: 'bed', motion: 'slow' },
  TOO_TIRED: { expression: 'tired', pose: 'center', motion: 'slow' },
  TOO_FULL: { expression: 'content', pose: 'center', motion: 'shake' },
  INVALID_STATE: { expression: 'curious', pose: 'center', motion: 'breathe' },
};

export function reactionForAction(result: ActionResult): Reaction {
  const kind = actionReactionKind(result);

  if (kind === 'SLEEPING') {
    return { kind: 'narration', text: activityText.SLEEPING ?? '' };
  }

  return speech(ACTION_REACTION_TEXT[kind], REACTION_VISUAL[kind]);
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
