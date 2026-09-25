import { z } from 'zod';

import { actionRejectionReasonSchema, moodSchema } from './enums.js';
import { petEventDtoSchema, petSnapshotSchema } from './responses.js';

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

