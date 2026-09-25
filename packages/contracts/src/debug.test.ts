import { describe, expect, it } from 'vitest';

import { debugAiSchema, debugSetPersonalityRequestSchema } from './debug.js';

const traits = { playful: 0.8, curious: 0.45, shy: 0.45, independent: 0.45, clingy: 0.45 };

const personality = {
  traits,
  daily: { day: '2026-09-26', capPerTrait: 0.03, deltas: { playful: 0.018, curious: 0, shy: 0, independent: 0, clingy: 0 } },
  profile: {
    dominantTraits: ['PLAYFUL'],
    primaryTrait: 'PLAYFUL',
    strength: 'STRONG',
    socialStyle: 'BALANCED',
    levels: { playful: 'high', curious: 'moderate', shy: 'moderate', independent: 'moderate', clingy: 'moderate' },
  },
};

describe('debug personality set request', () => {
  it('accepts a preset name', () => {
    expect(debugSetPersonalityRequestSchema.parse({ preset: 'HIGH_CLINGY' })).toEqual({ preset: 'HIGH_CLINGY' });
  });

  it('accepts explicit trait values', () => {
    expect(debugSetPersonalityRequestSchema.parse({ playful: 0.8, clingy: 0.2 })).toEqual({ playful: 0.8, clingy: 0.2 });
  });

  it('rejects an empty request', () => {
    expect(debugSetPersonalityRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a preset combined with explicit traits', () => {
    expect(debugSetPersonalityRequestSchema.safeParse({ preset: 'BALANCED', playful: 0.5 }).success).toBe(false);
  });

  it('rejects unknown traits and presets', () => {
    expect(debugSetPersonalityRequestSchema.safeParse({ brave: 0.5 }).success).toBe(false);
    expect(debugSetPersonalityRequestSchema.safeParse({ preset: 'SUPER_PLAYFUL' }).success).toBe(false);
  });
});

describe('debug AI payload', () => {
  it('accepts an empty egg payload', () => {
    expect(debugAiSchema.parse({ lastTurn: null, personality: null, context: null })).toEqual({
      lastTurn: null,
      personality: null,
      context: null,
    });
  });

  it('accepts a full hatched payload with a last turn', () => {
    const payload = {
      lastTurn: {
        intent: 'PLAY',
        confidence: 0.9,
        classification: 'PLAYFUL',
        action: { type: 'PLAY', status: 'SUCCESS' },
        bondDelta: 1,
        fallbackUsed: false,
        responseFailure: null,
        interpretationFallback: false,
        interpretationFailure: null,
        provider: '9router',
        model: 'gpt-4o-mini',
        latencyMs: 1200,
        inputTokens: 300,
        outputTokens: 40,
        occurredAt: '2026-09-26T12:00:00.000Z',
      },
      personality,
      context: {
        state: {
          hunger: 70,
          energy: 80,
          happiness: 75,
          bond: 12,
          currentActivity: 'IDLE',
          lastInteractionAt: null,
          lastSimulatedAt: '2026-09-26T12:00:00.000Z',
          sleepStartedAt: null,
        },
        mood: 'NEUTRAL',
        relationship: 'LOW',
        levels: { playful: 'high', curious: 'moderate', shy: 'moderate', independent: 'moderate', clingy: 'moderate' },
        dominantTraits: ['PLAYFUL'],
        primaryTrait: 'PLAYFUL',
        strength: 'STRONG',
        socialStyle: 'BALANCED',
        recentMessageCount: 4,
        recentEventCount: 3,
      },
    };

    expect(debugAiSchema.parse(payload)).toEqual(payload);
  });
});
