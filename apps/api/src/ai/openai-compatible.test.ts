import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { OpenAICompatibleProvider } from './openai-compatible.js';
import type { AIStructuredRequest } from './provider.js';

const API_KEY = 'sk-test-secret-key';
const schema = z.object({ intent: z.enum(['PLAY', 'NONE']), confidence: z.number().min(0).max(1) });

interface Received {
  readonly path: string;
  readonly authorization: string | undefined;
  readonly body: Record<string, unknown>;
}

type Handler = (request: IncomingMessage, response: ServerResponse) => void;

/** A real HTTP server standing in for 9router, so fetch, headers, and aborts are exercised. */
let server: Server;
let baseUrl: string;
let handler: Handler;
let received: Received[];
let aborted: number;

function reply(status: number, body: unknown): Handler {
  return (_request, response) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
}

function completion(content: unknown, usage: unknown = { prompt_tokens: 42, completion_tokens: 7 }) {
  return reply(200, { id: 'x', choices: [{ index: 0, message: { role: 'assistant', content } }], usage });
}

function provider(overrides: { jsonMode?: boolean; baseUrl?: string } = {}) {
  return new OpenAICompatibleProvider({
    baseUrl: overrides.baseUrl ?? `${baseUrl}/v1/`,
    model: 'router/test-model',
    apiKey: API_KEY,
    jsonMode: overrides.jsonMode ?? false,
  });
}

function request(overrides: Partial<AIStructuredRequest<z.infer<typeof schema>>> = {}) {
  return {
    kind: 'INTERPRETATION' as const,
    messages: [
      { role: 'system' as const, content: 'Return JSON.' },
      { role: 'user' as const, content: 'Main yuk!' },
    ],
    schema,
    timeoutMs: 2_000,
    ...overrides,
  };
}

