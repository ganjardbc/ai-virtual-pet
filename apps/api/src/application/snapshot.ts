import type {
  DerivedStateDto,
  PetDto,
  PetEventDto,
  PetSnapshot,
  PetStateDto,
} from '@ai-virtual-pet/contracts';
import type { GameRules, Pet, PetState } from '@ai-virtual-pet/domain';
import { deriveMood, deriveNeedLabels } from '@ai-virtual-pet/simulation';

import type { PetAggregate, StoredEvent } from '../persistence/repositories.js';

const SPECIES = 'DEFAULT';

export interface SnapshotContext {
  readonly now: Date;
  readonly lastPlayedAt: Date | null;
  readonly recentEvents: readonly StoredEvent[];
  readonly rules: GameRules;
}

// Explicit DTO return types make the compiler flag any drift between domain and contract enums.

export function toPetSnapshot(aggregate: PetAggregate, context: SnapshotContext): PetSnapshot {
  return {
    pet: toPetDto(aggregate.pet, aggregate.version),
    state: toPetStateDto(aggregate.state),
    derived: toDerivedDto(aggregate.state, context),
    recentEvents: context.recentEvents.map(toPetEventDto),
  };
}

function toPetDto(pet: Pet, version: number): PetDto {
  return {
    id: pet.id,
    name: pet.name,
    species: SPECIES,
    stage: pet.stage,
    createdAt: pet.createdAt.toISOString(),
    hatchedAt: pet.hatchedAt?.toISOString() ?? null,
    version,
  };
}

function toPetStateDto(state: PetState): PetStateDto {
  return {
    hunger: state.hunger,
    energy: state.energy,
    happiness: state.happiness,
    bond: state.bond,
    currentActivity: state.currentActivity,
    lastInteractionAt: state.lastInteractionAt?.toISOString() ?? null,
    lastSimulatedAt: state.lastSimulatedAt.toISOString(),
    sleepStartedAt: state.sleepStartedAt?.toISOString() ?? null,
  };
}

function toDerivedDto(state: PetState, context: SnapshotContext): DerivedStateDto {
  const mood = deriveMood({ state, now: context.now, lastPlayedAt: context.lastPlayedAt }, context.rules);

  return { mood: mood.mood, needs: deriveNeedLabels(state, context.rules) };
}

export function toPetEventDto(event: StoredEvent): PetEventDto {
  return {
    id: event.id,
    type: event.type,
    occurredAt: event.occurredAt.toISOString(),
    payload: { ...event.payload },
  };
}
