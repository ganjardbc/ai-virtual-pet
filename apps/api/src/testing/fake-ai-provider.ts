import type {
  AICallKind,
  AIFailureReason,
  AIProvider,
  AIResult,
  AIStructuredRequest,
  AIUsage,
} from '../ai/provider.js';
import { parseStructuredOutput } from '../ai/structured-output.js';

/** What the fake returns for one call. */
export type FakeOutcome =
  /** Validated against the request schema, like real output; a mismatch is MALFORMED_OUTPUT. */
  | { readonly type: 'value'; readonly value: unknown }
  /** Raw model text, parsed exactly like real provider output (fences, junk, bad JSON). */
  | { readonly type: 'raw'; readonly text: string }
  | { readonly type: 'failure'; readonly reason: AIFailureReason; readonly detail?: string }
  /** Stays in flight until `until` resolves, then behaves like `then`. */
  | { readonly type: 'hold'; readonly until: Promise<void>; readonly then: FakeOutcome };

export const fakeOutcome = {
  value: (value: unknown): FakeOutcome => ({ type: 'value', value }),
  raw: (text: string): FakeOutcome => ({ type: 'raw', text }),
  failure: (reason: AIFailureReason, detail?: string): FakeOutcome =>
    detail === undefined ? { type: 'failure', reason } : { type: 'failure', reason, detail },
  /** An in-flight call plus the function that lets it finish. */
  hold(then: FakeOutcome): { outcome: FakeOutcome; release: () => void } {
    let release: () => void = () => undefined;
    const until = new Promise<void>((resolve) => {
      release = resolve;
    });
    return { outcome: { type: 'hold', until, then }, release };
  },
};

export interface FakeUsage {
  readonly latencyMs?: number;
  readonly inputTokens?: number | null;
  readonly outputTokens?: number | null;
}

/**
 * Deterministic AI provider for automated tests (plan Task 4.3). Outcomes are scripted per call
 * kind, so one stage can fail while the other succeeds, and every request is recorded so tests can
 * assert what context reached the model.
 */
export class FakeAIProvider implements AIProvider {
  readonly available = true;
  readonly name = 'fake';
  readonly model = 'fake-model';
  readonly requests: AIStructuredRequest<unknown>[] = [];
  private readonly queues: Record<AICallKind, FakeOutcome[]> = { INTERPRETATION: [], RESPONSE: [] };
  private readonly defaults: Partial<Record<AICallKind, FakeOutcome>> = {};

  constructor(private readonly fakeUsage: FakeUsage = {}) {}

  /** Queues outcomes for the next calls of `kind`, used once each and in order. */
  script(kind: AICallKind, ...outcomes: FakeOutcome[]): this {
    this.queues[kind].push(...outcomes);
    return this;
  }

  /** Outcome for calls of `kind` once its queue is empty. */
  setDefault(kind: AICallKind, outcome: FakeOutcome): this {
    this.defaults[kind] = outcome;
    return this;
  }

  requestsOf(kind: AICallKind): AIStructuredRequest<unknown>[] {
    return this.requests.filter((request) => request.kind === kind);
  }

  async generateStructured<T>(request: AIStructuredRequest<T>): Promise<AIResult<T>> {
    this.requests.push(request as AIStructuredRequest<unknown>);

    if (request.timeoutMs <= 0) {
      // Like the real adapter: a spent turn budget never reaches the model.
      return { ok: false, reason: 'TIMEOUT', detail: 'No time left in the turn budget.', usage: null };
    }

    const outcome = this.queues[request.kind].shift() ?? this.defaults[request.kind];

    if (!outcome) {
      throw new Error(`FakeAIProvider has no scripted ${request.kind} outcome.`);
    }

    return this.resolve(outcome, request);
  }

  private async resolve<T>(outcome: FakeOutcome, request: AIStructuredRequest<T>): Promise<AIResult<T>> {
    const usage: AIUsage = {
      provider: this.name,
      model: this.model,
      latencyMs: this.fakeUsage.latencyMs ?? 0,
      inputTokens: this.fakeUsage.inputTokens === undefined ? 10 : this.fakeUsage.inputTokens,
      outputTokens: this.fakeUsage.outputTokens === undefined ? 5 : this.fakeUsage.outputTokens,
    };

    switch (outcome.type) {
      case 'hold':
        await outcome.until;
        return this.resolve(outcome.then, request);
      case 'failure':
        return {
          ok: false,
          reason: outcome.reason,
          detail: outcome.detail ?? `Fake ${outcome.reason}.`,
          usage: outcome.reason === 'UNAVAILABLE' ? null : usage,
        };
      case 'value':
      case 'raw': {
        const text = outcome.type === 'raw' ? outcome.text : JSON.stringify(outcome.value);
        const parsed = parseStructuredOutput(text, request.schema);
        return parsed.ok
          ? { ok: true, value: parsed.value, usage }
          : { ok: false, reason: 'MALFORMED_OUTPUT', detail: parsed.detail, usage };
      }
    }
  }
}
