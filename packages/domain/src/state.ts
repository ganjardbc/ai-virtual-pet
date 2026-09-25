import { DEFAULT_GAME_RULES, type GameRules } from './config.js';
import {
  createPetId,
  requireStat,
  requireValidDate,
  type PetId,
  type StatValue,
} from './primitives.js';

export type PetActivity =
  | 'IDLE'
  | 'SLEEPING'
  | 'PLAYING_ALONE'
  | 'RESTING'
  | 'LOOKING_AROUND'
  | 'WAITING';

export interface PetState {
  readonly petId: PetId;
  readonly hunger: StatValue;
  readonly energy: StatValue;
  readonly happiness: StatValue;
  readonly bond: StatValue;
  readonly currentActivity: PetActivity;
  readonly lastInteractionAt: Date | null;
  readonly lastSimulatedAt: Date;
  readonly sleepStartedAt: Date | null;
}

export function createPetState(state: PetState): PetState {
  requireValidDate(state.lastSimulatedAt, 'lastSimulatedAt');

  if (state.lastInteractionAt) {
    requireValidDate(state.lastInteractionAt, 'lastInteractionAt');
  }

  if (state.sleepStartedAt) {
    requireValidDate(state.sleepStartedAt, 'sleepStartedAt');
  }

  if (state.currentActivity === 'SLEEPING' && state.sleepStartedAt === null) {
    throw new RangeError('Sleeping state requires sleepStartedAt.');
  }

  if (state.currentActivity !== 'SLEEPING' && state.sleepStartedAt !== null) {
    throw new RangeError('Awake state cannot have sleepStartedAt.');
  }

  return {
    ...state,
    hunger: requireStat(state.hunger, 'hunger'),
    energy: requireStat(state.energy, 'energy'),
    happiness: requireStat(state.happiness, 'happiness'),
    bond: requireStat(state.bond, 'bond'),
  };
}

export function createInitialPetState(
  petId: string,
  createdAt: Date,
  rules: GameRules = DEFAULT_GAME_RULES,
): PetState {
  return createPetState({
    petId: createPetId(petId),
    ...rules.initialState,
    currentActivity: 'IDLE',
    lastInteractionAt: null,
    lastSimulatedAt: requireValidDate(createdAt, 'createdAt'),
    sleepStartedAt: null,
  });
}
