/**
 * Evaluation-only pacing for rate-limited routers (9router quotas reset per model after ~2 min).
 * The app itself never retries this way: a live turn fails fast and the player retries.
 */
export async function retryAfterRateLimit<T>(
  call: () => Promise<T>,
  rateLimited: (result: T) => boolean,
  waitMs: number,
  onWait?: (waitMs: number) => void,
): Promise<T> {
  const first = await call();

  if (waitMs <= 0 || !rateLimited(first)) {
    return first;
  }

  onWait?.(waitMs);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return call();
}
