import { randomUUID } from 'node:crypto';

import type { ActionResult, ActionType, PetSnapshot } from '@ai-virtual-pet/contracts';
import {
  DEFAULT_GAME_RULES,
  DEFAULT_PERSONALITY_RULES,
  applyAutonomousIndependentSignal,
  applyFeed,
  applyPersonalitySignal,
  applyPlay,
  createDomainEvent,
  createInitialPersonality,
  createEgg,
  createInitialPetState,
  hasQualifyingAutonomousActivity,
  hatchPet,
  namePet,
  startSleep,
  SystemRandom,
  type ActionResult as DomainActionResult,
  type Clock,
  type DomainEvent,
  type GameRules,
  type PersonalityRules,
  type PersonalitySignal,
  type PersonalityState,
  type Pet,
  type PetState,
  type Random,
} from '@ai-virtual-pet/domain';
import { simulateElapsedTime } from '@ai-virtual-pet/simulation';

import {
  ConcurrencyError,
  PetAlreadyExistsError,
  type EventRepository,
  type PetAggregate,
  type PetRepository,
} from '../persistence/repositories.js';
import { ApplicationError } from './errors.js';
import { toPetSnapshot } from './snapshot.js';

// Enough for a "while you were away" recap after about a day of hourly activity changes.
const RECENT_EVENT_LIMIT = 20;
// Each conflict round lets one competing write commit, so this bounds concurrent writes per pet.
const DEFAULT_MAX_ATTEMPTS = 5;

export interface PetServiceDependencies {
  readonly pets: PetRepository;
  readonly events: EventRepository;
  readonly clock: Clock;
  readonly random: Random;
  readonly rules?: GameRules;
  readonly personalityRules?: PersonalityRules;
  /**
   * Draws new personalities. Separate from `random` so creating a personality never shifts the
   * simulation's random sequence. Defaults to `SystemRandom`; tests inject a deterministic one.
   */
  readonly personalityRandom?: Random;
  readonly createId?: () => string;
  readonly maxAttempts?: number;
}

/** The pet after catching up on elapsed time, ready for an operation. */
export interface Loaded {
  readonly aggregate: PetAggregate;
  readonly state: PetState;
  /** Null only for an Egg. A Baby stored without one is given one on load. */
  readonly personality: PersonalityState | null;
  readonly now: Date;
}

/** What an operation wants persisted, and how to shape its result from the saved snapshot. */
export interface Mutation<T> {
  readonly pet: Pet;
  readonly state: PetState;
  readonly events: readonly DomainEvent[];
  /** Omitted: keep the loaded personality. */
  readonly personality?: PersonalityState;
  readonly result: (snapshot: PetSnapshot) => T | Promise<T>;
}

/** Personality signal caused by an accepted care action (plan Tasks 2.5–2.6). Sleep has none. */
const ACTION_PERSONALITY_SIGNAL: Readonly<Partial<Record<ActionType, PersonalitySignal>>> = {
  PLAY: 'PLAY',
  FEED: 'CARE',
};

/**
 * Application orchestration for the single prototype pet:
 * load → simulate elapsed time → apply operation → persist state + events → snapshot.
 * Game rules live in domain/simulation; HTTP concerns live in routes.
 */
export class PetService {
  protected readonly rules: GameRules;
  protected readonly personalityRules: PersonalityRules;
  private readonly personalityRandom: Random;
  private readonly createId: () => string;
  private readonly maxAttempts: number;

  constructor(protected readonly deps: PetServiceDependencies) {
    this.rules = deps.rules ?? DEFAULT_GAME_RULES;
    this.personalityRules = deps.personalityRules ?? DEFAULT_PERSONALITY_RULES;
    this.personalityRandom = deps.personalityRandom ?? new SystemRandom();
    this.createId = deps.createId ?? randomUUID;
    this.maxAttempts = deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  }

