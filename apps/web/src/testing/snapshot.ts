import type { PetEventDto, PetSnapshot } from '@ai-virtual-pet/contracts';

export const NOW = '2026-09-25T12:00:00.000Z';

type SnapshotOverrides = {
  pet?: Partial<PetSnapshot['pet']>;
  state?: Partial<PetSnapshot['state']>;
  derived?: { mood?: PetSnapshot['derived']['mood']; needs?: Partial<PetSnapshot['derived']['needs']> };
  recentEvents?: PetEventDto[];
};

export function makeSnapshot(overrides: SnapshotOverrides = {}): PetSnapshot {
  return {
    pet: {
      id: 'pet-1',
      name: 'Momo',
      species: 'DEFAULT',
      stage: 'BABY',
      createdAt: NOW,
      hatchedAt: NOW,
      version: 3,
      ...overrides.pet,
    },
    state: {
      hunger: 72.4,
      energy: 64.2,
      happiness: 81.3,
      bond: 12.7,
      currentActivity: 'IDLE',
      lastInteractionAt: NOW,
      lastSimulatedAt: NOW,
      sleepStartedAt: null,
      ...overrides.state,
    },
    derived: {
      mood: overrides.derived?.mood ?? 'NEUTRAL',
      needs: { fullness: 'OKAY', energy: 'OKAY', happiness: 'HAPPY', ...overrides.derived?.needs },
    },
    recentEvents: overrides.recentEvents ?? [],
  };
}

let nextId = 1;

export function makeEvent(type: PetEventDto['type'], occurredAt: string, payload: Record<string, unknown> = {}): PetEventDto {
  return { id: nextId++, type, occurredAt, payload };
}
