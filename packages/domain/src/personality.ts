import { DEFAULT_PERSONALITY_RULES, type PersonalityRules, type PersonalityTraitDeltas } from './config.js';
import type { DomainEvent } from './events.js';
import { createPetId, requireDayBucket, utcDayBucket, type DayBucket, type PetId } from './primitives.js';
import type { Random } from './random.js';
import type { PetActivity } from './state.js';

export const PERSONALITY_TRAITS = ['PLAYFUL', 'CURIOUS', 'SHY', 'INDEPENDENT', 'CLINGY'] as const;
export type PersonalityTrait = (typeof PERSONALITY_TRAITS)[number];

export type PersonalityTraitKey = 'playful' | 'curious' | 'shy' | 'independent' | 'clingy';

export const PERSONALITY_TRAIT_KEYS: Readonly<Record<PersonalityTrait, PersonalityTraitKey>> = Object.freeze({
  PLAYFUL: 'playful',
  CURIOUS: 'curious',
  SHY: 'shy',
  INDEPENDENT: 'independent',
  CLINGY: 'clingy',
});

/** Behavioral tendencies as fractions (0–1), never percentages. Hidden from the player. */
export type PetPersonality = Readonly<Record<PersonalityTraitKey, number>>;

export const PERSONALITY_SIGNALS = [
  'PLAY',
  'CARE',
  'AFFECTION',
  'CURIOSITY',
  'PRAISE',
  'TEASING',
  'CASUAL',
  'COMFORT',
] as const;
export type PersonalitySignal = (typeof PERSONALITY_SIGNALS)[number];

/** Signed evolution already applied to each trait during `day`, for the daily cap. */
export interface PersonalityDailyDeltas {
  readonly day: DayBucket | null;
  readonly deltas: PetPersonality;
}

export interface PersonalityState {
  readonly petId: PetId;
  readonly traits: PetPersonality;
  readonly daily: PersonalityDailyDeltas;
  /** Day the autonomous Independent signal was last granted (at most once per day). */
  readonly lastIndependentSignalDay: DayBucket | null;
}

export type PersonalityChangeReason = 'SIGNAL' | 'NORMALIZATION' | 'DEBUG';

export interface PersonalityChange {
  readonly trait: PersonalityTrait;
  readonly previous: number;
  readonly next: number;
  readonly appliedDelta: number;
  readonly reason: PersonalityChangeReason;
}

/** For tests, debugging, and events — not player UI. */
export interface PersonalityUpdateResult {
  readonly state: PersonalityState;
  readonly changes: readonly PersonalityChange[];
}

type MutableTraits = Record<PersonalityTraitKey, number>;
type PairKey = 'independent' | 'clingy';

// Traits are stored rounded so tiny float noise never accumulates across thousands of updates.
const TRAIT_PRECISION = 1e6;
const EPSILON = 1e-9;

const TRAIT_BY_KEY: Readonly<Record<PersonalityTraitKey, PersonalityTrait>> = Object.freeze({
  playful: 'PLAYFUL',
  curious: 'CURIOUS',
  shy: 'SHY',
  independent: 'INDEPENDENT',
  clingy: 'CLINGY',
});

const TRAIT_KEYS: readonly PersonalityTraitKey[] = PERSONALITY_TRAITS.map((trait) => PERSONALITY_TRAIT_KEYS[trait]);

const ZERO_DELTAS: PetPersonality = Object.freeze({ playful: 0, curious: 0, shy: 0, independent: 0, clingy: 0 });

/** Autonomous activities that count as the pet doing well on its own (plan Task 1.7). */
export const INDEPENDENT_QUALIFYING_ACTIVITIES: readonly PetActivity[] = Object.freeze([
  'PLAYING_ALONE',
  'LOOKING_AROUND',
]);

function roundTrait(value: number): number {
  return Math.round(value * TRAIT_PRECISION) / TRAIT_PRECISION;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }

  return value;
}

