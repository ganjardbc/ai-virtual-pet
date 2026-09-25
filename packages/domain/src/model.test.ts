import { describe, expect, it } from 'vitest';

import { createEgg, hatchPet, namePet } from './pet.js';
import { clampStat, createPetName, requireStat } from './primitives.js';
import { DEFAULT_GAME_RULES } from './config.js';
import { createInitialPetState, createPetState } from './state.js';

const createdAt = new Date('2026-09-25T00:00:00.000Z');

describe('domain primitives', () => {
  it('clamps normal mutations to the stat range', () => {
    expect(clampStat(-4)).toBe(0);
    expect(clampStat(42.5)).toBe(42.5);
    expect(clampStat(108)).toBe(100);
  });

  it('rejects invalid persisted stat values', () => {
    expect(() => requireStat(-1, 'energy')).toThrow('energy must be between 0 and 100');
    expect(() => requireStat(Number.NaN)).toThrow('must be a finite number');
  });

  it('normalizes pet names', () => {
    expect(createPetName('  Momo   Kecil  ')).toBe('Momo Kecil');
    expect(() => createPetName('   ')).toThrow('Pet name must contain');
    expect(() => createPetName('\u200B\u200B')).toThrow('Pet name must contain');
    expect(createPetName('Mo\u200Bmo')).toBe('Momo');
  });
});

describe('Pet', () => {
  it('represents Egg, unnamed Baby, and named Baby without ambiguous lifecycle fields', () => {
    const egg = createEgg({ id: 'pet-1', createdAt });
    const baby = hatchPet(egg, new Date('2026-09-25T00:01:00.000Z'));
    const namedBaby = namePet(baby, ' Momo ');

    expect(egg).toMatchObject({ stage: 'EGG', name: null, hatchedAt: null });
    expect(baby).toMatchObject({ stage: 'BABY', name: null });
    expect(namedBaby.name).toBe('Momo');
  });

  it('rejects a hatch timestamp before pet creation', () => {
    const egg = createEgg({ id: 'pet-1', createdAt });

    expect(() => hatchPet(egg, new Date('2026-09-24T23:59:00.000Z'))).toThrow(
      'hatchedAt cannot be earlier',
    );
  });
});

describe('PetState', () => {
  it('accepts a valid awake state', () => {
    const state = createPetState({
      petId: 'pet-1',
      hunger: 80,
      energy: 75,
      happiness: 70,
      bond: 10,
      currentActivity: 'IDLE',
      lastInteractionAt: null,
      lastSimulatedAt: createdAt,
      sleepStartedAt: null,
    });

    expect(state.currentActivity).toBe('IDLE');
  });

  it('rejects inconsistent sleeping state', () => {
    expect(() =>
      createPetState({
        petId: 'pet-1',
        hunger: 80,
        energy: 75,
        happiness: 70,
        bond: 10,
        currentActivity: 'SLEEPING',
        lastInteractionAt: null,
        lastSimulatedAt: createdAt,
        sleepStartedAt: null,
      }),
    ).toThrow('Sleeping state requires sleepStartedAt');
  });
});

describe('initial PetState', () => {
  it('builds the default awake Baby state from game rules', () => {
    const state = createInitialPetState('pet-1', createdAt);

    expect(state).toEqual({
      petId: 'pet-1',
      ...DEFAULT_GAME_RULES.initialState,
      currentActivity: 'IDLE',
      lastInteractionAt: null,
      lastSimulatedAt: createdAt,
      sleepStartedAt: null,
    });
  });

  it('accepts overridden rules', () => {
    const rules = {
      ...DEFAULT_GAME_RULES,
      initialState: { hunger: 60, energy: 50, happiness: 40, bond: 0 },
    };

    expect(createInitialPetState('pet-1', createdAt, rules)).toMatchObject(rules.initialState);
  });
});

describe('DEFAULT_GAME_RULES', () => {
  it('is deeply immutable', () => {
    expect(Object.isFrozen(DEFAULT_GAME_RULES)).toBe(true);
    expect(Object.isFrozen(DEFAULT_GAME_RULES.feed.base)).toBe(true);
    expect(Object.isFrozen(DEFAULT_GAME_RULES.play.diminishingMultipliers)).toBe(true);
    expect(Object.isFrozen(DEFAULT_GAME_RULES.initialState)).toBe(true);
  });
});
