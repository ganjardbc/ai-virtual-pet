import type { PersonalitySignal, PersonalityTraitKey } from './personality.js';
import type { PetActivity } from './state.js';

const MINUTE_MS = 60 * 1_000;
const HOUR_MS = 60 * MINUTE_MS;

export type AwakeActivity = Exclude<PetActivity, 'SLEEPING'>;
export type AutonomousActivity = Exclude<AwakeActivity, 'IDLE'>;

export interface ActivityEffect {
  readonly energyDecayMultiplier: number;
  readonly happinessPerHour: number;
}

export interface GameRules {
  readonly initialState: {
    readonly hunger: number;
    readonly energy: number;
    readonly happiness: number;
    readonly bond: number;
  };
  readonly hunger: {
    readonly awakeDecayPerHour: number;
    readonly sleepingDecayPerHour: number;
  };
  readonly energy: {
    readonly awakeDecayPerHour: number;
    readonly sleepingRecoveryPerHour: number;
  };
  readonly happiness: {
    readonly lowHungerAtOrBelow: number;
    readonly lowEnergyAwakeAtOrBelow: number;
    readonly penaltyPerInterval: number;
    readonly penaltyIntervalMs: number;
    readonly maxPassiveLossPerDay: number;
    readonly passiveFloor: number;
  };
  readonly feed: {
    readonly base: {
      readonly hunger: number;
      readonly happiness: number;
      readonly bond: number;
    };
    readonly diminished: {
      readonly hunger: number;
      readonly happiness: number;
      readonly bond: number;
    };
    readonly diminishedAtHunger: number;
    readonly rejectAtHunger: number;
  };
  readonly play: {
    readonly happiness: number;
    readonly energyCost: number;
    readonly hungerCost: number;
    readonly bond: number;
    readonly minimumEnergyExclusive: number;
    readonly diminishingWindowMs: number;
    readonly diminishingMultipliers: readonly number[];
  };
  readonly sleep: {
    readonly bond: number;
    readonly autoWakeAtEnergy: number;
    readonly minDurationMs: number;
    readonly maxDurationMs: number;
  };
  readonly simulation: {
    readonly detailedHorizonMs: number;
  };
  readonly autonomy: {
    readonly decisionIntervalMs: number;
    readonly sleepAtEnergy: number;
    readonly tiredAtEnergy: number;
    readonly playAloneMinEnergy: number;
    readonly playAloneMinHunger: number;
    readonly currentActivityWeightMultiplier: number;
    readonly weights: Readonly<Record<AutonomousActivity, number>>;
    readonly restingWhenTiredWeight: number;
    readonly effects: Readonly<Record<AwakeActivity, ActivityEffect>>;
  };
  readonly mood: {
    readonly minimumDurationMs: number;
    readonly sleepyAtEnergy: number;
    readonly sleepyBaseScore: number;
    readonly hungryAtHunger: number;
    readonly hungryBaseScore: number;
    readonly hungryScorePerPoint: number;
    readonly excitedWithinMs: number;
    readonly excitedMinHappiness: number;
    readonly excitedScore: number;
    readonly boredAfterMs: number;
    readonly boredMinEnergyExclusive: number;
    readonly boredScore: number;
    readonly happyMinHappiness: number;
    readonly happyScore: number;
  };
  readonly needLabels: {
    readonly hungryAtOrBelow: number;
    readonly energeticAtLeast: number;
    readonly tiredAtOrBelow: number;
    readonly veryHappyAtLeast: number;
    readonly lowHappinessAtOrBelow: number;
  };
}

