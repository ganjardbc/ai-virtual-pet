import { describe, expect, it } from 'vitest';

import { applyFeed, applyPlay, startSleep, wakePet } from './actions.js';
import { createPetState, type PetState } from './state.js';

const now = new Date('2026-09-25T12:00:00.000Z');
const hourMs = 60 * 60 * 1_000;

function createState(overrides: Partial<PetState> = {}): PetState {
  return createPetState({
    petId: 'pet-1',
    hunger: 50,
    energy: 60,
    happiness: 50,
    bond: 10,
    currentActivity: 'IDLE',
    lastInteractionAt: null,
    lastSimulatedAt: new Date('2026-09-25T11:00:00.000Z'),
    sleepStartedAt: null,
    ...overrides,
  });
}

describe('applyFeed', () => {
  it('applies the normal deterministic Feed effect and event', () => {
    const result = applyFeed(createState(), now);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({ hunger: 75, happiness: 52, bond: 10.3 });
    expect(result.state.lastInteractionAt).toBe(now);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe('PET_FED');
  });

  it('uses diminished effects when already near full', () => {
    const result = applyFeed(createState({ hunger: 80 }), now);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({ hunger: 90, happiness: 51, bond: 10.1 });
  });

  it.each([
    { hunger: 74, expectedHunger: 99, multiplier: 1 },
    { hunger: 75, expectedHunger: 85, multiplier: 0.4 },
    { hunger: 89, expectedHunger: 99, multiplier: 0.4 },
  ])('switches to diminished Feed at the 75 boundary (hunger $hunger)', ({ hunger, expectedHunger, multiplier }) => {
    const result = applyFeed(createState({ hunger }), now);

    expect(result.accepted).toBe(true);
    expect(result.effectMultiplier).toBe(multiplier);
    expect(result.state.hunger).toBe(expectedHunger);
  });

  it('rejects Feed when full without mutating state', () => {
    const state = createState({ hunger: 90 });
    const result = applyFeed(state, now);

    expect(result).toMatchObject({ accepted: false, reason: 'TOO_FULL', state });
    expect(result.state).toBe(state);
    expect(result.events[0]).toMatchObject({
      type: 'ACTION_REJECTED',
      payload: { action: 'FEED', reason: 'TOO_FULL' },
    });
  });

  it('rejects Feed while sleeping', () => {
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: now });

    expect(applyFeed(state, now)).toMatchObject({ accepted: false, reason: 'SLEEPING' });
  });

  it('clamps Feed results at 100', () => {
    const result = applyFeed(createState({ hunger: 74, happiness: 99, bond: 99.9 }), now);

    expect(result.state).toMatchObject({ hunger: 99, happiness: 100, bond: 100 });
  });
});

