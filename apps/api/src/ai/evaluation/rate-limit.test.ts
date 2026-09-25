import { describe, expect, it, vi } from 'vitest';

import { retryAfterRateLimit } from './rate-limit.js';

describe('retryAfterRateLimit', () => {
  it('returns the first result when it is not rate limited', async () => {
    const call = vi.fn(async () => 'ok');

    expect(await retryAfterRateLimit(call, (result) => result === 'limited', 50)).toBe('ok');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('waits and retries exactly once when rate limited', async () => {
    const results = ['limited', 'limited', 'ok'];
    const call = vi.fn(async () => results.shift());
    const onWait = vi.fn();

    expect(await retryAfterRateLimit(call, (result) => result === 'limited', 5, onWait)).toBe('limited');
    expect(call).toHaveBeenCalledTimes(2);
    expect(onWait).toHaveBeenCalledWith(5);
  });

  it('does not retry when waiting is disabled', async () => {
    const call = vi.fn(async () => 'limited');

    await retryAfterRateLimit(call, () => true, 0);

    expect(call).toHaveBeenCalledTimes(1);
  });
});
