import { z } from 'zod';

import {
  actionRejectionReasonSchema,
  actionTypeSchema,
  energyLabelSchema,
  fullnessLabelSchema,
  happinessLabelSchema,
  moodSchema,
  petActivitySchema,
  petEventTypeSchema,
  petStageSchema,
} from './enums.js';

const timestampSchema = z.iso.datetime();
const statSchema = z.number().min(0).max(100);

export const petDtoSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  species: z.string(),
  stage: petStageSchema,
  createdAt: timestampSchema,
  hatchedAt: timestampSchema.nullable(),
  version: z.number().int().nonnegative(),
});
export type PetDto = z.infer<typeof petDtoSchema>;

/** Raw authoritative state. Player UI presents `derived` instead of these numbers. */
export const petStateDtoSchema = z.object({
  hunger: statSchema,
  energy: statSchema,
  happiness: statSchema,
  bond: statSchema,
  currentActivity: petActivitySchema,
  lastInteractionAt: timestampSchema.nullable(),
  lastSimulatedAt: timestampSchema,
  sleepStartedAt: timestampSchema.nullable(),
});
export type PetStateDto = z.infer<typeof petStateDtoSchema>;

export const derivedStateDtoSchema = z.object({
  mood: moodSchema,
  needs: z.object({
    fullness: fullnessLabelSchema,
    energy: energyLabelSchema,
    happiness: happinessLabelSchema,
  }),
});
export type DerivedStateDto = z.infer<typeof derivedStateDtoSchema>;

export const petEventDtoSchema = z.object({
  id: z.number().int(),
  type: petEventTypeSchema,
  occurredAt: timestampSchema,
  payload: z.record(z.string(), z.unknown()),
});
export type PetEventDto = z.infer<typeof petEventDtoSchema>;

export const petSnapshotSchema = z.object({
  pet: petDtoSchema,
  state: petStateDtoSchema,
  derived: derivedStateDtoSchema,
  recentEvents: z.array(petEventDtoSchema),
});
export type PetSnapshot = z.infer<typeof petSnapshotSchema>;

export const hatchResultSchema = z.object({
  status: z.literal('SUCCESS'),
  pet: petSnapshotSchema,
});
export type HatchResult = z.infer<typeof hatchResultSchema>;

const statChangesSchema = z.object({
  hunger: z.number(),
  energy: z.number(),
  happiness: z.number(),
  bond: z.number(),
});

export const actionResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('SUCCESS'),
    action: z.object({ type: actionTypeSchema }),
    changes: statChangesSchema,
    pet: petSnapshotSchema,
  }),
  z.object({
    status: z.literal('REJECTED'),
    action: z.object({ type: actionTypeSchema }),
    reason: actionRejectionReasonSchema,
    pet: petSnapshotSchema,
  }),
]);
export type ActionResult = z.infer<typeof actionResultSchema>;

export const responseMetaSchema = z.object({ requestId: z.string() });

export function successEnvelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ data, meta: responseMetaSchema });
}
