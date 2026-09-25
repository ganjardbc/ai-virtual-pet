import type {
  DebugAdvanceTimeRequest,
  DebugAdvanceTimeResult,
  DebugCommandResult,
  DebugResetResult,
  DebugSetStateRequest,
  DebugState,
  PetSnapshot,
} from '@ai-virtual-pet/contracts';
import {
  clampStat,
  createDomainEvent,
  createPetState,
  wakePet,
  type PetState,
} from '@ai-virtual-pet/domain';
import { moodCandidates } from '@ai-virtual-pet/simulation';

import { ApplicationError } from '../application/errors.js';
import { PetService, type Loaded, type PetServiceDependencies } from '../application/pet-service.js';
import { toPetEventDto } from '../application/snapshot.js';
import type { OffsetClock } from './offset-clock.js';

const HOUR_MS = 60 * 60 * 1_000;
const DEBUG_EVENT_LIMIT = 25;
const STAT_KEYS = ['hunger', 'energy', 'happiness', 'bond'] as const;

export interface DebugServiceDependencies extends PetServiceDependencies {
  readonly clock: OffsetClock;
}

/**
 * Development-only commands. They reuse the normal load → simulate → save-with-retry flow,
 * so time travel exercises the real simulation instead of editing stats directly.
 */
export class DebugPetService extends PetService {
  private readonly debugClock: OffsetClock;

  constructor(deps: DebugServiceDependencies) {
    super(deps);
    this.debugClock = deps.clock;
  }

  async getState(): Promise<DebugState> {
    return this.mutate((loaded) => ({
      pet: loaded.aggregate.pet,
      state: loaded.state,
      events: [],
      result: (snapshot) => this.debugState(snapshot, loaded.state, loaded.now),
    }));
  }

  async advanceTime(request: DebugAdvanceTimeRequest): Promise<DebugAdvanceTimeResult> {
    await this.requireCurrent();
    const advancedMs = (request.hours ?? 0) * HOUR_MS + (request.days ?? 0) * 24 * HOUR_MS;

    this.debugClock.advanceBy(advancedMs);
    return { ...(await this.getState()), advancedMs };
  }

  async forceSleep(): Promise<DebugCommandResult> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);

      if (state.currentActivity === 'SLEEPING') {
        return this.rejected(loaded, 'SLEEPING');
      }

      // Not a player interaction: no Bond, no lastInteractionAt.
      const sleeping = createPetState({ ...state, currentActivity: 'SLEEPING', sleepStartedAt: now });

      return {
        pet: aggregate.pet,
        state: sleeping,
        events: [createDomainEvent('PET_STARTED_SLEEPING', now, { source: 'DEBUG' })],
        result: async (snapshot) => ({
          status: 'SUCCESS',
          state: await this.debugState(snapshot, sleeping, now),
        }),
      };
    });
  }

  async wake(): Promise<DebugCommandResult> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);
      const outcome = wakePet(state, now);

      if (!outcome.accepted) {
        return this.rejected(loaded, outcome.reason);
      }

      return {
        pet: aggregate.pet,
        state: outcome.state,
        events: [createDomainEvent('PET_WOKE_UP', now, { source: 'DEBUG' })],
        result: async (snapshot) => ({
          status: 'SUCCESS',
          state: await this.debugState(snapshot, outcome.state, now),
        }),
      };
    });
  }

  async setState(request: DebugSetStateRequest): Promise<DebugState> {
    return this.mutate((loaded) => {
      const { aggregate, state, now } = this.requireHatched(loaded);
      const before: Partial<Record<(typeof STAT_KEYS)[number], number>> = {};
      const after: Partial<Record<(typeof STAT_KEYS)[number], number>> = {};

      for (const key of STAT_KEYS) {
        const requested = request[key];

        if (requested !== undefined) {
          before[key] = state[key];
          after[key] = clampStat(requested);
        }
      }

      const next = createPetState({ ...state, ...after });

      return {
        pet: aggregate.pet,
        state: next,
        events: [createDomainEvent('DEBUG_STATE_CHANGED', now, { before, after })],
        result: (snapshot) => this.debugState(snapshot, next, now),
      };
    });
  }

  async reset(): Promise<DebugResetResult> {
    await this.deps.pets.deleteAll();
    this.debugClock.reset();
    return { reset: true };
  }

  private requireHatched(loaded: Loaded): Loaded {
    if (loaded.aggregate.pet.stage === 'EGG') {
      throw new ApplicationError('INVALID_PET_STAGE', 'Debug state commands need a hatched pet.');
    }

    return loaded;
  }

  /** A debug command that does not apply; simulated time is still saved. */
  private rejected(loaded: Loaded, reason: 'SLEEPING' | 'INVALID_STATE' | 'TOO_TIRED' | 'TOO_FULL') {
    return {
      pet: loaded.aggregate.pet,
      state: loaded.state,
      events: [],
      result: async (snapshot: PetSnapshot): Promise<DebugCommandResult> => ({
        status: 'REJECTED',
        reason,
        state: await this.debugState(snapshot, loaded.state, loaded.now),
      }),
    };
  }

  private async debugState(snapshot: PetSnapshot, state: PetState, now: Date): Promise<DebugState> {
    const petId = snapshot.pet.id;
    const excitedSince = new Date(now.getTime() - this.rules.mood.excitedWithinMs);
    const [events, recentPlays] = await Promise.all([
      this.deps.events.listRecent(petId, { limit: DEBUG_EVENT_LIMIT }),
      this.deps.events.listOccurrenceTimes(petId, 'PET_PLAYED', excitedSince),
    ]);

    return {
      pet: snapshot,
      debug: {
        clock: { now: now.toISOString(), offsetMs: this.debugClock.offsetMs },
        moodCandidates: moodCandidates({ state, now, lastPlayedAt: recentPlays.at(-1) ?? null }, this.rules),
        events: events.map(toPetEventDto),
      },
    };
  }
}
