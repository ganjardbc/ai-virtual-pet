import type { ZodType } from 'zod';

/**
 * Provider-independent AI boundary (DEC-049). Application code depends only on these types;
 * provider wire formats stay inside adapters. The AI interprets and performs; it never decides
 * game state (DEC-002).
 */

/** Which stage of a chat turn a call serves. Timeouts and test scripting are per kind. */
export type AICallKind = 'INTERPRETATION' | 'RESPONSE';

export interface AIMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface AIStructuredRequest<T> {
  readonly kind: AICallKind;
  readonly messages: readonly AIMessage[];
  /** Output must parse as JSON and validate against this schema, or the call fails. */
  readonly schema: ZodType<T>;
  readonly timeoutMs: number;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
}

export interface AIUsage {
  readonly provider: string;
  readonly model: string;
  readonly latencyMs: number;
  /** Null when the provider does not report usage. */
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
}

/**
 * Controlled failure kinds. Callers fall back deterministically; none of them may change game
 * state or be shown to the player as the pet's own words.
 */
export type AIFailureReason =
  | 'UNAVAILABLE' // not configured (no key / URL / model)
  | 'TIMEOUT'
  | 'PROVIDER_ERROR' // network failure or non-2xx response
  | 'MALFORMED_OUTPUT'; // not JSON, or JSON that fails the schema

export type AIResult<T> =
  | { readonly ok: true; readonly value: T; readonly usage: AIUsage }
  | {
      readonly ok: false;
      readonly reason: AIFailureReason;
      /** Diagnostic detail for logs and debug views. Never contains credentials. */
      readonly detail: string;
      /** Present when the provider was reached. */
      readonly usage: AIUsage | null;
    };

export interface AIProvider {
  /** Whether calls can succeed at all; false means every call fails with UNAVAILABLE. */
  readonly available: boolean;
  readonly name: string;
  readonly model: string;
  generateStructured<T>(request: AIStructuredRequest<T>): Promise<AIResult<T>>;
}

/** Used when no provider is configured: the pet stays a working game without AI (plan Task 11.3). */
export class UnavailableAIProvider implements AIProvider {
  readonly available = false;
  readonly model = 'none';

  constructor(
    readonly name: string,
    private readonly reason: string,
  ) {}

  async generateStructured<T>(): Promise<AIResult<T>> {
    return { ok: false, reason: 'UNAVAILABLE', detail: this.reason, usage: null };
  }
}
