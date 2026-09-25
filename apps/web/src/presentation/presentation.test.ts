import type { ActionResult } from '@ai-virtual-pet/contracts';
import { describe, expect, it } from 'vitest';

import { makeEvent, makeSnapshot } from '../testing/snapshot';
import { idleReaction, reactionForAction, returnReaction } from './reactions';
import { recapItems } from './recap';
import { timeOfDay } from './time-of-day';
import { visualFromSnapshot } from './visual';

const success = (type: 'FEED' | 'PLAY' | 'SLEEP', changes: Partial<Record<'hunger' | 'energy' | 'happiness' | 'bond', number>>): ActionResult => ({
  status: 'SUCCESS',
  action: { type },
  changes: { hunger: 0, energy: 0, happiness: 0, bond: 0, ...changes },
  pet: makeSnapshot(),
});

const rejected = (type: 'FEED' | 'PLAY', reason: 'TOO_TIRED' | 'TOO_FULL'): ActionResult => ({
  status: 'REJECTED',
  action: { type },
  reason,
  pet: makeSnapshot(),
});

describe('visualFromSnapshot', () => {
  it('shows sleeping on the bed above everything else', () => {
    const snapshot = makeSnapshot({
      state: { currentActivity: 'SLEEPING', sleepStartedAt: '2026-09-25T11:00:00.000Z' },
      derived: { mood: 'HUNGRY', needs: { fullness: 'VERY_HUNGRY' } },
    });

    expect(visualFromSnapshot(snapshot)).toEqual({ expression: 'sleeping', pose: 'bed', motion: 'slow' });
  });

  it('puts urgent needs above autonomous activity', () => {
    const snapshot = makeSnapshot({ state: { currentActivity: 'PLAYING_ALONE' }, derived: { mood: 'HUNGRY' } });

    expect(visualFromSnapshot(snapshot).expression).toBe('hungry');
    expect(visualFromSnapshot(makeSnapshot({ derived: { needs: { energy: 'EXHAUSTED' } } })).expression).toBe('tired');
    expect(visualFromSnapshot(makeSnapshot({ derived: { mood: 'SLEEPY' } })).expression).toBe('sleepy');
  });

  it.each([
    ['PLAYING_ALONE', 'excited', 'toy'],
    ['RESTING', 'content', 'bed'],
    ['LOOKING_AROUND', 'curious', 'center'],
    ['WAITING', 'neutral', 'center'],
  ] as const)('gives %s a distinct look', (activity, expression, pose) => {
    expect(visualFromSnapshot(makeSnapshot({ state: { currentActivity: activity } }))).toMatchObject({ expression, pose });
  });

  it('falls back to mood', () => {
    expect(visualFromSnapshot(makeSnapshot({ derived: { mood: 'HAPPY' } })).expression).toBe('happy');
    expect(visualFromSnapshot(makeSnapshot({ derived: { mood: 'EXCITED' } })).motion).toBe('bounce');
  });
});

describe('reactionForAction', () => {
  it('eats happily for a full meal and less enthusiastically when nearly full', () => {
    expect(reactionForAction(success('FEED', { hunger: 25 }))).toMatchObject({ text: 'Nyam!', visual: { expression: 'eating' } });
    expect(reactionForAction(success('FEED', { hunger: 10 })).text).toBe('Udah mulai kenyang…');
  });

  it('refuses in character, never with a technical code', () => {
    const tired = reactionForAction(rejected('PLAY', 'TOO_TIRED'));
    const full = reactionForAction(rejected('FEED', 'TOO_FULL'));

    expect(tired).toMatchObject({ kind: 'speech', text: 'Aku capek banget…', visual: { expression: 'tired' } });
    expect(full.text).toBe('Aku udah kenyang…');
    expect(JSON.stringify([tired, full])).not.toMatch(/TOO_|ERROR/);
  });

  it('gets excited by Play and settles when Play is repeated a lot', () => {
    expect(reactionForAction(success('PLAY', { happiness: 12 })).text).toBe('Lagi! Lagi!');
    expect(reactionForAction(success('PLAY', { happiness: 3 })).text).toBe('Seru juga.');
  });

  it('says goodnight when put to sleep', () => {
    expect(reactionForAction(success('SLEEP', { bond: 0.1 }))).toMatchObject({ visual: { expression: 'sleeping', pose: 'bed' } });
  });
});

