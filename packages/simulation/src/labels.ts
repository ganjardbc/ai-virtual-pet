import { DEFAULT_GAME_RULES, type GameRules, type PetState } from '@ai-virtual-pet/domain';

export type FullnessLabel = 'VERY_HUNGRY' | 'HUNGRY' | 'OKAY' | 'FULL' | 'VERY_FULL';
export type EnergyLabel = 'EXHAUSTED' | 'TIRED' | 'OKAY' | 'ENERGETIC';
export type HappinessLabel = 'LOW' | 'OKAY' | 'HAPPY' | 'VERY_HAPPY';

export interface NeedLabels {
  readonly fullness: FullnessLabel;
  readonly energy: EnergyLabel;
  readonly happiness: HappinessLabel;
}

// Label boundaries reuse the rule thresholds they describe where one exists, so a label never
// contradicts what the pet will accept (e.g. VERY_FULL ⇔ Feed rejected, EXHAUSTED ⇔ Play rejected).

export function deriveFullnessLabel(hunger: number, rules: GameRules = DEFAULT_GAME_RULES): FullnessLabel {
  if (hunger >= rules.feed.rejectAtHunger) return 'VERY_FULL';
  if (hunger >= rules.feed.diminishedAtHunger) return 'FULL';
  if (hunger > rules.needLabels.hungryAtOrBelow) return 'OKAY';
  if (hunger > rules.happiness.lowHungerAtOrBelow) return 'HUNGRY';
  return 'VERY_HUNGRY';
}

export function deriveEnergyLabel(energy: number, rules: GameRules = DEFAULT_GAME_RULES): EnergyLabel {
  if (energy >= rules.needLabels.energeticAtLeast) return 'ENERGETIC';
  if (energy > rules.needLabels.tiredAtOrBelow) return 'OKAY';
  if (energy > rules.play.minimumEnergyExclusive) return 'TIRED';
  return 'EXHAUSTED';
}

export function deriveHappinessLabel(
  happiness: number,
  rules: GameRules = DEFAULT_GAME_RULES,
): HappinessLabel {
  if (happiness >= rules.needLabels.veryHappyAtLeast) return 'VERY_HAPPY';
  if (happiness >= rules.mood.happyMinHappiness) return 'HAPPY';
  if (happiness > rules.needLabels.lowHappinessAtOrBelow) return 'OKAY';
  return 'LOW';
}

export function deriveNeedLabels(state: PetState, rules: GameRules = DEFAULT_GAME_RULES): NeedLabels {
  return {
    fullness: deriveFullnessLabel(state.hunger, rules),
    energy: deriveEnergyLabel(state.energy, rules),
    happiness: deriveHappinessLabel(state.happiness, rules),
  };
}