  async createPet(): Promise<PetSnapshot> {
    const now = this.deps.clock.now();
    const id = this.createId();

    try {
      const aggregate = await this.deps.pets.create(
        createEgg({ id, createdAt: now }),
        createInitialPetState(id, now, this.rules),
      );
      return await this.snapshot(aggregate, now);
    } catch (error) {
      if (error instanceof PetAlreadyExistsError) {
        throw new ApplicationError('PET_ALREADY_EXISTS', 'A pet already exists.');
      }

      throw error;
    }
  }

  async getPet(): Promise<PetSnapshot> {
    return this.mutate(({ aggregate, state }) => ({
      pet: aggregate.pet,
      state,
      events: [],
      result: (snapshot) => snapshot,
    }));
  }

  async hatch(): Promise<PetSnapshot> {
    return this.mutate(({ aggregate, now }) => {
      if (aggregate.pet.stage !== 'EGG') {
        throw invalidStage('Only an Egg can hatch.');
      }

      const baby = hatchPet(aggregate.pet, now);

      return {
        pet: baby,
        // Time spent as an Egg does not cost needs: the Baby starts fresh at hatch time.
        state: createInitialPetState(baby.id, now, this.rules),
        personality: this.newPersonality(baby.id),
        events: [createDomainEvent('PET_HATCHED', now)],
        result: (snapshot) => snapshot,
      };
    });
  }

  async name(name: string): Promise<PetSnapshot> {
    return this.mutate(({ aggregate, state, now }) => {
      if (aggregate.pet.stage === 'EGG') {
        throw invalidStage('An Egg cannot be named before it hatches.');
      }

      const named = namePet(aggregate.pet, name);

      return {
        pet: named,
        state,
        events: [createDomainEvent('PET_NAMED', now, { name: named.name })],
        result: (snapshot) => snapshot,
      };
    });
  }

  async act(type: ActionType): Promise<ActionResult> {
    return this.mutate(async ({ aggregate, state, personality, now }) => {
      if (aggregate.pet.stage === 'EGG' || !personality) {
        throw invalidStage('An Egg cannot receive care actions.');
      }

      const outcome = await this.applyAction(type, aggregate, state, now);
      const signal = outcome.accepted ? ACTION_PERSONALITY_SIGNAL[type] : undefined;

      return {
        pet: aggregate.pet,
        state: outcome.state,
        events: outcome.events,
        // Only an accepted action shapes personality; a rejected Play teaches nothing.
        personality: signal ? applyPersonalitySignal(personality, signal, now, this.personalityRules).state : personality,
        result: (snapshot): ActionResult =>
          outcome.accepted
            ? {
                status: 'SUCCESS',
                action: { type },
                changes: {
                  hunger: roundDelta(outcome.state.hunger - state.hunger),
                  energy: roundDelta(outcome.state.energy - state.energy),
                  happiness: roundDelta(outcome.state.happiness - state.happiness),
                  bond: roundDelta(outcome.state.bond - state.bond),
                },
                pet: snapshot,
              }
            : { status: 'REJECTED', action: { type }, reason: outcome.reason, pet: snapshot },
      };
    });
  }

  private async applyAction(
    type: ActionType,
    aggregate: PetAggregate,
    state: PetState,
    now: Date,
  ): Promise<DomainActionResult> {
    switch (type) {
      case 'FEED':
        return applyFeed(state, now, this.rules);
      case 'PLAY': {
        const windowStart = new Date(now.getTime() - this.rules.play.diminishingWindowMs);
        const recentPlays = await this.deps.events.listOccurrenceTimes(
          aggregate.pet.id,
          'PET_PLAYED',
          windowStart,
        );
        return applyPlay(state, now, recentPlays, this.rules);
      }
      case 'SLEEP':
        return startSleep(state, now, this.rules);
    }
  }

