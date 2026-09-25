import { DEFAULT_GAME_RULES, type GameRules } from './config.js';
import { createDomainEvent, type DomainEvent } from './events.js';
import { clampStat, requireValidDate } from './primitives.js';
import type { PetState } from './state.js';

export type CareAction = 'FEED' | 'PLAY' | 'SLEEP' | 'WAKE';
export type ActionRejectionReason = 'TOO_TIRED' | 'TOO_FULL' | 'SLEEPING' | 'INVALID_STATE';

export interface AcceptedActionResult {
  readonly accepted: true;
  readonly state: PetState;
  readonly events: readonly DomainEvent[];
  readonly effectMultiplier: number;
}

export interface RejectedActionResult {
  readonly accepted: false;
  readonly reason: ActionRejectionReason;
  readonly state: PetState;
  readonly events: readonly DomainEvent[];
  readonly effectMultiplier: 0;
}

export type ActionResult = AcceptedActionResult | RejectedActionResult;

function rejectAction(
  action: CareAction,
  reason: ActionRejectionReason,
  state: PetState,
  occurredAt: Date,
): RejectedActionResult {
  return {
    accepted: false,
    reason,
    state,
    events: [createDomainEvent('ACTION_REJECTED', occurredAt, { action, reason })],
    effectMultiplier: 0,
  };
}

export function applyFeed(
  state: PetState,
  occurredAt: Date,
  rules: GameRules = DEFAULT_GAME_RULES,
): ActionResult {
  const now = requireValidDate(occurredAt, 'occurredAt');

  if (state.currentActivity === 'SLEEPING') {
    return rejectAction('FEED', 'SLEEPING', state, now);
  }

  if (state.hunger >= rules.feed.rejectAtHunger) {
    return rejectAction('FEED', 'TOO_FULL', state, now);
  }

  const isDiminished = state.hunger >= rules.feed.diminishedAtHunger;
  const effect = isDiminished ? rules.feed.diminished : rules.feed.base;
  const nextState: PetState = {
    ...state,
    hunger: clampStat(state.hunger + effect.hunger),
    happiness: clampStat(state.happiness + effect.happiness),
    bond: clampStat(state.bond + effect.bond),
    lastInteractionAt: now,
  };

  return {
    accepted: true,
    state: nextState,
    events: [
      createDomainEvent('PET_FED', now, {
        hungerDelta: nextState.hunger - state.hunger,
        happinessDelta: nextState.happiness - state.happiness,
        bondDelta: nextState.bond - state.bond,
      }),
    ],
    effectMultiplier: isDiminished ? rules.feed.diminished.hunger / rules.feed.base.hunger : 1,
  };
}

export function countRecentPlays(
  occurredAt: Date,
  previousPlayTimes: readonly Date[],
  windowMs: number,
): number {
  const nowMs = requireValidDate(occurredAt, 'occurredAt').getTime();
  const cutoffMs = nowMs - windowMs;

  return previousPlayTimes.filter((time) => {
    const timeMs = requireValidDate(time, 'previousPlayTime').getTime();
    return timeMs > cutoffMs && timeMs <= nowMs;
  }).length;
}

export function applyPlay(
  state: PetState,
  occurredAt: Date,
  previousPlayTimes: readonly Date[] = [],
  rules: GameRules = DEFAULT_GAME_RULES,
): ActionResult {
  const now = requireValidDate(occurredAt, 'occurredAt');

  if (state.currentActivity === 'SLEEPING') {
    return rejectAction('PLAY', 'SLEEPING', state, now);
  }

  if (state.energy <= rules.play.minimumEnergyExclusive) {
    return rejectAction('PLAY', 'TOO_TIRED', state, now);
  }

  const recentPlayCount = countRecentPlays(
    now,
    previousPlayTimes,
    rules.play.diminishingWindowMs,
  );
  const multiplierIndex = Math.min(recentPlayCount, rules.play.diminishingMultipliers.length - 1);
  const multiplier = rules.play.diminishingMultipliers[multiplierIndex];

  if (multiplier === undefined) {
    throw new RangeError('Play diminishing multipliers cannot be empty.');
  }

  const nextState: PetState = {
    ...state,
    happiness: clampStat(state.happiness + rules.play.happiness * multiplier),
    energy: clampStat(state.energy - rules.play.energyCost),
    hunger: clampStat(state.hunger - rules.play.hungerCost),
    bond: clampStat(state.bond + rules.play.bond * multiplier),
    lastInteractionAt: now,
  };

  return {
    accepted: true,
    state: nextState,
    events: [
      createDomainEvent('PET_PLAYED', now, {
        multiplier,
        happinessDelta: nextState.happiness - state.happiness,
        energyDelta: nextState.energy - state.energy,
        hungerDelta: nextState.hunger - state.hunger,
        bondDelta: nextState.bond - state.bond,
      }),
    ],
    effectMultiplier: multiplier,
  };
}

export function startSleep(
  state: PetState,
  occurredAt: Date,
  rules: GameRules = DEFAULT_GAME_RULES,
): ActionResult {
  const now = requireValidDate(occurredAt, 'occurredAt');

  if (state.currentActivity === 'SLEEPING') {
    return rejectAction('SLEEP', 'SLEEPING', state, now);
  }

  const nextState: PetState = {
    ...state,
    bond: clampStat(state.bond + rules.sleep.bond),
    currentActivity: 'SLEEPING',
    sleepStartedAt: now,
    lastInteractionAt: now,
  };

  return {
    accepted: true,
    state: nextState,
    events: [createDomainEvent('PET_STARTED_SLEEPING', now)],
    effectMultiplier: 1,
  };
}

export function wakePet(state: PetState, occurredAt: Date): ActionResult {
  const now = requireValidDate(occurredAt, 'occurredAt');

  if (state.currentActivity !== 'SLEEPING') {
    return rejectAction('WAKE', 'INVALID_STATE', state, now);
  }

  const nextState: PetState = {
    ...state,
    currentActivity: 'IDLE',
    sleepStartedAt: null,
  };

  return {
    accepted: true,
    state: nextState,
    events: [createDomainEvent('PET_WOKE_UP', now)],
    effectMultiplier: 1,
  };
}
