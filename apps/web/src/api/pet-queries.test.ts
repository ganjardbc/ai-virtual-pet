import { describe, expect, it } from 'vitest';

import { makeSnapshot } from '../testing/snapshot';
import { newestSnapshot } from './pet-queries';

describe('newestSnapshot', () => {
  const v5 = makeSnapshot({ pet: { version: 5 } });
  const v4 = makeSnapshot({ pet: { version: 4 } });

  it('keeps the newer snapshot when an older response arrives late', () => {
    expect(newestSnapshot(v5, v4)).toBe(v5);
    expect(newestSnapshot(v4, v5)).toBe(v5);
  });

  it('accepts an equal version (a read with no new commit)', () => {
    const refreshed = makeSnapshot({ pet: { version: 5 } });
    expect(newestSnapshot(v5, refreshed)).toBe(refreshed);
  });

  it('accepts a reset (no pet) and a different pet regardless of version', () => {
    const otherPet = makeSnapshot({ pet: { id: 'pet-2', version: 0 } });

    expect(newestSnapshot(v5, null)).toBeNull();
    expect(newestSnapshot(v5, otherPet)).toBe(otherPet);
    expect(newestSnapshot(undefined, v4)).toBe(v4);
  });
});