  /**
   * Runs an operation against the freshly simulated pet and saves it with optimistic
   * concurrency. A conflicting concurrent write causes a reload and a re-run, so concurrent
   * requests are applied one after another instead of overwriting each other.
   */
  protected async mutate<T>(operation: (loaded: Loaded) => Mutation<T> | Promise<Mutation<T>>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      const aggregate = await this.requireCurrent();
      const now = this.deps.clock.now();
      const simulated = this.simulate(aggregate, now);
      const personality = this.loadPersonality(aggregate, simulated.events, now);
      const mutation = await operation({ aggregate, state: simulated.state, personality, now });
      const events = [...simulated.events, ...mutation.events];
      const nextPersonality = mutation.personality ?? personality;
      const changed =
        events.length > 0 ||
        mutation.pet !== aggregate.pet ||
        mutation.state !== aggregate.state ||
        nextPersonality !== (aggregate.personality ?? null);

      try {
        const saved = changed
          ? await this.deps.pets.save({
              pet: mutation.pet,
              state: mutation.state,
              expectedVersion: aggregate.version,
              events,
              ...(nextPersonality ? { personality: nextPersonality } : {}),
            })
          : aggregate;

        return await mutation.result(await this.snapshot(saved, now));
      } catch (error) {
        if (!(error instanceof ConcurrencyError)) {
          throw error;
        }

        if (attempt >= this.maxAttempts) {
          throw new ApplicationError('PET_STATE_CONFLICT', 'Pet state changed. Refresh and retry.');
        }
      }
    }
  }

  /**
   * The pet's personality for this operation: initialized for a Baby stored before personality
   * existed (lazy migration), plus the autonomous Independent signal. One simulation run grants at
   * most one signal however many days elapsed, and the domain limits it to once per day.
   */
  private loadPersonality(
    aggregate: PetAggregate,
    simulatedEvents: readonly DomainEvent[],
    now: Date,
  ): PersonalityState | null {
    if (aggregate.pet.stage === 'EGG') {
      return null;
    }

    const personality = aggregate.personality ?? this.newPersonality(aggregate.pet.id);

    return hasQualifyingAutonomousActivity(simulatedEvents)
      ? applyAutonomousIndependentSignal(personality, now, this.personalityRules).state
      : personality;
  }

  private newPersonality(petId: string): PersonalityState {
    return createInitialPersonality(petId, this.personalityRandom, this.personalityRules);
  }

  private simulate(aggregate: PetAggregate, now: Date): { state: PetState; events: readonly DomainEvent[] } {
    // An Egg has no needs yet; a clock behind the last simulation never rewinds the pet.
    if (aggregate.pet.stage === 'EGG' || now <= aggregate.state.lastSimulatedAt) {
      return { state: aggregate.state, events: [] };
    }

    return simulateElapsedTime({
      state: aggregate.state,
      to: now,
      random: this.deps.random,
      rules: this.rules,
    });
  }

  protected async requireCurrent(): Promise<PetAggregate> {
    const aggregate = await this.deps.pets.findCurrent();

    if (!aggregate) {
      throw new ApplicationError('PET_NOT_FOUND', 'No pet exists yet.');
    }

    return aggregate;
  }

  protected async snapshot(aggregate: PetAggregate, now: Date): Promise<PetSnapshot> {
    const petId = aggregate.pet.id;
    const excitedSince = new Date(now.getTime() - this.rules.mood.excitedWithinMs);
    const [recentEvents, recentPlays] = await Promise.all([
      this.deps.events.listRecent(petId, { limit: RECENT_EVENT_LIMIT }),
      this.deps.events.listOccurrenceTimes(petId, 'PET_PLAYED', excitedSince),
    ]);

    return toPetSnapshot(aggregate, {
      now,
      lastPlayedAt: recentPlays.at(-1) ?? null,
      recentEvents,
      rules: this.rules,
    });
  }
}

/** Removes floating-point noise (e.g. 0.09999999999999964) from reported deltas. */
function roundDelta(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function invalidStage(message: string): ApplicationError {
  return new ApplicationError('INVALID_PET_STAGE', message);
}
