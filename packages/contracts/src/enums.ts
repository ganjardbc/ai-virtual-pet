import { z } from 'zod';

// API enums are explicit, stable semantic values. Clients localize them; they are never copy.

export const petStageSchema = z.enum(['EGG', 'BABY']);
export type PetStage = z.infer<typeof petStageSchema>;

export const petActivitySchema = z.enum([
  'IDLE',
  'SLEEPING',
  'PLAYING_ALONE',
  'RESTING',
  'LOOKING_AROUND',
  'WAITING',
]);
export type PetActivity = z.infer<typeof petActivitySchema>;

export const moodSchema = z.enum(['NEUTRAL', 'HAPPY', 'HUNGRY', 'SLEEPY', 'EXCITED', 'BORED']);
export type Mood = z.infer<typeof moodSchema>;

export const fullnessLabelSchema = z.enum(['VERY_HUNGRY', 'HUNGRY', 'OKAY', 'FULL', 'VERY_FULL']);
export type FullnessLabel = z.infer<typeof fullnessLabelSchema>;

export const energyLabelSchema = z.enum(['EXHAUSTED', 'TIRED', 'OKAY', 'ENERGETIC']);
export type EnergyLabel = z.infer<typeof energyLabelSchema>;

export const happinessLabelSchema = z.enum(['LOW', 'OKAY', 'HAPPY', 'VERY_HAPPY']);
export type HappinessLabel = z.infer<typeof happinessLabelSchema>;

export const actionTypeSchema = z.enum(['FEED', 'PLAY', 'SLEEP']);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const actionRejectionReasonSchema = z.enum(['TOO_TIRED', 'TOO_FULL', 'SLEEPING', 'INVALID_STATE']);
export type ActionRejectionReason = z.infer<typeof actionRejectionReasonSchema>;

export const petEventTypeSchema = z.enum([
  'PET_HATCHED',
  'PET_NAMED',
  'PET_FED',
  'PET_PLAYED',
  'PET_STARTED_SLEEPING',
  'PET_WOKE_UP',
  'PET_ACTIVITY_CHANGED',
  'ACTION_REJECTED',
  'DEBUG_STATE_CHANGED',
  'PET_TALKED',
  'PERSONALITY_CHANGED',
]);
export type PetEventType = z.infer<typeof petEventTypeSchema>;
