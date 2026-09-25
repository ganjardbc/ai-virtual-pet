import {
  DEFAULT_GAME_RULES,
  SeededRandom,
  SequenceRandom,
  createPetState,
  type GameRules,
  type PetState,
} from '@ai-virtual-pet/domain';
import { describe, expect, it } from 'vitest';

import { simulateElapsedTime } from './simulate.js';

const HOUR_MS = 60 * 60 * 1_000;
const from = new Date('2026-09-25T12:00:00.000Z');

const at = (hours: number) => new Date(from.getTime() + hours * HOUR_MS);

/** Rules whose autonomous activities do not change needs, so decay math can be asserted exactly. */
const neutralRules: GameRules = {
  ...DEFAULT_GAME_RULES,
  autonomy: {
    ...DEFAULT_GAME_RULES.autonomy,
    effects: {
      IDLE: { energyDecayMultiplier: 1, happinessPerHour: 0 },
      RESTING: { energyDecayMultiplier: 1, happinessPerHour: 0 },
      PLAYING_ALONE: { energyDecayMultiplier: 1, happinessPerHour: 0 },
      LOOKING_AROUND: { energyDecayMultiplier: 1, happinessPerHour: 0 },
      WAITING: { energyDecayMultiplier: 1, happinessPerHour: 0 },
    },
  },
};

function createState(overrides: Partial<PetState> = {}): PetState {
  return createPetState({
    petId: 'pet-1',
    hunger: 100,
    energy: 100,
    happiness: 70,
    bond: 10,
    currentActivity: 'IDLE',
    lastInteractionAt: null,
    lastSimulatedAt: from,
    sleepStartedAt: null,
    ...overrides,
  });
}

function simulate(state: PetState, hours: number, rules: GameRules = neutralRules, seed = 1) {
  return simulateElapsedTime({ state, to: at(hours), random: new SeededRandom(seed), rules });
}

describe('simulation contract', () => {
  it('moves lastSimulatedAt to the target time and leaves the input untouched', () => {
    const state = createState();
    const result = simulate(state, 3);

    expect(result.state.lastSimulatedAt).toEqual(at(3));
    expect(state.lastSimulatedAt).toEqual(from);
    expect(result.summary.elapsedMs).toBe(3 * HOUR_MS);
  });

  it('returns unchanged needs for zero elapsed time', () => {
    const result = simulate(createState(), 0);

    expect(result.state).toMatchObject({ hunger: 100, energy: 100, happiness: 70 });
    expect(result.events).toEqual([]);
  });

  it('refuses to move time backward', () => {
    expect(() => simulate(createState(), -1)).toThrow('cannot move time backward');
  });

  it('is reproducible for the same seed', () => {
    const first = simulate(createState(), 30, DEFAULT_GAME_RULES, 7);
    const second = simulate(createState(), 30, DEFAULT_GAME_RULES, 7);

    expect(first).toEqual(second);
  });

  it('gives the same result whether elapsed time is simulated at once or in steps', () => {
    const once = simulate(createState(), 20, DEFAULT_GAME_RULES, 3);
    const random = new SeededRandom(3);
    let stepped = createState();

    for (let hour = 1; hour <= 20; hour += 1) {
      stepped = simulateElapsedTime({
        state: stepped,
        to: at(hour),
        random,
        rules: DEFAULT_GAME_RULES,
      }).state;
    }

    expect(stepped.currentActivity).toBe(once.state.currentActivity);
    expect(stepped.hunger).toBeCloseTo(once.state.hunger, 6);
    expect(stepped.energy).toBeCloseTo(once.state.energy, 6);
    expect(stepped.happiness).toBeCloseTo(once.state.happiness, 6);
  });
});

