import {
  DEFAULT_GAME_RULES,
  clampStat,
  createDomainEvent,
  requireValidDate,
  type AwakeActivity,
  type DomainEvent,
  type GameRules,
  type PetActivity,
  type PetState,
  type Random,
} from '@ai-virtual-pet/domain';

import { decideAutonomousActivity } from './autonomy.js';

const HOUR_MS = 60 * 60 * 1_000;
const DAY_HOURS = 24;

export type WakeCause = 'ENERGY_RESTORED' | 'MAX_DURATION';

export interface SimulationInput {
  readonly state: PetState;
  readonly to: Date;
  readonly random: Random;
  readonly rules?: GameRules;
}

export interface SimulationSummary {
  readonly elapsedMs: number;
  /** Portion of the elapsed time handled by the summarized approximation instead of detailed simulation. */
  readonly approximatedMs: number;
  readonly activityMs: Readonly<Partial<Record<PetActivity, number>>>;
}

export interface SimulationResult {
  readonly state: PetState;
  readonly events: readonly DomainEvent[];
  readonly summary: SimulationSummary;
}

type SimulationMode = 'DETAILED' | 'APPROXIMATE';

/**
 * Advances a pet from `state.lastSimulatedAt` to `to`.
 *
 * Needs are applied in closed form per segment. Segments end at the target time, a wake time,
 * or an autonomy decision point, so cost grows with the number of transitions rather than
 * with elapsed time. Anything older than the detailed horizon is approximated per sleep cycle
 * without random draws or events.
 */
export function simulateElapsedTime(input: SimulationInput): SimulationResult {
  const rules = input.rules ?? DEFAULT_GAME_RULES;
  const fromMs = input.state.lastSimulatedAt.getTime();
  const toMs = requireValidDate(input.to, 'to').getTime();

  if (toMs < fromMs) {
    throw new RangeError('Simulation cannot move time backward.');
  }

  const detailedFromMs = Math.max(fromMs, toMs - rules.simulation.detailedHorizonMs);
  const run = new SimulationRun(input.state, input.random, rules);

  run.advance(fromMs, detailedFromMs, 'APPROXIMATE');
  run.advance(detailedFromMs, toMs, 'DETAILED');

  return {
    state: { ...run.state, lastSimulatedAt: new Date(toMs) },
    events: run.events,
    summary: {
      elapsedMs: toMs - fromMs,
      approximatedMs: detailedFromMs - fromMs,
      activityMs: run.activityMs,
    },
  };
}

class SimulationRun {
  readonly events: DomainEvent[] = [];
  readonly activityMs: Partial<Record<PetActivity, number>> = {};

  constructor(
    public state: PetState,
    private readonly random: Random,
    private readonly rules: GameRules,
  ) {}

  advance(startMs: number, endMs: number, mode: SimulationMode): void {
    let cursorMs = startMs;

    while (cursorMs < endMs) {
      if (this.state.currentActivity === 'SLEEPING') {
        const wake = this.nextWake(cursorMs);
        const segmentEndMs = Math.min(endMs, wake.atMs);
        this.applyNeeds(segmentEndMs - cursorMs);
        cursorMs = segmentEndMs;

        if (wake.atMs <= endMs) {
          this.wake(cursorMs, wake.cause, mode);
        }

        continue;
      }

      if (mode === 'APPROXIMATE' && this.state.currentActivity !== 'IDLE') {
        this.state = { ...this.state, currentActivity: 'IDLE' };
      }

      const decisionAtMs =
        mode === 'DETAILED' ? this.nextDecisionBoundary(cursorMs) : this.approximateSleepAt(cursorMs);
      const segmentEndMs = Math.min(endMs, decisionAtMs);
      this.applyNeeds(segmentEndMs - cursorMs);
      cursorMs = segmentEndMs;

      if (decisionAtMs <= endMs) {
        this.decide(cursorMs, mode);
      }
    }
  }

  private nextWake(cursorMs: number): { atMs: number; cause: WakeCause } {
    const { sleep, energy } = this.rules;
    const sleepStartedMs = (this.state.sleepStartedAt ?? new Date(cursorMs)).getTime();
    const maxWakeMs = sleepStartedMs + sleep.maxDurationMs;
    let energyWakeMs = Number.POSITIVE_INFINITY;

    if (this.state.energy >= sleep.autoWakeAtEnergy) {
      energyWakeMs = cursorMs;
    } else if (energy.sleepingRecoveryPerHour > 0) {
      const hoursToRecover =
        (sleep.autoWakeAtEnergy - this.state.energy) / energy.sleepingRecoveryPerHour;
      energyWakeMs = cursorMs + Math.ceil(hoursToRecover * HOUR_MS);
    }

    energyWakeMs = Math.max(energyWakeMs, sleepStartedMs + sleep.minDurationMs);

    return energyWakeMs <= maxWakeMs
      ? { atMs: Math.max(cursorMs, energyWakeMs), cause: 'ENERGY_RESTORED' }
      : { atMs: Math.max(cursorMs, maxWakeMs), cause: 'MAX_DURATION' };
  }

  private nextDecisionBoundary(cursorMs: number): number {
    const interval = this.rules.autonomy.decisionIntervalMs;
    return (Math.floor(cursorMs / interval) + 1) * interval;
  }

