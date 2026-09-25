import { z } from 'zod';

import { actionTypeSchema } from './enums.js';

export const PET_NAME_MAX_LENGTH = 30;

// Mirrors the domain's normalizePetName (contracts stay dependency-free for the web app).
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/g;

/** Removes invisible characters, trims and collapses whitespace, then enforces 1–30 characters. */
export const petNameSchema = z
  .string()
  .transform((value) => value.replace(INVISIBLE_CHARACTERS, '').trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(1, 'Name cannot be empty.').max(PET_NAME_MAX_LENGTH));

export const namePetRequestSchema = z.object({ name: petNameSchema });
export type NamePetRequest = z.input<typeof namePetRequestSchema>;

export const petActionRequestSchema = z.object({ type: actionTypeSchema });
export type PetActionRequest = z.infer<typeof petActionRequestSchema>;