beforeAll(async () => {
  server = createServer((incoming, response) => {
    let raw = '';
    incoming.on('data', (chunk: Buffer) => {
      raw += chunk.toString();
    });
    incoming.on('end', () => {
      received.push({
        path: incoming.url ?? '',
        authorization: incoming.headers.authorization,
        body: JSON.parse(raw || '{}') as Record<string, unknown>,
      });
      response.on('close', () => {
        if (!response.writableFinished) {
          aborted += 1;
        }
      });
      handler(incoming, response);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  received = [];
  aborted = 0;
  handler = completion('{"intent":"PLAY","confidence":0.95}');
});

describe('OpenAICompatibleProvider', () => {
  it('posts a Chat Completions request and returns validated output with usage', async () => {
    const result = await provider().generateStructured(request({ maxOutputTokens: 80, temperature: 0.2 }));

    expect(result).toMatchObject({
      ok: true,
      value: { intent: 'PLAY', confidence: 0.95 },
      usage: { provider: 'openai-compatible', model: 'router/test-model', inputTokens: 42, outputTokens: 7 },
    });
    expect(result.ok && result.usage.latencyMs).toBeGreaterThanOrEqual(0);
    expect(received).toEqual([
      {
        path: '/v1/chat/completions',
        authorization: `Bearer ${API_KEY}`,
        body: {
          model: 'router/test-model',
          stream: false,
          messages: [
            { role: 'system', content: 'Return JSON.' },
            { role: 'user', content: 'Main yuk!' },
          ],
          max_tokens: 80,
          temperature: 0.2,
        },
      },
    ]);
  });

  it('does not use provider-specific features unless JSON mode is enabled', async () => {
    await provider().generateStructured(request());
    await provider({ jsonMode: true }).generateStructured(request());

    expect(received[0]?.body).not.toHaveProperty('response_format');
    expect(received[0]?.body).not.toHaveProperty('tools');
    expect(received[1]?.body).toMatchObject({ response_format: { type: 'json_object' } });
  });

  it('accepts JSON wrapped in a markdown fence or preceded by text', async () => {
    handler = completion('```json\n{"intent":"NONE","confidence":0.3}\n```');
    expect(await provider().generateStructured(request())).toMatchObject({ ok: true, value: { intent: 'NONE' } });

    handler = completion('Here you go: {"intent":"PLAY","confidence":0.9}');
    expect(await provider().generateStructured(request())).toMatchObject({ ok: true, value: { intent: 'PLAY' } });
  });

  it('assembles a streamed (server-sent events) response when the endpoint streams anyway', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      for (const piece of ['{"intent":', '"PLAY","confidence"', ':0.9}']) {
        response.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: piece } }] })}\n\n`);
      }
      response.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {} }], usage: { prompt_tokens: 12, completion_tokens: 4 } })}\n\n`);
      response.end('data: [DONE]\n\n');
    };

    expect(await provider().generateStructured(request())).toMatchObject({
      ok: true,
      value: { intent: 'PLAY', confidence: 0.9 },
      usage: { inputTokens: 12, outputTokens: 4 },
    });
  });

  it('reports MALFORMED_OUTPUT for a broken stream', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.end('data: {not json\n\n');
    };

    expect(await provider().generateStructured(request())).toMatchObject({ ok: false, reason: 'MALFORMED_OUTPUT' });
  });

  it('treats missing usage as unknown, not as an error', async () => {
    handler = completion('{"intent":"PLAY","confidence":0.9}', null);

    expect(await provider().generateStructured(request())).toMatchObject({
      ok: true,
      usage: { inputTokens: null, outputTokens: null },
    });
  });

  it.each([
    ['text that is not JSON', completion('Sure! Let us play.')],
    ['JSON that fails the schema', completion('{"intent":"SEARCH","confidence":0.99}')],
    ['a confidence out of range', completion('{"intent":"PLAY","confidence":1.5}')],
    ['a response without message content', reply(200, { choices: [] })],
    ['a non-JSON response body', reply(200, '<html>oops</html>')],
  ])('reports MALFORMED_OUTPUT for %s', async (_label, malformed) => {
    handler = malformed;

    expect(await provider().generateStructured(request())).toMatchObject({ ok: false, reason: 'MALFORMED_OUTPUT' });
  });

  it.each([401, 429, 500, 503])('reports PROVIDER_ERROR for HTTP %i without echoing the body', async (status) => {
    handler = reply(status, { error: { message: `echo ${API_KEY}` } });

    const result = await provider().generateStructured(request());

    expect(result).toMatchObject({ ok: false, reason: 'PROVIDER_ERROR', detail: `Provider responded ${status}.` });
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it('reports PROVIDER_ERROR when the endpoint cannot be reached', async () => {
    const unreachable = provider({ baseUrl: 'http://127.0.0.1:1' });

    const result = await unreachable.generateStructured(request());

    expect(result).toMatchObject({ ok: false, reason: 'PROVIDER_ERROR', usage: null });
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it('times out, aborts the request, and never hangs', async () => {
    handler = () => undefined; // Never responds.

    const startedAt = performance.now();
    const result = await provider().generateStructured(request({ timeoutMs: 150 }));
    const elapsed = performance.now() - startedAt;

    expect(result).toMatchObject({ ok: false, reason: 'TIMEOUT' });
    expect(elapsed).toBeLessThan(1_000);
    await expect.poll(() => aborted).toBe(1);
  });

  it('times out while the response body is still streaming', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"choices":'); // Never finishes the body.
    };

    expect(await provider().generateStructured(request({ timeoutMs: 150 }))).toMatchObject({
      ok: false,
      reason: 'TIMEOUT',
    });
  });

  it('does not call the endpoint when no time is left', async () => {
    expect(await provider().generateStructured(request({ timeoutMs: 0 }))).toMatchObject({
      ok: false,
      reason: 'TIMEOUT',
    });
    expect(received).toEqual([]);
  });
});
