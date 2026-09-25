import type { ApiErrorCode } from '@ai-virtual-pet/contracts';

/** An expected, client-facing failure. The HTTP layer maps `code` to a status. */
export class ApplicationError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
