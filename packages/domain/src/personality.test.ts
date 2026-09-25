import { describe, expect, it } from 'vitest';

import { DEFAULT_PERSONALITY_RULES } from './config.js';
import { createDomainEvent } from './events.js';
import {
  applyAutonomousIndependentSignal,
  applyPersonalitySignal,
  createInitialPersonality,
  createPersonalityState,
  hasQualifyingAutonomousActivity,
  PERSONALITY_SIGNALS,
  setPersonalityTraits,
  type PersonalityState,
  type PetPersonality,
} from './personality.js';
import {
  derivePersonalityProfile,
  derivePersonalityPromptProfile,
  personalityLevel,
} from './personality-profile.js';
import { PERSONALITY_PRESETS, PERSONALITY_PRESET_NAMES } from './personality-presets.js';
import { requireDayBucket, utcDayBucket } from './primitives.js';
import { SeededRandom, SequenceRandom } from './random.js';

const now = new Date('2026-09-25T12:00:00.000Z');
const nextDay = new Date('2026-09-26T00:00:00.000Z');
const ZERO: PetPersonality = { playful: 0, curious: 0, shy: 0, independent: 0, clingy: 0 };
const BALANCED: PetPersonality = { playful: 0.45, curious: 0.45, shy: 0.45, independent: 0.45, clingy: 0.45 };

function createState(traits: Partial<PetPersonality> = {}, overrides: Partial<PersonalityState> = {}): PersonalityState {
  return createPersonalityState({
    petId: 'pet-1',
    traits: { ...BALANCED, ...traits },
    daily: { day: null, deltas: ZERO },
    lastIndependentSignalDay: null,
    ...overrides,
  });
}

/** Applies a signal repeatedly at the same time, returning the final state. */
function applyTimes(state: PersonalityState, signal: 'PLAY' | 'AFFECTION' | 'PRAISE', times: number, at = now) {
  let current = state;

  for (let index = 0; index < times; index += 1) {
    current = applyPersonalitySignal(current, signal, at).state;
  }

  return current;
}

describe('utcDayBucket', () => {
  it('uses the UTC calendar day of the given time', () => {
    expect(utcDayBucket(new Date('2026-09-25T23:59:59.999Z'))).toBe('2026-09-25');
    expect(utcDayBucket(nextDay)).toBe('2026-09-26');
  });

  it('validates stored day buckets', () => {
    expect(requireDayBucket('2026-09-25', 'day')).toBe('2026-09-25');
    expect(() => requireDayBucket('2026-02-30', 'day')).toThrow(RangeError);
    expect(() => requireDayBucket('25-09-2026', 'day')).toThrow(RangeError);
  });
});

describe('createPersonalityState', () => {
  it('rejects traits outside 0.05–0.95', () => {
    expect(() => createState({ playful: 0.04 })).toThrow(RangeError);
    expect(() => createState({ playful: 0.96 })).toThrow(RangeError);
    expect(() => createState({ playful: Number.NaN })).toThrow(TypeError);
  });

  it('rejects Independent + Clingy above 1.40', () => {
    expect(() => createState({ independent: 0.8, clingy: 0.61 })).toThrow(RangeError);
    expect(createState({ independent: 0.8, clingy: 0.6 }).traits.clingy).toBe(0.6);
  });

  it('rejects daily deltas above the cap', () => {
    expect(() =>
      createState({}, { daily: { day: '2026-09-25', deltas: { ...ZERO, playful: 0.031 } } }),
    ).toThrow(RangeError);
  });
});

describe('createInitialPersonality', () => {
  it('starts every trait within 0.35–0.55', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const { traits } = createInitialPersonality('pet-1', new SeededRandom(seed));

      for (const value of Object.values(traits)) {
        expect(value).toBeGreaterThanOrEqual(0.35);
        expect(value).toBeLessThanOrEqual(0.55);
      }
    }
  });

  it('is deterministic for the injected Random, in canonical trait order', () => {
    const personality = createInitialPersonality('pet-1', new SequenceRandom([0, 0.25, 0.5, 0.75, 0.999999]));

    expect(personality.traits).toEqual({ playful: 0.35, curious: 0.4, shy: 0.45, independent: 0.5, clingy: 0.55 });
    expect(createInitialPersonality('pet-1', new SeededRandom(7))).toEqual(
      createInitialPersonality('pet-1', new SeededRandom(7)),
    );
  });

  it('starts with no daily evolution and no Independent signal', () => {
    const personality = createInitialPersonality('pet-1', new SeededRandom(1));

    expect(personality.daily).toEqual({ day: null, deltas: ZERO });
    expect(personality.lastIndependentSignalDay).toBeNull();
  });
});