  /** In approximation mode the pet idles until tired enough to fall asleep. */
  private approximateSleepAt(cursorMs: number): number {
    const { autonomy, energy } = this.rules;

    if (this.state.energy <= autonomy.sleepAtEnergy) {
      return cursorMs;
    }

    const decayPerHour = energy.awakeDecayPerHour * autonomy.effects.IDLE.energyDecayMultiplier;

    if (decayPerHour <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return cursorMs + Math.ceil(((this.state.energy - autonomy.sleepAtEnergy) / decayPerHour) * HOUR_MS);
  }

  private applyNeeds(durationMs: number): void {
    if (durationMs <= 0) {
      return;
    }

    const { hunger, energy, happiness } = this.rules;
    const hours = durationMs / HOUR_MS;
    const activity = this.state.currentActivity;
    const sleeping = activity === 'SLEEPING';
    const effect = sleeping ? null : this.rules.autonomy.effects[activity as AwakeActivity];

    const hungerDecayPerHour = sleeping ? hunger.sleepingDecayPerHour : hunger.awakeDecayPerHour;
    const energyChangePerHour = sleeping
      ? energy.sleepingRecoveryPerHour
      : -energy.awakeDecayPerHour * (effect?.energyDecayMultiplier ?? 1);

    const lowHungerHours = hoursAtOrBelow(
      this.state.hunger,
      hungerDecayPerHour,
      happiness.lowHungerAtOrBelow,
      hours,
    );
    const lowEnergyHours = sleeping
      ? 0
      : hoursAtOrBelow(
          this.state.energy,
          -energyChangePerHour,
          happiness.lowEnergyAwakeAtOrBelow,
          hours,
        );
    const pressure = passiveHappinessPressure(lowHungerHours, lowEnergyHours, this.rules);
    const pressureFloor = Math.min(this.state.happiness, happiness.passiveFloor);
    const pressuredHappiness = Math.max(pressureFloor, this.state.happiness - pressure);

    this.state = {
      ...this.state,
      hunger: clampStat(this.state.hunger - hungerDecayPerHour * hours),
      energy: clampStat(this.state.energy + energyChangePerHour * hours),
      happiness: clampStat(pressuredHappiness + (effect?.happinessPerHour ?? 0) * hours),
    };
    this.activityMs[activity] = (this.activityMs[activity] ?? 0) + durationMs;
  }

  private decide(atMs: number, mode: SimulationMode): void {
    if (this.state.energy <= this.rules.autonomy.sleepAtEnergy) {
      this.fallAsleep(atMs, mode);
      return;
    }

    if (mode === 'APPROXIMATE') {
      return;
    }

    const next = decideAutonomousActivity(this.state, this.rules, this.random);

    if (next === 'SLEEPING') {
      this.fallAsleep(atMs, mode);
      return;
    }

    if (next !== this.state.currentActivity) {
      this.record(mode, 'PET_ACTIVITY_CHANGED', atMs, {
        from: this.state.currentActivity,
        to: next,
      });
      this.state = { ...this.state, currentActivity: next };
    }
  }

  private fallAsleep(atMs: number, mode: SimulationMode): void {
    this.state = { ...this.state, currentActivity: 'SLEEPING', sleepStartedAt: new Date(atMs) };
    this.record(mode, 'PET_STARTED_SLEEPING', atMs, { source: 'AUTONOMOUS' });
  }

  private wake(atMs: number, cause: WakeCause, mode: SimulationMode): void {
    this.state = { ...this.state, currentActivity: 'IDLE', sleepStartedAt: null };
    this.record(mode, 'PET_WOKE_UP', atMs, { source: 'AUTONOMOUS', cause });
  }

  private record(
    mode: SimulationMode,
    type: DomainEvent['type'],
    atMs: number,
    payload: Readonly<Record<string, unknown>>,
  ): void {
    if (mode === 'DETAILED') {
      this.events.push(createDomainEvent(type, new Date(atMs), payload));
    }
  }
}

/** Hours within a segment during which a linearly decreasing value is at or below a threshold. */
function hoursAtOrBelow(
  value: number,
  decreasePerHour: number,
  threshold: number,
  hours: number,
): number {
  if (value <= threshold) {
    return hours;
  }

  if (decreasePerHour <= 0) {
    return 0;
  }

  return Math.max(0, hours - (value - threshold) / decreasePerHour);
}

/**
 * Both conditions only become true partway through a segment and stay true, so their overlap
 * is the shorter of the two. Overlapping penalties are summed but the rate never exceeds the
 * daily cap.
 */
function passiveHappinessPressure(
  lowHungerHours: number,
  lowEnergyHours: number,
  rules: GameRules,
): number {
  const { penaltyPerInterval, penaltyIntervalMs, maxPassiveLossPerDay } = rules.happiness;
  const conditionRatePerHour = penaltyPerInterval / (penaltyIntervalMs / HOUR_MS);
  const capRatePerHour = maxPassiveLossPerDay / DAY_HOURS;
  const overlapHours = Math.min(lowHungerHours, lowEnergyHours);
  const singleHours = Math.max(lowHungerHours, lowEnergyHours) - overlapHours;

  return (
    overlapHours * Math.min(2 * conditionRatePerHour, capRatePerHour) +
    singleHours * Math.min(conditionRatePerHour, capRatePerHour)
  );
}
