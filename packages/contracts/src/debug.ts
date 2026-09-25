import { z } from 'zod';

import { chatActionSchema, chatIntentSchema } from './chat.js';
import { actionRejectionReasonSchema, moodSchema } from './enums.js';
import { petEventDtoSchema, petSnapshotSchema, petStateDtoSchema } from './responses.js';

// Development-only debug API. Never used by Player Mode.

const MAX_ADVANCE_DAYS = 365;

export const debugAdvanceTimeRequestSchema = z
  .object({
    hours: z.number().positive().optional(),
    days: z.number().positive().optional(),
  })
  .refine((value) => value.hours !== undefined || value.days !== undefined, {
    message: 'Provide hours and/or days.',
  })
  .refine((value) => (value.hours ?? 0) / 24 + (value.days ?? 0) <= MAX_ADVANCE_DAYS, {
    message: `Cannot advance more than ${MAX_ADVANCE_DAYS} days at once.`,
  });
export type DebugAdvanceTimeRequest = z.infer<typeof debugAdvanceTimeRequestSchema>;

const debugStatSchema = z.number().finite();

export const debugSetStateRequestSchema = z
  .object({
    hunger: debugStatSchema.optional(),
    energy: debugStatSchema.optional(),
    happiness: debugStatSchema.optional(),
    bond: debugStatSchema.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((stat) => stat !== undefined), {
    message: 'Provide at least one stat.',
  });
export type DebugSetStateRequest = z.infer<typeof debugSetStateRequestSchema>;

export const debugClockDtoSchema = z.object({
  now: z.iso.datetime(),
  offsetMs: z.number().nonnegative(),
});
export type DebugClockDto = z.infer<typeof debugClockDtoSchema>;

export const debugStateSchema = z.object({
  pet: petSnapshotSchema,
  debug: z.object({
    clock: debugClockDtoSchema,
    moodCandidates: z.array(z.object({ mood: moodSchema, score: z.number() })),
    events: z.array(petEventDtoSchema),
  }),
});
export type DebugState = z.infer<typeof debugStateSchema>;

export const debugAdvanceTimeResultSchema = debugStateSchema.extend({
  advancedMs: z.number().positive(),
});
export type DebugAdvanceTimeResult = z.infer<typeof debugAdvanceTimeResultSchema>;

export const debugCommandResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('SUCCESS'), state: debugStateSchema }),
  z.object({ status: z.literal('REJECTED'), reason: actionRejectionReasonSchema, state: debugStateSchema }),
]);
export type DebugCommandResult = z.infer<typeof debugCommandResultSchema>;

export const debugResetResultSchema = z.object({ reset: z.literal(true) });
export type DebugResetResult = z.infer<typeof debugResetResultSchema>;

// ---- AI + personality inspection (Phase 10). Debug-only; never Player Mode. ----

export const personalityTraitKeySchema = z.enum(['playful', 'curious', 'shy', 'independent', 'clingy']);
export type PersonalityTraitKeyDto = z.infer<typeof personalityTraitKeySchema>;

export const personalityTraitSchema = z.enum(['PLAYFUL', 'CURIOUS', 'SHY', 'INDEPENDENT', 'CLINGY']);
export type PersonalityTraitDto = z.infer<typeof personalityTraitSchema>;

export const personalityLevelSchema = z.enum(['low', 'moderate', 'high']);
export type PersonalityLevelDto = z.infer<typeof personalityLevelSchema>;

export const personalityLevelsSchema = z.object({
  playful: personalityLevelSchema,
  curious: personalityLevelSchema,
  shy: personalityLevelSchema,
  independent: personalityLevelSchema,
  clingy: personalityLevelSchema,
});
export type PersonalityLevelsDto = z.infer<typeof personalityLevelsSchema>;

export const personalityStrengthSchema = z.enum(['STRONG', 'MODERATE']);
export const socialStyleSchema = z.enum(['INDEPENDENT', 'CLINGY', 'BALANCED']);
export const relationshipLevelSchema = z.enum(['LOW', 'DEVELOPING', 'CLOSE']);