describe('applyPersonalitySignal', () => {
  it('PLAY raises Playful by 0.006 and records the change', () => {
    const result = applyPersonalitySignal(createState({ playful: 0.48 }), 'PLAY', now);

    expect(result.state.traits.playful).toBe(0.486);
    expect(result.changes).toEqual([
      { trait: 'PLAYFUL', previous: 0.48, next: 0.486, appliedDelta: 0.006, reason: 'SIGNAL' },
    ]);
    expect(result.state.daily).toEqual({ day: '2026-09-25', deltas: { ...ZERO, playful: 0.006 } });
  });

  it('AFFECTION raises Clingy and lowers Shy', () => {
    const { state } = applyPersonalitySignal(createState(), 'AFFECTION', now);

    expect(state.traits).toMatchObject({ clingy: 0.453, shy: 0.449 });
  });

  it('CURIOSITY raises Curious by 0.004', () => {
    expect(applyPersonalitySignal(createState(), 'CURIOSITY', now).state.traits.curious).toBe(0.454);
  });

  it.each([
    { signal: 'PRAISE' as const, expected: { shy: 0.448 } },
    { signal: 'COMFORT' as const, expected: { clingy: 0.452, shy: 0.449 } },
    { signal: 'CARE' as const, expected: { clingy: 0.451 } },
  ])('$signal applies its configured deltas', ({ signal, expected }) => {
    expect(applyPersonalitySignal(createState(), signal, now).state.traits).toMatchObject(expected);
  });

  it.each(['CASUAL', 'TEASING'] as const)('%s is a no-op that returns the same state', (signal) => {
    const state = createState();
    const result = applyPersonalitySignal(state, signal, now);

    expect(result.state).toBe(state);
    expect(result.changes).toEqual([]);
  });

  it('never lets a signal change a trait it does not configure', () => {
    for (const signal of PERSONALITY_SIGNALS) {
      const { changes } = applyPersonalitySignal(createState(), signal, now);
      const configured = Object.keys(DEFAULT_PERSONALITY_RULES.signalDeltas[signal]).map((key) => key.toUpperCase());

      expect(changes.every((change) => configured.includes(change.trait))).toBe(true);
    }
  });
});

describe('daily cap', () => {
  it('limits each trait to 0.03 of evolution per day', () => {
    // 5 × 0.006 reaches the cap exactly; the 6th and later add nothing.
    const capped = applyTimes(createState({ playful: 0.5 }), 'PLAY', 5);
    const result = applyPersonalitySignal(capped, 'PLAY', now);

    expect(capped.traits.playful).toBe(0.53);
    expect(result.state).toBe(capped);
    expect(result.changes).toEqual([]);
  });

  it('applies the partial remainder when a delta would cross the cap', () => {
    const state = createState({}, { daily: { day: '2026-09-25', deltas: { ...ZERO, playful: 0.028 } } });
    const result = applyPersonalitySignal(state, 'PLAY', now);

    expect(result.changes[0]?.appliedDelta).toBe(0.002);
    expect(result.state.daily.deltas.playful).toBe(0.03);
  });

  it('tracks each trait separately', () => {
    const state = applyTimes(createState(), 'PLAY', 10);

    expect(applyPersonalitySignal(state, 'CURIOSITY', now).state.traits.curious).toBe(0.454);
  });

  it('caps decreases too', () => {
    // PRAISE is Shy −0.002: 15 applications reach −0.03.
    const state = applyTimes(createState({ shy: 0.5 }), 'PRAISE', 20);

    expect(state.traits.shy).toBe(0.47);
    expect(state.daily.deltas.shy).toBe(-0.03);
  });

  it('resets when the injected clock crosses into a new UTC day', () => {
    const capped = applyTimes(createState({ playful: 0.5 }), 'PLAY', 5);
    const result = applyPersonalitySignal(capped, 'PLAY', nextDay);

    expect(result.state.traits.playful).toBe(0.536);
    expect(result.state.daily).toEqual({ day: '2026-09-26', deltas: { ...ZERO, playful: 0.006 } });
  });

  it('does not count a clamped-away delta toward the cap', () => {
    const result = applyPersonalitySignal(createState({ playful: 0.948 }), 'PLAY', now);

    expect(result.state.traits.playful).toBe(0.95);
    expect(result.state.daily.deltas.playful).toBe(0.002);
  });
});