describe('awake need decay', () => {
  it.each([
    { hours: 1, hunger: 98, energy: 98.5 },
    { hours: 6, hunger: 88, energy: 91 },
    { hours: 12, hunger: 76, energy: 82 },
    { hours: 24, hunger: 52, energy: 64 },
  ])('decays Hunger and Energy over $hours hours awake', ({ hours, hunger, energy }) => {
    const result = simulate(createState(), hours);

    expect(result.state.hunger).toBeCloseTo(hunger, 6);
    expect(result.state.energy).toBeCloseTo(energy, 6);
    expect(result.state.happiness).toBe(70);
    expect(result.state.bond).toBe(10);
  });

  it('supports fractional durations', () => {
    const result = simulate(createState(), 0.25);

    expect(result.state.hunger).toBeCloseTo(99.5, 6);
    expect(result.state.energy).toBeCloseTo(99.625, 6);
  });

  it('clamps Hunger at 0', () => {
    const result = simulate(createState({ hunger: 3 }), 6);

    expect(result.state.hunger).toBe(0);
  });

  it('applies activity effects while awake', () => {
    const resting = simulate(createState({ currentActivity: 'RESTING' }), 0.5, DEFAULT_GAME_RULES);
    const playing = simulate(
      createState({ currentActivity: 'PLAYING_ALONE' }),
      0.5,
      DEFAULT_GAME_RULES,
    );

    expect(resting.state.energy).toBeCloseTo(100 - 0.75 * 0.5, 6);
    expect(playing.state.energy).toBeCloseTo(100 - 2.25 * 0.5, 6);
    expect(playing.state.happiness).toBeCloseTo(70.5, 6);
  });
});

describe('sleeping simulation', () => {
  const sleeping = (energy: number, sleepStartedAt = from) =>
    createState({ currentActivity: 'SLEEPING', sleepStartedAt, energy });

  it('recovers Energy and slows Hunger decay for 1 hour of sleep', () => {
    const result = simulate(sleeping(20), 1);

    expect(result.state).toMatchObject({ currentActivity: 'SLEEPING', energy: 32, hunger: 99 });
  });

  it('recovers across multiple hours of sleep', () => {
    const result = simulate(sleeping(20), 5);

    expect(result.state).toMatchObject({ currentActivity: 'SLEEPING', energy: 80, hunger: 95 });
  });

  it('clamps Energy at 100', () => {
    const result = simulate(sleeping(99), 0.5);

    expect(result.state.energy).toBe(100);
  });

  it('keeps sleeping at least the minimum duration even when rested', () => {
    expect(simulate(sleeping(100), 0.25).state.currentActivity).toBe('SLEEPING');
    expect(simulate(sleeping(100), 0.5).state.currentActivity).toBe('IDLE');
  });
});

describe('automatic wake', () => {
  it('splits the interval into sleep and awake segments when the wake threshold is crossed', () => {
    // Energy 47 needs 4h at +12/h to reach 95; the remaining 6h use awake rules.
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: from, energy: 47 });
    const result = simulate(state, 10);

    expect(result.state.currentActivity).not.toBe('SLEEPING');
    expect(result.state.sleepStartedAt).toBeNull();
    expect(result.state.energy).toBeCloseTo(95 - 6 * 1.5, 6);
    expect(result.state.hunger).toBeCloseTo(100 - 4 * 1 - 6 * 2, 6);
    expect(result.summary.activityMs.SLEEPING).toBe(4 * HOUR_MS);
    expect(result.events[0]).toMatchObject({
      type: 'PET_WOKE_UP',
      occurredAt: at(4),
      payload: { cause: 'ENERGY_RESTORED' },
    });
  });

  it('wakes after the maximum sleep duration', () => {
    const slowRecovery: GameRules = {
      ...neutralRules,
      energy: { ...neutralRules.energy, sleepingRecoveryPerHour: 5 },
    };
    const state = createState({ currentActivity: 'SLEEPING', sleepStartedAt: from, energy: 0 });
    const result = simulate(state, 9, slowRecovery);

    expect(result.events[0]).toMatchObject({
      type: 'PET_WOKE_UP',
      occurredAt: at(8),
      payload: { cause: 'MAX_DURATION' },
    });
    expect(result.state.energy).toBeCloseTo(40 - 1.5, 6);
  });

  it('wakes immediately when sleep started before the maximum duration elapsed', () => {
    const state = createState({
      currentActivity: 'SLEEPING',
      sleepStartedAt: new Date(from.getTime() - 9 * HOUR_MS),
      energy: 50,
    });
    const result = simulate(state, 1);

    expect(result.events[0]).toMatchObject({ type: 'PET_WOKE_UP', occurredAt: from });
  });
});

describe('autonomous sleep', () => {
  it('falls asleep at the next decision point once Energy is very low', () => {
    const result = simulate(createState({ energy: 11 }), 2);

    expect(result.events[0]).toMatchObject({
      type: 'PET_STARTED_SLEEPING',
      occurredAt: at(1),
      payload: { source: 'AUTONOMOUS' },
    });
    expect(result.state.currentActivity).toBe('SLEEPING');
    expect(result.state.sleepStartedAt).toEqual(at(1));
  });
});