/** Deterministic personalities for evaluation and debugging (plan Task 10.4). */
export const personalityPresetSchema = z.enum([
  'BALANCED',
  'HIGH_PLAYFUL',
  'HIGH_CURIOUS',
  'HIGH_SHY',
  'HIGH_INDEPENDENT',
  'HIGH_CLINGY',
]);
export type PersonalityPresetDto = z.infer<typeof personalityPresetSchema>;

const personalityTraitsSchema = z.object({
  playful: z.number(),
  curious: z.number(),
  shy: z.number(),
  independent: z.number(),
  clingy: z.number(),
});

export const debugPersonalitySchema = z.object({
  /** Raw authoritative traits, hidden from the player. */
  traits: personalityTraitsSchema,
  daily: z.object({
    day: z.string().nullable(),
    capPerTrait: z.number(),
    deltas: personalityTraitsSchema,
  }),
  profile: z.object({
    levels: personalityLevelsSchema,
    dominantTraits: z.array(personalityTraitSchema),
    primaryTrait: personalityTraitSchema,
    strength: personalityStrengthSchema,
    socialStyle: socialStyleSchema,
  }),
});
export type DebugPersonality = z.infer<typeof debugPersonalitySchema>;

/** Either a preset name or explicit trait values — never both, never neither (plan Task 10.3). */
export const debugSetPersonalityRequestSchema = z
  .object({
    preset: personalityPresetSchema.optional(),
    playful: z.number().finite().optional(),
    curious: z.number().finite().optional(),
    shy: z.number().finite().optional(),
    independent: z.number().finite().optional(),
    clingy: z.number().finite().optional(),
  })
  .strict()
  .refine((value) => value.preset !== undefined || hasExplicitTrait(value), {
    message: 'Provide a preset or at least one trait.',
  })
  .refine((value) => !(value.preset !== undefined && hasExplicitTrait(value)), {
    message: 'Provide either a preset or explicit traits, not both.',
  });
export type DebugSetPersonalityRequest = z.infer<typeof debugSetPersonalityRequestSchema>;

function hasExplicitTrait(value: {
  playful?: number | undefined;
  curious?: number | undefined;
  shy?: number | undefined;
  independent?: number | undefined;
  clingy?: number | undefined;
}): boolean {
  return (
    value.playful !== undefined ||
    value.curious !== undefined ||
    value.shy !== undefined ||
    value.independent !== undefined ||
    value.clingy !== undefined
  );
}

/** Observability of the latest AI turn, sourced from the latest ASSISTANT message (plan Task 10.5). */
export const debugTurnSchema = z.object({
  intent: chatIntentSchema.nullable(),
  confidence: z.number().nullable(),
  classification: z.string().nullable(),
  action: chatActionSchema.nullable(),
  bondDelta: z.number().nullable(),
  fallbackUsed: z.boolean().nullable(),
  responseFailure: z.string().nullable(),
  interpretationFallback: z.boolean().nullable(),
  interpretationFailure: z.string().nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  latencyMs: z.number().nullable(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  occurredAt: z.iso.datetime(),
});
export type DebugTurn = z.infer<typeof debugTurnSchema>;

/** Bounded context inspection, mirroring what the AI is actually given (plan Task 10.6). */
export const debugContextSchema = z.object({
  state: petStateDtoSchema,
  mood: moodSchema,
  relationship: relationshipLevelSchema,
  levels: personalityLevelsSchema,
  dominantTraits: z.array(personalityTraitSchema),
  primaryTrait: personalityTraitSchema,
  strength: personalityStrengthSchema,
  socialStyle: socialStyleSchema,
  recentMessageCount: z.number().int().nonnegative(),
  recentEventCount: z.number().int().nonnegative(),
});
export type DebugContext = z.infer<typeof debugContextSchema>;

export const debugAiSchema = z.object({
  lastTurn: debugTurnSchema.nullable(),
  personality: debugPersonalitySchema.nullable(),
  context: debugContextSchema.nullable(),
});
export type DebugAi = z.infer<typeof debugAiSchema>;

