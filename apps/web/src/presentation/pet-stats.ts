import type { PetSnapshot } from '@ai-virtual-pet/contracts';

import { RECOVERING_TEXT, copy, energyText, fullnessText, moodText } from './copy';

export interface StatRow {
  readonly label: string;
  readonly value: string;
  /** Bar fill as a 0–1 fraction. */
  readonly ratio: number;
}

/** Descriptive needs for the floating bars. Never surfaces raw stats in Player Mode. */
export function petStatRows(snapshot: PetSnapshot): readonly StatRow[] {
  const sleeping = snapshot.state.currentActivity === 'SLEEPING';

  return [
    {
      label: copy.status.fullness,
      value: fullnessText[snapshot.derived.needs.fullness],
      ratio: snapshot.state.hunger / 100,
    },
    {
      label: copy.status.energy,
      value: sleeping ? RECOVERING_TEXT : energyText[snapshot.derived.needs.energy],
      ratio: snapshot.state.energy / 100,
    },
    {
      label: copy.status.mood,
      value: moodText[snapshot.derived.mood],
      ratio: snapshot.state.happiness / 100,
    },
  ];
}