describe('happiness passive effects', () => {
  it('does not decay Happiness while needs are healthy', () => {
    expect(simulate(createState(), 24).state.happiness).toBe(70);
  });

  it('applies pressure from severe hunger', () => {
    expect(simulate(createState({ hunger: 20 }), 10).state.happiness).toBeCloseTo(65, 6);
  });

  it('applies pressure from severe exhaustion while awake', () => {
    expect(simulate(createState({ energy: 20 }), 4).state.happiness).toBeCloseTo(68, 6);
  });

  it('only applies pressure after a need crosses into the severe range', () => {
    // Hunger 30 reaches 25 after 2.5h, so only 1.5h of pressure applies.
    expect(simulate(createState({ hunger: 30 }), 4).state.happiness).toBeCloseTo(69.25, 6);
  });

  it('does not stack overlapping pressure beyond the daily cap rate', () => {
    expect(simulate(createState({ hunger: 20, energy: 20 }), 4).state.happiness).toBeCloseTo(68, 6);
  });

  it('caps passive loss at 12 per day', () => {
    const result = simulate(createState({ hunger: 0 }), 24, DEFAULT_GAME_RULES);

    expect(result.state.happiness).toBeCloseTo(58, 6);
  });

  it('never pushes Happiness below the passive floor', () => {
    const result = simulate(createState({ hunger: 0 }), 7 * 24, DEFAULT_GAME_RULES);

    expect(result.state.happiness).toBe(30);
  });

  it('does not raise Happiness that is already below the floor', () => {
    const result = simulate(createState({ hunger: 0, happiness: 20 }), 24);

    expect(result.state.happiness).toBe(20);
  });
});

describe('no passive Bond decay', () => {
  it.each([1, 24, 48, 7 * 24, 30 * 24])('keeps Bond unchanged after %i hours', (hours) => {
    const result = simulate(createState({ bond: 42.5, hunger: 10, energy: 12 }), hours, DEFAULT_GAME_RULES);

    expect(result.state.bond).toBe(42.5);
  });
});

describe('simulation events', () => {
  it('only emits transition events, never one per hour', () => {
    const result = simulate(createState({ currentActivity: 'WAITING' }), 48, DEFAULT_GAME_RULES);
    const types = new Set(result.events.map((event) => event.type));

    expect(result.events.length).toBeLessThan(48);
    expect([...types].every((type) =>
      ['PET_ACTIVITY_CHANGED', 'PET_STARTED_SLEEPING', 'PET_WOKE_UP'].includes(type),
    )).toBe(true);

    for (const event of result.events.filter((e) => e.type === 'PET_ACTIVITY_CHANGED')) {
      expect(event.payload.from).not.toBe(event.payload.to);
    }
  });

  it('does not emit an activity event when the decision keeps the current activity', () => {
    // RESTING (weight 1×2) is selected by a draw of 0 while already RESTING.
    const state = createState({ currentActivity: 'RESTING' });
    const result = simulateElapsedTime({
      state,
      to: at(1),
      random: new SequenceRandom([0]),
      rules: neutralRules,
    });

    expect(result.state.currentActivity).toBe('RESTING');
    expect(result.events).toEqual([]);
  });
});

describe('detailed simulation horizon', () => {
  it('approximates time beyond 48 hours and only reports events from the detailed window', () => {
    const result = simulate(createState(), 7 * 24, DEFAULT_GAME_RULES);
    const detailedFrom = at(7 * 24 - 48).getTime();

    expect(result.summary.approximatedMs).toBe(5 * 24 * HOUR_MS);
    expect(result.events.every((event) => event.occurredAt.getTime() >= detailedFrom)).toBe(true);
  });

  it('keeps sleeping in cycles during the approximated window', () => {
    const result = simulate(createState(), 7 * 24, DEFAULT_GAME_RULES);

    expect(result.summary.activityMs.SLEEPING ?? 0).toBeGreaterThan(0);
  });

  it('simulates +7 days quickly', () => {
    const started = Date.now();

    for (let run = 0; run < 100; run += 1) {
      simulate(createState(), 7 * 24, DEFAULT_GAME_RULES, run);
    }

    expect((Date.now() - started) / 100).toBeLessThan(5);
  });

  it('handles a year of absence', () => {
    const result = simulate(createState({ bond: 30 }), 365 * 24, DEFAULT_GAME_RULES);

    expect(result.state.bond).toBe(30);
    expect(result.state.happiness).toBeGreaterThanOrEqual(30);
  });
});