describe('idleReaction', () => {
  it('prioritizes sleeping, then urgent needs, then activity, then mood', () => {
    const sleeping = makeSnapshot({ state: { currentActivity: 'SLEEPING', sleepStartedAt: '2026-09-25T11:00:00.000Z' } });

    expect(idleReaction(sleeping)).toEqual({ kind: 'narration', text: 'Sedang tidur…' });
    expect(idleReaction(makeSnapshot({ state: { currentActivity: 'PLAYING_ALONE' }, derived: { needs: { fullness: 'VERY_HUNGRY' } } })).text).toBe('Aku lapar banget.');
    expect(idleReaction(makeSnapshot({ state: { currentActivity: 'RESTING' }, derived: { mood: 'HAPPY' } }))).toEqual({ kind: 'narration', text: 'Beristirahat' });
    expect(idleReaction(makeSnapshot({ derived: { mood: 'HAPPY' } })).text).toBe('Aku lagi senang.');
  });
});

describe('returnReaction', () => {
  it('greets without moralizing the absence', () => {
    expect(returnReaction(makeSnapshot()).text).toBe('Kamu balik!');
    expect(returnReaction(makeSnapshot({ derived: { needs: { fullness: 'VERY_HUNGRY' } } })).text).toBe(
      'Kamu balik! Aku lapar banget.',
    );
  });
});

describe('recapItems', () => {
  const since = '2026-09-25T00:00:00.000Z';

  it('lists only autonomous things that happened after the last visit, deduplicated, max 3', () => {
    const events = [
      makeEvent('PET_ACTIVITY_CHANGED', '2026-09-24T23:00:00.000Z', { from: 'IDLE', to: 'RESTING' }),
      makeEvent('PET_ACTIVITY_CHANGED', '2026-09-25T01:00:00.000Z', { from: 'IDLE', to: 'PLAYING_ALONE' }),
      makeEvent('PET_ACTIVITY_CHANGED', '2026-09-25T02:00:00.000Z', { from: 'PLAYING_ALONE', to: 'LOOKING_AROUND' }),
      makeEvent('PET_ACTIVITY_CHANGED', '2026-09-25T03:00:00.000Z', { from: 'LOOKING_AROUND', to: 'PLAYING_ALONE' }),
      makeEvent('PET_STARTED_SLEEPING', '2026-09-25T04:00:00.000Z', { source: 'AUTONOMOUS' }),
      makeEvent('PET_STARTED_SLEEPING', '2026-09-25T05:00:00.000Z', { source: 'PLAYER' }),
      makeEvent('PET_ACTIVITY_CHANGED', '2026-09-25T06:00:00.000Z', { from: 'IDLE', to: 'RESTING' }),
      makeEvent('ACTION_REJECTED', '2026-09-25T07:00:00.000Z', { action: 'PLAY', reason: 'TOO_TIRED' }),
    ];

    expect(recapItems(events, since)).toEqual(['Bermain sendiri', 'Melihat-lihat', 'Sempat tidur']);
  });

  it('summarizes repeated naps and returns nothing when nothing happened', () => {
    const naps = [1, 2].map((hour) => makeEvent('PET_STARTED_SLEEPING', `2026-09-25T0${hour}:00:00.000Z`, { source: 'AUTONOMOUS' }));

    expect(recapItems(naps, since)).toEqual(['Tidur beberapa kali']);
    expect(recapItems([], since)).toEqual([]);
    expect(recapItems([makeEvent('PET_STARTED_SLEEPING', '2026-09-25T01:00:00.000Z', { source: 'DEBUG' })], since)).toEqual([]);
  });
});

describe('timeOfDay', () => {
  it.each([
    [6, 'dawn'],
    [12, 'day'],
    [18, 'dusk'],
    [23, 'night'],
    [3, 'night'],
  ] as const)('maps local hour %i to %s', (hour, expected) => {
    const local = new Date(2026, 8, 25, hour, 30);
    expect(timeOfDay(local.toISOString())).toBe(expected);
  });
});
