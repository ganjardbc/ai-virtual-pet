import type { AIProvider, AIResult, AIStructuredRequest, AIUsage } from './provider.js';
import { parseStructuredOutput } from './structured-output.js';

export const OPENAI_COMPATIBLE = 'openai-compatible';

const DEFAULT_MAX_OUTPUT_TOKENS = 300;

export interface OpenAICompatibleConfig {
  /** e.g. the 9router endpoint, ending before `/chat/completions`. */
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  /** Sends `response_format: { type: "json_object" }` (not every routed model supports it). */
  readonly jsonMode: boolean;
}

export interface OpenAICompatibleDependencies {
  readonly fetch?: typeof fetch;
  /** Monotonic milliseconds, for latency. */
  readonly now?: () => number;
}

/** The subset of the Chat Completions response this adapter reads. */
interface ChatCompletionResponse {
  readonly choices?: readonly { readonly message?: { readonly content?: unknown } }[];
  readonly usage?: { readonly prompt_tokens?: unknown; readonly completion_tokens?: unknown };
}

/**
 * One adapter for any OpenAI-compatible Chat Completions endpoint, such as 9router (DEC-061).
 * Deliberately avoids provider-specific features (strict JSON schema, tool calling): JSON is
 * requested in the prompt and validated here. Every failure becomes a controlled result.
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly available = true;
  readonly name = OPENAI_COMPATIBLE;
  readonly model: string;
  private readonly endpoint: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;

  constructor(
    private readonly config: OpenAICompatibleConfig,
    deps: OpenAICompatibleDependencies = {},
  ) {
    this.model = config.model;
    this.endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    this.fetch = deps.fetch ?? globalThis.fetch;
    this.now = deps.now ?? (() => performance.now());
  }

  async generateStructured<T>(request: AIStructuredRequest<T>): Promise<AIResult<T>> {
    const startedAt = this.now();
    const usage = (body?: ChatCompletionResponse): AIUsage => ({
      provider: this.name,
      model: this.model,
      latencyMs: Math.round(this.now() - startedAt),
      inputTokens: tokenCount(body?.usage?.prompt_tokens),
      outputTokens: tokenCount(body?.usage?.completion_tokens),
    });

    if (request.timeoutMs <= 0) {
      return { ok: false, reason: 'TIMEOUT', detail: 'No time left in the turn budget.', usage: null };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await this.fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify(this.requestBody(request)),
        signal: controller.signal,
      });

      if (!response.ok) {
        // The body may echo request content, so only the status is reported.
        return { ok: false, reason: 'PROVIDER_ERROR', detail: `Provider responded ${response.status}.`, usage: usage() };
      }

      const body = (await response.json()) as ChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content;

      if (typeof content !== 'string') {
        return { ok: false, reason: 'MALFORMED_OUTPUT', detail: 'Response has no message content.', usage: usage(body) };
      }

      const parsed = parseStructuredOutput(content, request.schema);

      return parsed.ok
        ? { ok: true, value: parsed.value, usage: usage(body) }
        : { ok: false, reason: 'MALFORMED_OUTPUT', detail: parsed.detail, usage: usage(body) };
    } catch (error) {
      if (controller.signal.aborted) {
        return { ok: false, reason: 'TIMEOUT', detail: `No response within ${request.timeoutMs} ms.`, usage: usage() };
      }

      if (error instanceof SyntaxError) {
        return { ok: false, reason: 'MALFORMED_OUTPUT', detail: 'Response body is not JSON.', usage: usage() };
      }

      return { ok: false, reason: 'PROVIDER_ERROR', detail: `Request failed: ${errorName(error)}.`, usage: null };
    } finally {
      clearTimeout(timer);
    }
  }

  private requestBody<T>(request: AIStructuredRequest<T>) {
    return {
      model: this.model,
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      max_tokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
      ...(this.config.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };
  }
}

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Error class/code only: messages from network stacks can include URLs or headers. */
function errorName(error: unknown): string {
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause;
  return typeof cause?.code === 'string' ? cause.code : error instanceof Error ? error.name : 'unknown error';
}
