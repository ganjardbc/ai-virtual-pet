import type { DebugState } from '@ai-virtual-pet/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { makeEvent, makeSnapshot } from '../testing/snapshot';
import { DebugPanelView, type DebugPanelViewProps } from './DebugPanelView';
import { ADVANCE_PRESETS, formatOffset, formatPayload, formatStat, formatTime } from './format';

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
      onReset={noop}
      {...overrides}
    />,
  );
}

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
