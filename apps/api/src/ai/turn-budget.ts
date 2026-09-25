import type { AITimeouts } from './config.js';

/**
 * Bounds a chat turn's total AI wait (plan Task 4.4). Each stage gets its own timeout, capped by
 * what is left of the turn, so a slow interpretation shortens the response call instead of
 * making the player wait twice.
 */
export class TurnBudget {
  private readonly deadline: number;

  constructor(
    private readonly timeouts: AITimeouts,
    private readonly now: () => number = () => performance.now(),
  ) {
    this.deadline = now() + timeouts.turnBudgetMs;
  }

  remainingMs(): number {
    return Math.max(0, Math.floor(this.deadline - this.now()));
  }

  /** Timeout for the next call of `kind`; 0 means the budget is spent and the call must not run. */
  timeoutFor(kind: 'INTERPRETATION' | 'RESPONSE'): number {
    const stageMs = kind === 'INTERPRETATION' ? this.timeouts.interpretationMs : this.timeouts.responseMs;
    return Math.min(stageMs, this.remainingMs());
  }
}
