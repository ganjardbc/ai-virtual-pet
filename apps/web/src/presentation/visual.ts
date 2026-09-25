import type { PetSnapshot } from '@ai-virtual-pet/contracts';

export type Expression =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'hungry'
  | 'sleepy'
  | 'tired'
  | 'sleeping'
  | 'eating'
  | 'curious'
  | 'content';

/** Where the pet sits in the habitat. */
export type Pose = 'center' | 'bed' | 'toy';

export type Motion = 'breathe' | 'slow' | 'bounce' | 'sway' | 'chew' | 'shake' | 'peek';

export interface PetVisual {
  readonly expression: Expression;
  readonly pose: Pose;
  readonly motion: Motion;
}

/**
 * Maps authoritative state to how the pet looks. Priority: sleeping, then urgent needs,
 * then what the pet is doing on its own, then mood. The UI never invents an activity the
 * simulation did not report.
 */
export function visualFromSnapshot(snapshot: PetSnapshot): PetVisual {
  const { state, derived } = snapshot;

  if (state.currentActivity === 'SLEEPING') {
    return { expression: 'sleeping', pose: 'bed', motion: 'slow' };
  }

  if (derived.needs.energy === 'EXHAUSTED') {
    return { expression: 'tired', pose: 'center', motion: 'slow' };
  }

  if (derived.mood === 'SLEEPY') {
    return { expression: 'sleepy', pose: 'center', motion: 'sway' };
  }

  if (derived.mood === 'HUNGRY' || derived.needs.fullness === 'VERY_HUNGRY') {
    return { expression: 'hungry', pose: 'center', motion: 'slow' };
  }

  switch (state.currentActivity) {
    case 'PLAYING_ALONE':
      return { expression: 'excited', pose: 'toy', motion: 'bounce' };
    case 'RESTING':
      return { expression: 'content', pose: 'bed', motion: 'slow' };
    case 'LOOKING_AROUND':
      return { expression: 'curious', pose: 'center', motion: 'peek' };
    default:
      break;
  }

  switch (derived.mood) {
    case 'EXCITED':
      return { expression: 'excited', pose: 'center', motion: 'bounce' };
    case 'HAPPY':
      return { expression: 'happy', pose: 'center', motion: 'breathe' };
    case 'BORED':
      return { expression: 'neutral', pose: 'center', motion: 'slow' };
    default:
      return { expression: 'neutral', pose: 'center', motion: 'breathe' };
  }
}