export const DEFAULT_GAME_RULES: GameRules = Object.freeze({
  // Hunger starts below the Feed diminishing threshold so a new Baby can be fed right away (playtest decision, Task 10).
  initialState: Object.freeze({ hunger: 70, energy: 100, happiness: 70, bond: 10 }),
  hunger: Object.freeze({
    awakeDecayPerHour: 2,
    sleepingDecayPerHour: 1,
  }),
  energy: Object.freeze({
    awakeDecayPerHour: 1.5,
    sleepingRecoveryPerHour: 12,
  }),
  happiness: Object.freeze({
    lowHungerAtOrBelow: 25,
    lowEnergyAwakeAtOrBelow: 20,
    penaltyPerInterval: 1,
    penaltyIntervalMs: 2 * HOUR_MS,
    maxPassiveLossPerDay: 12,
    passiveFloor: 30,
  }),
  feed: Object.freeze({
    base: Object.freeze({ hunger: 25, happiness: 2, bond: 0.3 }),
    diminished: Object.freeze({ hunger: 10, happiness: 1, bond: 0.1 }),
    diminishedAtHunger: 75,
    rejectAtHunger: 90,
  }),
  play: Object.freeze({
    happiness: 12,
    energyCost: 10,
    hungerCost: 4,
    bond: 1,
    minimumEnergyExclusive: 15,
    diminishingWindowMs: 2 * HOUR_MS,
    diminishingMultipliers: Object.freeze([1, 0.75, 0.5, 0.25]),
  }),
  sleep: Object.freeze({
    bond: 0.1,
    autoWakeAtEnergy: 95,
    minDurationMs: 30 * MINUTE_MS,
    maxDurationMs: 8 * HOUR_MS,
  }),
  simulation: Object.freeze({
    detailedHorizonMs: 48 * HOUR_MS,
  }),
  autonomy: Object.freeze({
    decisionIntervalMs: HOUR_MS,
    sleepAtEnergy: 10,
    tiredAtEnergy: 30,
    playAloneMinEnergy: 50,
    playAloneMinHunger: 25,
    currentActivityWeightMultiplier: 2,
    weights: Object.freeze({ RESTING: 1, PLAYING_ALONE: 2, LOOKING_AROUND: 2, WAITING: 1 }),
    restingWhenTiredWeight: 4,
    effects: Object.freeze({
      IDLE: Object.freeze({ energyDecayMultiplier: 1, happinessPerHour: 0 }),
      RESTING: Object.freeze({ energyDecayMultiplier: 0.5, happinessPerHour: 0 }),
      PLAYING_ALONE: Object.freeze({ energyDecayMultiplier: 1.5, happinessPerHour: 1 }),
      LOOKING_AROUND: Object.freeze({ energyDecayMultiplier: 1, happinessPerHour: 0 }),
      WAITING: Object.freeze({ energyDecayMultiplier: 1, happinessPerHour: 0 }),
    }),
  }),
  mood: Object.freeze({
    minimumDurationMs: 15 * MINUTE_MS,
    sleepyAtEnergy: 20,
    sleepyBaseScore: 70,
    hungryAtHunger: 35,
    hungryBaseScore: 60,
    hungryScorePerPoint: 0.7,
    excitedWithinMs: 30 * MINUTE_MS,
    excitedMinHappiness: 70,
    excitedScore: 60,
    boredAfterMs: 8 * HOUR_MS,
    boredMinEnergyExclusive: 40,
    boredScore: 45,
    happyMinHappiness: 75,
    happyScore: 40,
  }),
  needLabels: Object.freeze({
    hungryAtOrBelow: 50,
    energeticAtLeast: 75,
    tiredAtOrBelow: 50,
    veryHappyAtLeast: 90,
    lowHappinessAtOrBelow: 35,
  }),
});

export type PersonalityTraitDeltas = Readonly<Partial<Record<PersonalityTraitKey, number>>>;

/** Personality balance (Prototype 0.2 plan §12–§23). Values are hypotheses, tuned in playtests. */
export interface PersonalityRules {
  /** Every trait stays within this range after any mutation. */
  readonly traitMin: number;
  readonly traitMax: number;
  /** New personalities start inside this narrower range, so no pet starts extreme. */
  readonly initialMin: number;
  readonly initialMax: number;
  /** Maximum absolute evolution per trait per UTC day. Normalization is exempt. */
  readonly dailyCapPerTrait: number;
  /** Independent and Clingy partially oppose: their sum never exceeds this. */
  readonly independentClingyMaxSum: number;
  readonly signalDeltas: Readonly<Record<PersonalitySignal, PersonalityTraitDeltas>>;
  /** Granted at most once per day for qualifying autonomous activity. */
  readonly autonomousIndependentDelta: number;
  /** A trait at or above this is dominant; it is also the HIGH bucket threshold. */
  readonly highAtLeast: number;
  /** A trait below this is in the LOW bucket. */
  readonly lowBelow: number;
  /** Independent/Clingy difference needed before one of them defines the social style. */
  readonly socialStyleMargin: number;
}

export const DEFAULT_PERSONALITY_RULES: PersonalityRules = Object.freeze({
  traitMin: 0.05,
  traitMax: 0.95,
  initialMin: 0.35,
  initialMax: 0.55,
  dailyCapPerTrait: 0.03,
  independentClingyMaxSum: 1.4,
  signalDeltas: Object.freeze({
    PLAY: Object.freeze({ playful: 0.006 }),
    CURIOSITY: Object.freeze({ curious: 0.004 }),
    AFFECTION: Object.freeze({ clingy: 0.003, shy: -0.001 }),
    PRAISE: Object.freeze({ shy: -0.002 }),
    COMFORT: Object.freeze({ clingy: 0.002, shy: -0.001 }),
    CARE: Object.freeze({ clingy: 0.001 }),
    CASUAL: Object.freeze({}),
    // No deterministic mutation in 0.2: teasing is too easy to misread (plan §17).
    TEASING: Object.freeze({}),
  }),
  autonomousIndependentDelta: 0.001,
  highAtLeast: 0.65,
  lowBelow: 0.35,
  socialStyleMargin: 0.1,
});
