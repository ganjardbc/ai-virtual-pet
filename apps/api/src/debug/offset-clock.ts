import type { Clock } from '@ai-virtual-pet/domain';

/**
 * Development clock: the base clock shifted forward by an offset. Time travel only ever
 * moves the offset, so the normal simulation path produces the resulting pet state.
 */
export class OffsetClock implements Clock {
  private offset = 0;

  constructor(private readonly base: Clock) {}

  now(): Date {
    return new Date(this.base.now().getTime() + this.offset);
  }

  get offsetMs(): number {
    return this.offset;
  }

  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      throw new RangeError('Debug clock can only move forward by a positive finite duration.');
    }

    this.offset += milliseconds;
  }

  /** Moves forward (never back) so that `now()` is at least `time`. Used after a restart. */
  catchUpTo(time: Date): void {
    const gap = time.getTime() - this.now().getTime();

    if (gap > 0) {
      this.offset += gap;
    }
  }

  reset(): void {
    this.offset = 0;
  }
}
