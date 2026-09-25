import {
  createPetId,
  createPetName,
  requireValidDate,
  type PetId,
  type PetName,
} from './primitives.js';

export type PetStage = 'EGG' | 'BABY';

interface PetBase {
  readonly id: PetId;
  readonly createdAt: Date;
}

export interface EggPet extends PetBase {
  readonly stage: 'EGG';
  readonly name: null;
  readonly hatchedAt: null;
}

export interface BabyPet extends PetBase {
  readonly stage: 'BABY';
  readonly name: PetName | null;
  readonly hatchedAt: Date;
}

export type Pet = EggPet | BabyPet;

export function createEgg(input: { id: string; createdAt: Date }): EggPet {
  return {
    id: createPetId(input.id),
    stage: 'EGG',
    name: null,
    createdAt: requireValidDate(input.createdAt, 'createdAt'),
    hatchedAt: null,
  };
}

export function hatchPet(pet: EggPet, hatchedAt: Date): BabyPet {
  const timestamp = requireValidDate(hatchedAt, 'hatchedAt');

  if (timestamp < pet.createdAt) {
    throw new RangeError('hatchedAt cannot be earlier than createdAt.');
  }

  return {
    ...pet,
    stage: 'BABY',
    hatchedAt: timestamp,
  };
}

export function namePet(pet: BabyPet, name: string): BabyPet {
  return {
    ...pet,
    name: createPetName(name),
  };
}
