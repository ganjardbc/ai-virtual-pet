import {
  DEFAULT_GAME_RULES,
  SequenceRandom,
  createPetState,
  type PetState,
} from '@ai-virtual-pet/domain';
import { describe, expect, it } from 'vitest';

import { activityWeights, decideAutonomousActivity } from './autonomy.js';
import { deriveEnergyLabel, deriveFullnessLabel, deriveHappinessLabel } from './labels.js';
import { deriveMood } from './mood.js';

const MINUTE_MS = 60 * 1_000;
const now = new Date('2026-09-25T12:00:00.000Z');
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * MINUTE_MS);

function createState(overrides: Partial<PetState> = {}): PetState {
  return createPetState({
    petId: 'pet-1',
    hunger: 100,
    energy: 100,
    happiness: 70,
    bond: 10,
    currentActivity: 'IDLE',
    lastInteractionAt: now,
    lastSimulatedAt: now,
    sleepStartedAt: null,
    ...overrides,
  });
}

describe('autonomous activity selection', () => {
  it('always chooses sleep when Energy is very low without consuming randomness', () => {
    const random = new SequenceRandom([]);

    expect(decideAutonomousActivity(createState({ energy: 10 }), DEFAULT_GAME_RULES, random)).toBe(
      'SLEEPING',
    );
  });

  it.each([
    { draw: 0, expected: 'RESTING' },
    { draw: 0.2, expected: 'PLAYING_ALONE' },
    { draw: 0.5, expected: 'LOOKING_AROUND' },
    { draw: 0.99, expected: 'WAITING' },
  ])('maps draw $draw to $expected with healthy needs', ({ draw, expected }) => {
    const random = new SequenceRandom([draw]);

    expect(decideAutonomousActivity(createState(), DEFAULT_GAME_RULES, random)).toBe(expected);
  });

  it('does not play alone when tired or hungry', () => {
    expect(activityWeights(createState({ energy: 50 }), DEFAULT_GAME_RULES).PLAYING_ALONE).toBe(0);
    expect(activityWeights(createState({ hunger: 25 }), DEFAULT_GAME_RULES).PLAYING_ALONE).toBe(0);
  });

  it('prefers resting when tired', () => {
    expect(activityWeights(createState({ energy: 30 }), DEFAULT_GAME_RULES).RESTING).toBe(4);
  });

  it('favors continuing the current activity', () => {
    const weights = activityWeights(
      createState({ currentActivity: 'LOOKING_AROUND' }),
      DEFAULT_GAME_RULES,
    );

    expect(weights.LOOKING_AROUND).toBe(4);
  });
});

describe('mood derivation', () => {
  it('falls back to NEUTRAL', () => {
    expect(deriveMood({ state: createState(), now }).mood).toBe('NEUTRAL');
  });

  it('is HAPPY with high Happiness', () => {
    expect(deriveMood({ state: createState({ happiness: 75 }), now }).mood).toBe('HAPPY');
  });

  it('prioritizes SLEEPY over HUNGRY using intensity scores', () => {
    const mood = deriveMood({ state: createState({ energy: 8, hunger: 20 }), now });

    expect(mood).toMatchObject({ mood: 'SLEEPY', score: 82 });
  });

  it('is HUNGRY with intensity-based score', () => {
    expect(deriveMood({ state: createState({ hunger: 15 }), now })).toMatchObject({
      mood: 'HUNGRY',
      score: 74,
    });
  });

  it('is EXCITED shortly after Play when happy enough', () => {
    const state = createState({ happiness: 80 });

    expect(deriveMood({ state, now, lastPlayedAt: minutesAgo(10) }).mood).toBe('EXCITED');
    expect(deriveMood({ state, now, lastPlayedAt: minutesAgo(31) }).mood).toBe('HAPPY');
  });

  it('is not EXCITED while sleeping, even right after Play', () => {
    const state = createState({ happiness: 80, currentActivity: 'SLEEPING', sleepStartedAt: now });

    expect(deriveMood({ state, now, lastPlayedAt: minutesAgo(1) }).mood).toBe('HAPPY');
  });

  it('is BORED after a long time without interaction while awake and not tired', () => {
    const state = createState({ lastInteractionAt: minutesAgo(8 * 60) });

    expect(deriveMood({ state, now }).mood).toBe('BORED');
    expect(deriveMood({ state: { ...state, energy: 40 }, now }).mood).toBe('NEUTRAL');
    expect(
      deriveMood({ state: { ...state, currentActivity: 'SLEEPING', sleepStartedAt: now }, now }).mood,
    ).toBe('NEUTRAL');
  });

  it('keeps the previous mood for its minimum duration while it still qualifies', () => {
    const state = createState({ happiness: 80 });
    const previous = { mood: 'HAPPY' as const, score: 40, since: minutesAgo(5) };
    const lastPlayedAt = minutesAgo(1);

    expect(deriveMood({ state, now, lastPlayedAt, previous })).toMatchObject({
      mood: 'HAPPY',
      since: previous.since,
    });

    const later = { ...previous, since: minutesAgo(15) };
    expect(deriveMood({ state, now, lastPlayedAt, previous: later }).mood).toBe('EXCITED');
  });

  it('lets critical needs override the minimum duration', () => {
    const previous = { mood: 'HAPPY' as const, score: 40, since: minutesAgo(1) };
    const state = createState({ happiness: 80, energy: 10 });

    expect(deriveMood({ state, now, previous })).toMatchObject({ mood: 'SLEEPY', since: now });
  });

  it('drops a previous mood immediately once it no longer applies', () => {
    const previous = { mood: 'HUNGRY' as const, score: 70, since: minutesAgo(1) };

    expect(deriveMood({ state: createState({ hunger: 60 }), now, previous }).mood).toBe('NEUTRAL');
  });
});

describe('need labels', () => {
  it.each([
    [0, 'VERY_HUNGRY'],
    [25, 'VERY_HUNGRY'],
    [25.1, 'HUNGRY'],
    [50, 'HUNGRY'],
    [50.1, 'OKAY'],
    [75, 'FULL'],
    [89.9, 'FULL'],
    [90, 'VERY_FULL'],
  ] as const)('labels Hunger %d as %s fullness', (hunger, label) => {
    expect(deriveFullnessLabel(hunger)).toBe(label);
  });

  it.each([
    [0, 'EXHAUSTED'],
    [15, 'EXHAUSTED'],
    [16, 'TIRED'],
    [50, 'TIRED'],
    [51, 'OKAY'],
    [75, 'ENERGETIC'],
  ] as const)('labels Energy %d as %s', (energy, label) => {
    expect(deriveEnergyLabel(energy)).toBe(label);
  });

  it.each([
    [0, 'LOW'],
    [35, 'LOW'],
    [36, 'OKAY'],
    [75, 'HAPPY'],
    [90, 'VERY_HAPPY'],
  ] as const)('labels Happiness %d as %s', (happiness, label) => {
    expect(deriveHappinessLabel(happiness)).toBe(label);
  });
});
