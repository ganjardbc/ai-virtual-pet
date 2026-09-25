import { DEFAULT_PERSONALITY_RULES, type PersonalityRules } from './config.js';
import {
  PERSONALITY_TRAIT_KEYS,
  PERSONALITY_TRAITS,
  type PersonalityTrait,
  type PersonalityTraitKey,
  type PetPersonality,
} from './personality.js';

// Trait differences carry float noise (0.6 − 0.5 = 0.0999…), so boundary comparisons allow for it.
const EPSILON = 1e-9;

export type PersonalityLevel = 'low' | 'moderate' | 'high';

/** STRONG when at least one trait is dominant; otherwise the primary trait is only a mild lean. */
export type PersonalityStrength = 'STRONG' | 'MODERATE';

/** How the pet relates to the player, from the Independent/Clingy pair. */
export type SocialStyle = 'INDEPENDENT' | 'CLINGY' | 'BALANCED';

export interface PersonalityProfile {
  /** Traits at or above the dominant threshold, strongest first. May be empty. */
  readonly dominantTraits: readonly PersonalityTrait[];
  /** The strongest trait, even when none is dominant. */
  readonly primaryTrait: PersonalityTrait;
  readonly strength: PersonalityStrength;
  readonly socialStyle: SocialStyle;
}

/** Deterministic, number-free description of a personality for AI prompts (plan Task 1.12). */
export type PersonalityPromptProfile = Readonly<Record<PersonalityTraitKey, PersonalityLevel>> & PersonalityProfile;

export function personalityLevel(value: number, rules: PersonalityRules = DEFAULT_PERSONALITY_RULES): PersonalityLevel {
  if (value >= rules.highAtLeast) {
    return 'high';
  }

  return value < rules.lowBelow ? 'low' : 'moderate';
}

export function derivePersonalityProfile(
  traits: PetPersonality,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityProfile {
  const value = (trait: PersonalityTrait) => traits[PERSONALITY_TRAIT_KEYS[trait]];
  // Stable sort keeps canonical trait order for ties.
  const ranked = [...PERSONALITY_TRAITS].sort((a, b) => value(b) - value(a));
  const dominantTraits = ranked.filter((trait) => value(trait) >= rules.highAtLeast);
  const lean = traits.independent - traits.clingy;

  return {
    dominantTraits,
    primaryTrait: ranked[0] as PersonalityTrait,
    strength: dominantTraits.length > 0 ? 'STRONG' : 'MODERATE',
    socialStyle:
      lean >= rules.socialStyleMargin - EPSILON
        ? 'INDEPENDENT'
        : lean <= -rules.socialStyleMargin + EPSILON
          ? 'CLINGY'
          : 'BALANCED',
  };
}

export function derivePersonalityPromptProfile(
  traits: PetPersonality,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityPromptProfile {
  return {
    playful: personalityLevel(traits.playful, rules),
    curious: personalityLevel(traits.curious, rules),
    shy: personalityLevel(traits.shy, rules),
    independent: personalityLevel(traits.independent, rules),
    clingy: personalityLevel(traits.clingy, rules),
    ...derivePersonalityProfile(traits, rules),
  };
}