describe('trait clamp', () => {
  it('keeps traits at or below 0.95', () => {
    const result = applyPersonalitySignal(createState({ playful: 0.95 }), 'PLAY', now);

    expect(result.state.traits.playful).toBe(0.95);
    expect(result.changes).toEqual([]);
  });

  it('keeps traits at or above 0.05', () => {
    const state = applyTimes(createState({ shy: 0.051 }), 'PRAISE', 3);

    expect(state.traits.shy).toBe(0.05);
  });

  it('stays within bounds across long random signal sequences', () => {
    const random = new SeededRandom(42);
    let state = createInitialPersonality('pet-1', random);
    let at = now.getTime();

    for (let step = 0; step < 5_000; step += 1) {
      const signal = PERSONALITY_SIGNALS[Math.floor(random.next() * PERSONALITY_SIGNALS.length)]!;
      at += Math.floor(random.next() * 6 * 60 * 60 * 1_000);
      state = applyPersonalitySignal(state, signal, new Date(at)).state;
      state = applyAutonomousIndependentSignal(state, new Date(at)).state;

      for (const value of Object.values(state.traits)) {
        expect(value).toBeGreaterThanOrEqual(0.05);
        expect(value).toBeLessThanOrEqual(0.95);
      }

      expect(state.traits.independent + state.traits.clingy).toBeLessThanOrEqual(1.4 + 1e-9);
    }
  });
});

describe('Independent/Clingy normalization', () => {
  it('reduces the opposing trait just enough to keep the sum at 1.40', () => {
    const result = applyPersonalitySignal(createState({ clingy: 0.7, independent: 0.7 }), 'AFFECTION', now);

    expect(result.state.traits.clingy).toBe(0.703);
    expect(result.state.traits.independent).toBe(0.697);
    expect(result.changes).toContainEqual({
      trait: 'INDEPENDENT',
      previous: 0.7,
      next: 0.697,
      appliedDelta: -0.003,
      reason: 'NORMALIZATION',
    });
  });

  it('is exempt from the daily cap and not tracked as daily evolution', () => {
    const state = createState(
      { clingy: 0.7, independent: 0.7 },
      { daily: { day: '2026-09-25', deltas: { ...ZERO, independent: 0.03 } } },
    );
    const result = applyPersonalitySignal(state, 'AFFECTION', now);

    expect(result.state.traits.independent).toBe(0.697);
    expect(result.state.daily.deltas.independent).toBe(0.03);
  });

  it('does not act while the sum is within the limit', () => {
    const result = applyPersonalitySignal(createState({ clingy: 0.6, independent: 0.7 }), 'AFFECTION', now);

    expect(result.state.traits.independent).toBe(0.7);
    expect(result.changes.some((change) => change.reason === 'NORMALIZATION')).toBe(false);
  });

  it('keeps the traits separate rather than strictly inverse', () => {
    const state = createState({ independent: 0.3, clingy: 0.3 });

    expect(applyPersonalitySignal(state, 'AFFECTION', now).state.traits.independent).toBe(0.3);
  });

  it('lets autonomous Independent growth lower Clingy when at the limit', () => {
    const result = applyAutonomousIndependentSignal(createState({ independent: 0.7, clingy: 0.7 }), now);

    expect(result.state.traits).toMatchObject({ independent: 0.701, clingy: 0.699 });
  });
});

describe('applyAutonomousIndependentSignal', () => {
  it('raises Independent by 0.001 and marks the day', () => {
    const result = applyAutonomousIndependentSignal(createState(), now);

    expect(result.state.traits.independent).toBe(0.451);
    expect(result.state.lastIndependentSignalDay).toBe('2026-09-25');
  });

  it('applies at most once per day', () => {
    const once = applyAutonomousIndependentSignal(createState(), now).state;
    const again = applyAutonomousIndependentSignal(once, new Date('2026-09-25T23:00:00.000Z'));

    expect(again.state).toBe(once);
    expect(again.changes).toEqual([]);
    expect(applyAutonomousIndependentSignal(once, nextDay).state.traits.independent).toBe(0.452);
  });
});

