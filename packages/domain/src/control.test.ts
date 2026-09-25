import { describe, expect, it } from 'vitest';

import { FakeClock } from './clock.js';
import { SeededRandom, SequenceRandom } from './random.js';

describe('FakeClock', () => {
  it('controls and advances time deterministically', () => {
    const clock = new FakeClock(new Date('2026-09-25T00:00:00.000Z'));

    clock.advanceBy(60 * 60 * 1_000);

    expect(clock.now().toISOString()).toBe('2026-09-25T01:00:00.000Z');
  });

  it('does not expose mutable internal Date state', () => {
    const clock = new FakeClock(new Date('2026-09-25T00:00:00.000Z'));
    const returned = clock.now();
    returned.setUTCFullYear(2030);

    expect(clock.now().toISOString()).toBe('2026-09-25T00:00:00.000Z');
  });
});

describe('SequenceRandom', () => {
  it('returns a reproducible sequence and fails when exhausted', () => {
    const random = new SequenceRandom([0.1, 0.9]);

    expect(random.next()).toBe(0.1);
    expect(random.next()).toBe(0.9);
    expect(() => random.next()).toThrow('sequence is exhausted');
  });

  it('rejects values outside the random contract', () => {
    expect(() => new SequenceRandom([1])).toThrow('from 0 (inclusive) to 1 (exclusive)');
  });
});

describe('SeededRandom', () => {
  it('reproduces the same sequence for the same seed within the random contract', () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    const values = Array.from({ length: 1_000 }, () => first.next());

    expect(values).toEqual(Array.from({ length: 1_000 }, () => second.next()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new SeededRandom(7).next()).not.toBe(values[0]);
  });
});
