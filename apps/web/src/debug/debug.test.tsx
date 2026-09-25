import type { DebugAi, DebugState } from '@ai-virtual-pet/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { makeEvent, makeSnapshot } from '../testing/snapshot';
import { DebugPanelView, type DebugPanelViewProps } from './DebugPanelView';
import {
  ADVANCE_PRESETS,
  formatOffset,
  formatPayload,
  formatSignedDelta,
  formatStat,
  formatTime,
  formatTrait,
  PERSONALITY_PRESET_OPTIONS,
} from './format';

const noop = () => {};

function render(overrides: Partial<DebugPanelViewProps> = {}) {
  return renderToStaticMarkup(
    <DebugPanelView
      status="ready"
      feedback={null}
      busy={false}
      onClose={noop}
      onAdvance={noop}
      onSleep={noop}
      onWake={noop}
      onSet={noop}
      onSetPersonality={noop}
      onReset={noop}
      {...overrides}
    />,
  );
}

const levels = { playful: 'high', curious: 'moderate', shy: 'moderate', independent: 'moderate', clingy: 'moderate' } as const;

const ai: DebugAi = {
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
    model: 'test-model',
    latencyMs: 1200,
    inputTokens: 300,
    outputTokens: 40,
    occurredAt: '2026-09-26T11:59:00.000Z',
  },
  personality: {
    traits: { playful: 0.8, curious: 0.45, shy: 0.45, independent: 0.45, clingy: 0.45 },
    daily: { day: '2026-09-26', capPerTrait: 0.03, deltas: { playful: 0.018, curious: 0, shy: 0, independent: 0, clingy: 0 } },
    profile: {
      levels,
      dominantTraits: ['PLAYFUL'],
      primaryTrait: 'PLAYFUL',
      strength: 'STRONG',
      socialStyle: 'BALANCED',
    },
  },
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
    levels,
    dominantTraits: ['PLAYFUL'],
    primaryTrait: 'PLAYFUL',
    strength: 'STRONG',
    socialStyle: 'BALANCED',
    recentMessageCount: 4,
    recentEventCount: 3,
  },
};

const state: DebugState = {
  pet: makeSnapshot({ state: { hunger: 72.4, energy: 43.2, happiness: 81, bond: 12.3 } }),
  debug: {
    clock: { now: '2026-09-26T12:00:00.000Z', offsetMs: 26 * 60 * 60 * 1_000 },
    moodCandidates: [
      { mood: 'HAPPY', score: 40 },
      { mood: 'NEUTRAL', score: 0 },
    ],
    events: [
      makeEvent('PET_FED', '2026-09-26T11:00:00.000Z', { hungerDelta: 25 }),
      makeEvent('PET_PLAYED', '2026-09-26T10:00:00.000Z', { multiplier: 1 }),
    ],
  },
};

describe('debug formatting', () => {
  it('shows stats with balancing precision', () => {
    expect(formatStat(72.4)).toBe('72.40');
    expect(formatStat(9.99999)).toBe('10.00');
  });

  it('describes the debug clock offset', () => {
    expect(formatOffset(0)).toBe('real time');
    expect(formatOffset(26 * 60 * 60 * 1_000 + 5 * 60 * 1_000)).toBe('+1d 2h 5m');
  });

  it('keeps payloads short and readable', () => {
    expect(formatPayload({})).toBe('');
    expect(formatPayload({ bondDelta: 0.09999999999999964 })).toBe('{"bondDelta":0.1}');
  });

  it('formats missing times as a dash', () => {
    expect(formatTime(null)).toBe('—');
  });

  it('offers exactly the required time-travel presets', () => {
    expect(ADVANCE_PRESETS.map((preset) => preset.label)).toEqual(['+1h', '+6h', '+12h', '+1d', '+3d', '+7d']);
  });

  it('formats raw traits and signed daily deltas', () => {
    expect(formatTrait(0.8)).toBe('0.800');
    expect(formatSignedDelta(0.018)).toBe('+0.018');
    expect(formatSignedDelta(-0.002)).toBe('-0.002');
    expect(PERSONALITY_PRESET_OPTIONS.map((option) => option.label)).toEqual([
      'Balanced',
      'Playful',
      'Curious',
      'Shy',
      'Independent',
      'Clingy',
    ]);
  });
});

describe('DebugPanelView', () => {
  it('shows raw state, derived state, times, controls, and events newest first', () => {
    const markup = render({ state });

    for (const text of ['72.40', '43.20', '81.00', '12.30', 'HAPPY 40.0', '+1d 2h', 'lastSimulatedAt', 'Force Sleep', 'Wake Pet', 'Reset Pet']) {
      expect(markup).toContain(text);
    }
    for (const preset of ADVANCE_PRESETS) {
      expect(markup).toContain(`>${preset.label}<`);
    }
    expect(markup.indexOf('PET_FED')).toBeLessThan(markup.indexOf('PET_PLAYED'));
  });

  it('explains why there is nothing to inspect', () => {
    expect(render({ status: 'no-pet' })).toContain('No pet yet');
    expect(render({ status: 'disabled' })).toContain('ENABLE_DEBUG_API=true');
  });

  it('does not reset without confirmation', () => {
    expect(render({ state })).not.toContain('This will remove current prototype progress.');
  });
});

describe('DebugPanelView personality and AI', () => {
  it('shows personality traits, today\'s deltas, the dominant trait, and preset controls', () => {
    const markup = render({ ai });

    for (const text of ['Personality', 'Playful', '0.800', '+0.018', '0.030', 'Dominant', 'STRONG', 'Balanced', 'Independent']) {
      expect(markup).toContain(text);
    }
    for (const option of PERSONALITY_PRESET_OPTIONS) {
      expect(markup).toContain(`>${option.label}<`);
    }
  });

  it('shows the latest AI turn metadata and context inspection', () => {
    const markup = render({ ai });

    for (const text of [
      'Last AI turn',
      'Intent',
      'PLAY',
      'Confidence',
      '0.90',
      'Classification',
      'PLAYFUL',
      'Provider',
      '9router',
      'Model',
      'test-model',
      'Latency',
      '1200',
      'Tokens',
      '300 / 40',
      'Fallback used',
      'Context',
      'Mood',
      'NEUTRAL',
      'Relationship',
      'LOW',
      'Messages',
    ]) {
      expect(markup).toContain(text);
    }
  });

  it('says when the pet has no AI turn yet', () => {
    const markup = render({ ai: { lastTurn: null, personality: ai.personality, context: ai.context } });

    expect(markup).toContain('No chat turn yet');
  });

  it('hides the personality and AI sections before a personality exists', () => {
    const markup = render({ ai: { lastTurn: null, personality: null, context: null } });

    expect(markup).not.toContain('Last AI turn');
    expect(markup).not.toContain('Personality');
  });
});