export function createPersonalityState(
  state: PersonalityState,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityState {
  const traits = {} as MutableTraits;
  const deltas = {} as MutableTraits;

  for (const key of TRAIT_KEYS) {
    const value = requireFinite(state.traits[key], `Personality ${key}`);

    if (value < rules.traitMin - EPSILON || value > rules.traitMax + EPSILON) {
      throw new RangeError(`Personality ${key} must be between ${rules.traitMin} and ${rules.traitMax}.`);
    }

    const delta = requireFinite(state.daily.deltas[key], `Daily ${key} delta`);

    if (Math.abs(delta) > rules.dailyCapPerTrait + EPSILON) {
      throw new RangeError(`Daily ${key} delta cannot exceed ${rules.dailyCapPerTrait}.`);
    }

    traits[key] = value;
    deltas[key] = delta;
  }

  if (traits.independent + traits.clingy > rules.independentClingyMaxSum + EPSILON) {
    throw new RangeError(`Independent + Clingy cannot exceed ${rules.independentClingyMaxSum}.`);
  }

  return {
    petId: createPetId(state.petId),
    traits,
    daily: {
      day: state.daily.day === null ? null : requireDayBucket(state.daily.day, 'daily.day'),
      deltas,
    },
    lastIndependentSignalDay:
      state.lastIndependentSignalDay === null
        ? null
        : requireDayBucket(state.lastIndependentSignalDay, 'lastIndependentSignalDay'),
  };
}

/** A new Baby personality: every trait moderate, drawn in canonical trait order. */
export function createInitialPersonality(
  petId: string,
  random: Random,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityState {
  const traits = {} as MutableTraits;

  for (const key of TRAIT_KEYS) {
    traits[key] = roundTrait(rules.initialMin + random.next() * (rules.initialMax - rules.initialMin));
  }

  return createPersonalityState(
    { petId, traits, daily: { day: null, deltas: ZERO_DELTAS }, lastIndependentSignalDay: null },
    rules,
  );
}

export function applyPersonalitySignal(
  state: PersonalityState,
  signal: PersonalitySignal,
  at: Date,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityUpdateResult {
  return applyTraitDeltas(state, rules.signalDeltas[signal], at, rules);
}

/**
 * Tiny Independent growth for qualifying autonomous activity, granted at most once per day.
 * The caller grants it at most once per elapsed-time catch-up, so long absences cannot accumulate it.
 */
export function applyAutonomousIndependentSignal(
  state: PersonalityState,
  at: Date,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityUpdateResult {
  const day = utcDayBucket(at);

  if (state.lastIndependentSignalDay === day) {
    return { state, changes: [] };
  }

  const result = applyTraitDeltas(state, { independent: rules.autonomousIndependentDelta }, at, rules);
  return { state: { ...result.state, lastIndependentSignalDay: day }, changes: result.changes };
}

/** Whether simulation output contains autonomous activity that qualifies for the Independent signal. */
export function hasQualifyingAutonomousActivity(events: readonly DomainEvent[]): boolean {
  return events.some(
    (event) =>
      event.type === 'PET_ACTIVITY_CHANGED' &&
      INDEPENDENT_QUALIFYING_ACTIVITIES.includes(event.payload.to as PetActivity),
  );
}

/**
 * Debug-only direct trait mutation. Values are clamped and normalized, and the daily cap is
 * neither consumed nor enforced.
 */
export function setPersonalityTraits(
  state: PersonalityState,
  values: Partial<PetPersonality>,
  rules: PersonalityRules = DEFAULT_PERSONALITY_RULES,
): PersonalityUpdateResult {
  const traits: MutableTraits = { ...state.traits };
  const changes: PersonalityChange[] = [];

  for (const key of TRAIT_KEYS) {
    const requested = values[key];

    if (requested === undefined) {
      continue;
    }

    const next = roundTrait(clamp(requireFinite(requested, `Personality ${key}`), rules.traitMin, rules.traitMax));
    recordChange(changes, traits, key, next, 'DEBUG');
  }

  // When both paired traits are set, the higher request is the intent to keep.
  const target = pickPairTarget(values.independent, values.clingy);

  if (target) {
    normalizeIndependentClingy(traits, target, changes, rules);
  }

  if (changes.length === 0) {
    return { state, changes };
  }

  return { state: createPersonalityState({ ...state, traits }, rules), changes };
}

/** Plan §20 order: base delta → daily cap → trait clamp → Independent/Clingy normalization. */
function applyTraitDeltas(
  state: PersonalityState,
  deltas: PersonalityTraitDeltas,
  at: Date,
  rules: PersonalityRules,
): PersonalityUpdateResult {
  const day = utcDayBucket(at);
  const cap = rules.dailyCapPerTrait;
  const traits: MutableTraits = { ...state.traits };
  const daily: MutableTraits = { ...(state.daily.day === day ? state.daily.deltas : ZERO_DELTAS) };
  const changes: PersonalityChange[] = [];

  for (const key of TRAIT_KEYS) {
    const delta = deltas[key];

    if (!delta) {
      continue;
    }

    const allowed = clamp(daily[key] + delta, -cap, cap) - daily[key];
    const next = roundTrait(clamp(traits[key] + allowed, rules.traitMin, rules.traitMax));
    const applied = recordChange(changes, traits, key, next, 'SIGNAL');
    // Only evolution that actually happened counts toward the cap; a clamped-away delta does not.
    daily[key] = roundTrait(daily[key] + applied);
  }

  const increased = (key: PairKey) =>
    changes.find((change) => change.trait === TRAIT_BY_KEY[key])?.appliedDelta ?? 0;
  const target = pickPairTarget(positiveOrUndefined(increased('independent')), positiveOrUndefined(increased('clingy')));

  if (target) {
    normalizeIndependentClingy(traits, target, changes, rules);
  }

  if (changes.length === 0) {
    return { state, changes };
  }

  return {
    state: createPersonalityState({ ...state, traits, daily: { day, deltas: daily } }, rules),
    changes,
  };
}

function positiveOrUndefined(value: number): number | undefined {
  return value > 0 ? value : undefined;
}

/** The paired trait being pushed up, whose opposite absorbs any normalization. */
function pickPairTarget(independent: number | undefined, clingy: number | undefined): PairKey | null {
  if (independent === undefined && clingy === undefined) {
    return null;
  }

  if (clingy === undefined) {
    return 'independent';
  }

  if (independent === undefined) {
    return 'clingy';
  }

  return independent >= clingy ? 'independent' : 'clingy';
}

/**
 * Soft normalization: when Independent + Clingy exceeds the limit, the trait opposite `target`
 * is reduced just enough to restore it. The reduction is a constraint correction, so it is
 * exempt from the daily cap and not counted in daily deltas.
 */
function normalizeIndependentClingy(
  traits: MutableTraits,
  target: PairKey,
  changes: PersonalityChange[],
  rules: PersonalityRules,
): void {
  if (traits.independent + traits.clingy <= rules.independentClingyMaxSum + EPSILON) {
    return;
  }

  const opposite: PairKey = target === 'independent' ? 'clingy' : 'independent';
  const next = roundTrait(rules.independentClingyMaxSum - traits[target]);

  if (next < rules.traitMin - EPSILON) {
    throw new RangeError('Personality rules cannot satisfy the Independent/Clingy constraint.');
  }

  recordChange(changes, traits, opposite, next, 'NORMALIZATION');
}

function recordChange(
  changes: PersonalityChange[],
  traits: MutableTraits,
  key: PersonalityTraitKey,
  next: number,
  reason: PersonalityChangeReason,
): number {
  const previous = traits[key];
  const appliedDelta = roundTrait(next - previous);

  if (appliedDelta !== 0) {
    changes.push({ trait: TRAIT_BY_KEY[key], previous, next, appliedDelta, reason });
    traits[key] = next;
  }

  return appliedDelta;
}
