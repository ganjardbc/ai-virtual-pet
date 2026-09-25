import { ApplicationError } from './errors.js';

/**
 * At most one chat turn in flight per pet (plan Task 4.7). A second submission is rejected,
 * not queued. In-memory and single-process by design: turn idempotency and optimistic
 * concurrency still protect state across restarts or multiple processes.
 */
export class ChatTurnGuard {
  private readonly inFlight = new Set<string>();

  async run<T>(petId: string, turn: () => Promise<T>): Promise<T> {
    if (this.inFlight.has(petId)) {
      throw new ApplicationError('CHAT_IN_PROGRESS', 'The pet is still answering the previous message.');
    }

    this.inFlight.add(petId);

    try {
      return await turn();
    } finally {
      this.inFlight.delete(petId);
    }
  }

  isBusy(petId: string): boolean {
    return this.inFlight.has(petId);
  }
}