describe('applyPlay', () => {
  it('applies the normal Play effect and event', () => {
    const result = applyPlay(createState(), now);

    expect(result.accepted).toBe(true);
    expect(result.effectMultiplier).toBe(1);
    expect(result.state).toMatchObject({ hunger: 46, energy: 50, happiness: 62, bond: 11 });
    expect(result.events[0]?.type).toBe('PET_PLAYED');
  });

  it('accepts Play at the minimum valid Energy', () => {
    const result = applyPlay(createState({ energy: 16 }), now);

    expect(result.accepted).toBe(true);
    expect(result.state.energy).toBe(6);
  });

  it('rejects Play at the exact Energy threshold without mutation', () => {
    const state = createState({ energy: 15 });
    const result = applyPlay(state, now);

    expect(result).toMatchObject({ accepted: false, reason: 'TOO_TIRED', state });
    expect(result.state).toBe(state);
  });

  it('rejects Play while sleeping', () => {
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: now });

    expect(applyPlay(state, now)).toMatchObject({ accepted: false, reason: 'SLEEPING' });
  });

  it.each([
    { previousCount: 0, multiplier: 1, happiness: 62, bond: 11 },
    { previousCount: 1, multiplier: 0.75, happiness: 59, bond: 10.75 },
    { previousCount: 2, multiplier: 0.5, happiness: 56, bond: 10.5 },
    { previousCount: 3, multiplier: 0.25, happiness: 53, bond: 10.25 },
    { previousCount: 6, multiplier: 0.25, happiness: 53, bond: 10.25 },
  ])(
    'uses multiplier $multiplier after $previousCount recent Play actions',
    ({ previousCount, multiplier, happiness, bond }) => {
      const previousPlayTimes = Array.from(
        { length: previousCount },
        (_, index) => new Date(now.getTime() - (index + 1) * 10 * 60 * 1_000),
      );
      const result = applyPlay(createState(), now, previousPlayTimes);

      expect(result.effectMultiplier).toBe(multiplier);
      expect(result.state.happiness).toBe(happiness);
      expect(result.state.bond).toBe(bond);
      expect(result.state.energy).toBe(50);
      expect(result.state.hunger).toBe(46);
    },
  );

  it('resets the diminishing count after two hours', () => {
    const exactlyTwoHoursAgo = new Date(now.getTime() - 2 * hourMs);
    const result = applyPlay(createState(), now, [exactlyTwoHoursAgo]);

    expect(result.effectMultiplier).toBe(1);
  });

  it('clamps Play costs and benefits to the stat range', () => {
    const result = applyPlay(
      createState({ hunger: 2, energy: 16, happiness: 98, bond: 99.5 }),
      now,
    );

    expect(result.state).toMatchObject({ hunger: 0, energy: 6, happiness: 100, bond: 100 });
  });
});

describe('Sleep and Wake', () => {
  it('starts sleep with deterministic activity, timestamp, Bond, and event', () => {
    const result = startSleep(createState(), now);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({
      currentActivity: 'SLEEPING',
      sleepStartedAt: now,
      lastInteractionAt: now,
      bond: 10.1,
    });
    expect(result.events[0]?.type).toBe('PET_STARTED_SLEEPING');
  });

  it('rejects starting sleep when already sleeping', () => {
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: now });

    expect(startSleep(state, now)).toMatchObject({ accepted: false, reason: 'SLEEPING' });
  });

  it('wakes a sleeping pet without treating it as a player interaction', () => {
    const sleepStartedAt = new Date('2026-09-25T10:00:00.000Z');
    const lastInteractionAt = sleepStartedAt;
    const state = createState({
      currentActivity: 'SLEEPING',
      sleepStartedAt,
      lastInteractionAt,
    });
    const result = wakePet(state, now);

    expect(result.accepted).toBe(true);
    expect(result.state).toMatchObject({
      currentActivity: 'IDLE',
      sleepStartedAt: null,
      lastInteractionAt,
    });
    expect(result.events[0]?.type).toBe('PET_WOKE_UP');
  });

  it('keeps stats and simulation time unchanged on Wake', () => {
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: now });
    const result = wakePet(state, now);

    expect(result.state).toMatchObject({
      hunger: state.hunger,
      energy: state.energy,
      happiness: state.happiness,
      bond: state.bond,
      lastSimulatedAt: state.lastSimulatedAt,
    });
  });

  it('rejects Wake when the pet is already awake', () => {
    const state = createState();
    const result = wakePet(state, now);

    expect(result).toMatchObject({ accepted: false, reason: 'INVALID_STATE', state });
    expect(result.state).toBe(state);
  });
});

describe('stat range invariant', () => {
  it.each([
    { hunger: 0, energy: 16, happiness: 0, bond: 0 },
    { hunger: 89.9, energy: 100, happiness: 100, bond: 100 },
    { hunger: 3, energy: 16, happiness: 99.9, bond: 99.9 },
  ])('keeps every stat within 0–100 across all actions from $hunger/$energy/$happiness/$bond', (stats) => {
    const state = createState(stats);
    const results = [
      applyFeed(state, now),
      applyPlay(state, now),
      applyPlay(state, now, [now, now, now]),
      startSleep(state, now),
      wakePet(startSleep(state, now).state, now),
    ];

    for (const { state: next } of results) {
      for (const value of [next.hunger, next.energy, next.happiness, next.bond]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});
