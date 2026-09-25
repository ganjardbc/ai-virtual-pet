import { requireValidDate } from './primitives.js';

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FakeClock implements Clock {
  private currentTimeMs: number;

  constructor(initialTime: Date) {
    this.currentTimeMs = requireValidDate(initialTime, 'initialTime').getTime();
  }

  now(): Date {
    return new Date(this.currentTimeMs);
  }

  set(time: Date): void {
    this.currentTimeMs = requireValidDate(time, 'time').getTime();
  }

  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new RangeError('Clock advance must be a non-negative finite number.');
    }

    this.currentTimeMs += milliseconds;
  }
}
