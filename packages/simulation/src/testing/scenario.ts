import {
  DEFAULT_GAME_RULES,
  FakeClock,
  SeededRandom,
  applyFeed,
  applyPlay,
  createInitialPetState,
  startSleep,
  wakePet,
  type ActionResult,
  type DomainEvent,
  type GameRules,
  type PetState,
} from '@ai-virtual-pet/domain';

import { simulateElapsedTime } from '../simulate.js';

const HOUR_MS = 60 * 60 * 1_000;

export interface ScenarioOptions {
  readonly start?: Date;
  readonly seed?: number;
  readonly state?: Partial<Omit<PetState, 'petId'>>;
  readonly rules?: GameRules;
}

/**
 * Drives a pet the way the application layer will: every step first simulates elapsed time
 * up to "now", then applies the player's action. All states are kept for invariant checks.
 */
export class PetScenario {
  readonly clock: FakeClock;
  readonly events: DomainEvent[] = [];
  readonly history: PetState[] = [];
  readonly actionResults: ActionResult[] = [];
  private readonly random: SeededRandom;
  private readonly rules: GameRules;
  private readonly playTimes: Date[] = [];
  private currentState: PetState;

  constructor(options: ScenarioOptions = {}) {
    const start = options.start ?? new Date('2026-09-25T08:00:00.000Z');
    this.clock = new FakeClock(start);
    this.random = new SeededRandom(options.seed ?? 1);
    this.rules = options.rules ?? DEFAULT_GAME_RULES;
    this.currentState = {
      ...createInitialPetState('scenario-pet', start, this.rules),
      ...options.state,
    };
    this.history.push(this.currentState);
  }

  get state(): PetState {
    return this.currentState;
  }

  get lastPlayedAt(): Date | null {
    return this.playTimes.at(-1) ?? null;
  }

  advanceHours(hours: number): this {
    this.clock.advanceBy(hours * HOUR_MS);
    this.sync();
    return this;
  }

  feed(): ActionResult {
    return this.act((state, now) => applyFeed(state, now, this.rules));
  }

  play(): ActionResult {
    const result = this.act((state, now) => applyPlay(state, now, this.playTimes, this.rules));

    if (result.accepted) {
      this.playTimes.push(this.clock.now());
    }

    return result;
  }

  sleep(): ActionResult {
    return this.act((state, now) => startSleep(state, now, this.rules));
  }

  wake(): ActionResult {
    return this.act((state, now) => wakePet(state, now));
  }

  eventsOfType(type: DomainEvent['type']): DomainEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  private sync(): void {
    const result = simulateElapsedTime({
      state: this.currentState,
      to: this.clock.now(),
      random: this.random,
      rules: this.rules,
    });
    this.commit(result.state, result.events);
  }

  private act(action: (state: PetState, now: Date) => ActionResult): ActionResult {
    this.sync();
    const result = action(this.currentState, this.clock.now());
    this.actionResults.push(result);
    this.commit(result.state, result.events);
    return result;
  }

  private commit(state: PetState, events: readonly DomainEvent[]): void {
    this.currentState = state;
    this.events.push(...events);
    this.history.push(state);
  }
}