describe('hasQualifyingAutonomousActivity', () => {
  const activity = (to: string) => createDomainEvent('PET_ACTIVITY_CHANGED', now, { from: 'IDLE', to });

  it('qualifies for playing alone or looking around', () => {
    expect(hasQualifyingAutonomousActivity([activity('RESTING'), activity('PLAYING_ALONE')])).toBe(true);
    expect(hasQualifyingAutonomousActivity([activity('LOOKING_AROUND')])).toBe(true);
  });

  it('does not qualify for resting, waiting, sleeping, or other events', () => {
    expect(hasQualifyingAutonomousActivity([activity('RESTING'), activity('WAITING')])).toBe(false);
    expect(hasQualifyingAutonomousActivity([createDomainEvent('PET_STARTED_SLEEPING', now)])).toBe(false);
    expect(hasQualifyingAutonomousActivity([])).toBe(false);
  });
});

describe('setPersonalityTraits (debug)', () => {
  it('sets, clamps, and records DEBUG changes without touching daily deltas', () => {
    const result = setPersonalityTraits(createState(), { playful: 0.8, shy: 2 });

    expect(result.state.traits).toMatchObject({ playful: 0.8, shy: 0.95 });
    expect(result.state.daily).toEqual({ day: null, deltas: ZERO });
    expect(result.changes.map((change) => change.reason)).toEqual(['DEBUG', 'DEBUG']);
  });

  it('normalizes the trait that was not set', () => {
    const result = setPersonalityTraits(createState({ independent: 0.95 }), { clingy: 0.95 });

    expect(result.state.traits).toMatchObject({ clingy: 0.95, independent: 0.45 });
    expect(result.changes.at(-1)).toMatchObject({ trait: 'INDEPENDENT', reason: 'NORMALIZATION' });
  });

  it('keeps the higher value when both paired traits are set', () => {
    const result = setPersonalityTraits(createState(), { independent: 0.9, clingy: 0.7 });

    expect(result.state.traits).toMatchObject({ independent: 0.9, clingy: 0.5 });
  });

  it('rejects non-finite values', () => {
    expect(() => setPersonalityTraits(createState(), { curious: Number.POSITIVE_INFINITY })).toThrow(TypeError);
  });
});

describe('personality profile', () => {
  it('buckets traits as low, moderate, or high', () => {
    expect(personalityLevel(0.3499)).toBe('low');
    expect(personalityLevel(0.35)).toBe('moderate');
    expect(personalityLevel(0.6499)).toBe('moderate');
    expect(personalityLevel(0.65)).toBe('high');
  });

  it('lists dominant traits (≥ 0.65) strongest first', () => {
    const profile = derivePersonalityProfile({ ...BALANCED, curious: 0.7, playful: 0.8 });

    expect(profile).toMatchObject({ dominantTraits: ['PLAYFUL', 'CURIOUS'], primaryTrait: 'PLAYFUL', strength: 'STRONG' });
  });

  it('falls back to the highest trait with moderate strength when none is dominant', () => {
    const profile = derivePersonalityProfile({ ...BALANCED, shy: 0.6 });

    expect(profile).toMatchObject({ dominantTraits: [], primaryTrait: 'SHY', strength: 'MODERATE' });
  });

  it('breaks ties in canonical trait order', () => {
    expect(derivePersonalityProfile(BALANCED).primaryTrait).toBe('PLAYFUL');
  });

  it.each([
    { independent: 0.6, clingy: 0.5, style: 'INDEPENDENT' },
    { independent: 0.5, clingy: 0.6, style: 'CLINGY' },
    { independent: 0.55, clingy: 0.5, style: 'BALANCED' },
  ])('derives social style $style from Independent vs Clingy', ({ independent, clingy, style }) => {
    expect(derivePersonalityProfile({ ...BALANCED, independent, clingy }).socialStyle).toBe(style);
  });

  it('builds a number-free prompt profile', () => {
    const profile = derivePersonalityPromptProfile({ ...BALANCED, playful: 0.8, independent: 0.2 });

    expect(profile).toEqual({
      playful: 'high',
      curious: 'moderate',
      shy: 'moderate',
      independent: 'low',
      clingy: 'moderate',
      dominantTraits: ['PLAYFUL'],
      primaryTrait: 'PLAYFUL',
      strength: 'STRONG',
      socialStyle: 'CLINGY',
    });
    expect(JSON.stringify(profile)).not.toMatch(/\d/);
  });
});

describe('personality presets', () => {
  it.each(PERSONALITY_PRESET_NAMES)('%s is a valid personality with the intended dominant trait', (name) => {
    const traits = PERSONALITY_PRESETS[name];
    const profile = derivePersonalityProfile(traits);

    expect(() => createState(traits)).not.toThrow();
    expect(profile.dominantTraits).toEqual(name === 'BALANCED' ? [] : [name.replace('HIGH_', '')]);
  });
});
