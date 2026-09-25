import { DEFAULT_GAME_RULES, requireValidDate, type GameRules, type PetState } from '@ai-virtual-pet/domain';

export type Mood = 'NEUTRAL' | 'HAPPY' | 'HUNGRY' | 'SLEEPY' | 'EXCITED' | 'BORED';

export interface MoodCandidate {
  readonly mood: Mood;
  readonly score: number;
}

export interface DerivedMood extends MoodCandidate {
  /** When the pet entered this mood; used for stability on the next derivation. */
  readonly since: Date;
}

export interface MoodInput {
  readonly state: PetState;
  readonly now: Date;
  readonly lastPlayedAt?: Date | null;
  readonly previous?: DerivedMood | null;
}

/** Physical needs may override the minimum mood duration immediately. */
const CRITICAL_MOODS: ReadonlySet<Mood> = new Set(['SLEEPY', 'HUNGRY']);

/** Every mood the current state qualifies for, highest score first. NEUTRAL is always last. */
export function moodCandidates(input: MoodInput, rules: GameRules = DEFAULT_GAME_RULES): MoodCandidate[] {
  const { state } = input;
  const nowMs = requireValidDate(input.now, 'now').getTime();
  const { mood } = rules;
  const candidates: MoodCandidate[] = [];

  if (state.energy <= mood.sleepyAtEnergy) {
    candidates.push({ mood: 'SLEEPY', score: mood.sleepyBaseScore + (mood.sleepyAtEnergy - state.energy) });
  }

  if (state.hunger <= mood.hungryAtHunger) {
    candidates.push({
      mood: 'HUNGRY',
      score: mood.hungryBaseScore + (mood.hungryAtHunger - state.hunger) * mood.hungryScorePerPoint,
    });
  }

  if (
    state.currentActivity !== 'SLEEPING' &&
    input.lastPlayedAt &&
    nowMs - input.lastPlayedAt.getTime() <= mood.excitedWithinMs &&
    state.happiness >= mood.excitedMinHappiness
  ) {
    candidates.push({ mood: 'EXCITED', score: mood.excitedScore });
  }

  if (
    state.currentActivity !== 'SLEEPING' &&
    state.lastInteractionAt &&
    nowMs - state.lastInteractionAt.getTime() >= mood.boredAfterMs &&
    state.energy > mood.boredMinEnergyExclusive
  ) {
    candidates.push({ mood: 'BORED', score: mood.boredScore });
  }

  if (state.happiness >= mood.happyMinHappiness) {
    candidates.push({ mood: 'HAPPY', score: mood.happyScore });
  }

  candidates.sort((a, b) => b.score - a.score);
  candidates.push({ mood: 'NEUTRAL', score: 0 });
  return candidates;
}

/**
 * Derives the current mood. A previous mood is kept for its minimum duration while it still
 * qualifies, unless a critical physical need takes over, so the pet does not flicker between
 * emotions on small stat changes.
 */
export function deriveMood(input: MoodInput, rules: GameRules = DEFAULT_GAME_RULES): DerivedMood {
  const candidates = moodCandidates(input, rules);
  const best = candidates[0] ?? { mood: 'NEUTRAL', score: 0 };
  const { previous, now } = input;

  if (!previous) {
    return { ...best, since: now };
  }

  const previousNow = candidates.find((candidate) => candidate.mood === previous.mood);

  if (best.mood === previous.mood && previousNow) {
    return { ...previousNow, since: previous.since };
  }

  const withinMinimum = now.getTime() - previous.since.getTime() < rules.mood.minimumDurationMs;

  if (previousNow && withinMinimum && !CRITICAL_MOODS.has(best.mood)) {
    return { ...previousNow, since: previous.since };
  }

  return { ...best, since: now };
}
