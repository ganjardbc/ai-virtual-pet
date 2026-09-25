import type { PetPersonality } from './personality.js';

/**
 * Deterministic personalities for evaluation and debugging (Prototype 0.2 plan Tasks 8.1, 10.4).
 * Never player choices. One dominant trait at 0.80, the rest moderate at 0.45 — which also keeps
 * Independent + Clingy within 1.40.
 */
export const PERSONALITY_PRESET_NAMES = [
  'BALANCED',
  'HIGH_PLAYFUL',
  'HIGH_CURIOUS',
  'HIGH_SHY',
  'HIGH_INDEPENDENT',
  'HIGH_CLINGY',
] as const;
export type PersonalityPresetName = (typeof PERSONALITY_PRESET_NAMES)[number];

const DOMINANT = 0.8;
const MODERATE = 0.45;
const balanced: PetPersonality = { playful: MODERATE, curious: MODERATE, shy: MODERATE, independent: MODERATE, clingy: MODERATE };

export const PERSONALITY_PRESETS: Readonly<Record<PersonalityPresetName, PetPersonality>> = Object.freeze({
  BALANCED: balanced,
  HIGH_PLAYFUL: { ...balanced, playful: DOMINANT },
  HIGH_CURIOUS: { ...balanced, curious: DOMINANT },
  HIGH_SHY: { ...balanced, shy: DOMINANT },
  HIGH_INDEPENDENT: { ...balanced, independent: DOMINANT },
  HIGH_CLINGY: { ...balanced, clingy: DOMINANT },
});
