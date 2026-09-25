import { FakeClock, SeededRandom } from '@ai-virtual-pet/domain';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildApp } from '../app.js';
import { ChatTurnGuard } from '../application/chat-guard.js';
import { ApplicationError } from '../application/errors.js';
import { InMemoryStore } from '../persistence/memory.js';
import { FakeAIProvider, fakeOutcome } from '../testing/fake-ai-provider.js';
import { DEFAULT_AI_TIMEOUTS, createAIProvider, loadAIConfig } from './config.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { parseStructuredOutput } from './structured-output.js';
import { TurnBudget } from './turn-budget.js';

const configured = { AI_BASE_URL: 'http://router.local/v1', AI_MODEL: 'router/model', AI_API_KEY: 'key' };
const schema = z.object({ message: z.string().min(1) });
const call = (kind: 'INTERPRETATION' | 'RESPONSE') => ({ kind, messages: [], schema, timeoutMs: 1_000 });

describe('loadAIConfig', () => {
  it('defaults to the OpenAI-compatible provider with the plan timeouts', () => {
    expect(loadAIConfig({})).toEqual({
      provider: 'openai-compatible',
      baseUrl: undefined,
      model: undefined,
      apiKey: undefined,
      jsonMode: false,
      timeouts: DEFAULT_AI_TIMEOUTS,
    });
    expect(DEFAULT_AI_TIMEOUTS).toEqual({ interpretationMs: 5_000, responseMs: 10_000, turnBudgetMs: 15_000 });
  });

  it('reads every setting', () => {
    expect(
      loadAIConfig({
        ...configured,
        AI_PROVIDER: 'openai-compatible',
        AI_JSON_MODE: 'TRUE',
        AI_INTERPRETATION_TIMEOUT_MS: '3000',
        AI_RESPONSE_TIMEOUT_MS: '8000',
        AI_TURN_BUDGET_MS: '12000',
      }),
    ).toEqual({
      provider: 'openai-compatible',
      baseUrl: 'http://router.local/v1',
      model: 'router/model',
      apiKey: 'key',
      jsonMode: true,
      timeouts: { interpretationMs: 3_000, responseMs: 8_000, turnBudgetMs: 12_000 },
    });
  });

  it.each([
    ['an unknown provider', { AI_PROVIDER: 'anthropic-native' }, /AI_PROVIDER/],
    ['a non-numeric timeout', { AI_RESPONSE_TIMEOUT_MS: 'ten' }, /AI_RESPONSE_TIMEOUT_MS/],
    ['a zero budget', { AI_TURN_BUDGET_MS: '0' }, /AI_TURN_BUDGET_MS/],
    ['an invalid JSON mode flag', { AI_JSON_MODE: 'yes' }, /AI_JSON_MODE/],
  ])('fails startup for %s', (_label, env, message) => {
    expect(() => loadAIConfig(env)).toThrow(message);
  });
});

describe('createAIProvider', () => {
  it('builds the OpenAI-compatible adapter when fully configured', () => {
    const provider = createAIProvider(loadAIConfig(configured));

    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
    expect(provider).toMatchObject({ available: true, name: 'openai-compatible', model: 'router/model' });
  });

  it.each(['AI_BASE_URL', 'AI_MODEL', 'AI_API_KEY'] as const)(
    'is unavailable without %s, and every call fails with UNAVAILABLE',
    async (missing) => {
      const provider = createAIProvider(loadAIConfig({ ...configured, [missing]: '  ' }));

      expect(provider.available).toBe(false);
      expect(await provider.generateStructured(call('RESPONSE'))).toEqual({
        ok: false,
        reason: 'UNAVAILABLE',
        detail: `Not configured: ${missing}.`,
        usage: null,
      });
    },
  );

  it('lets the API start and serve care actions with no AI configured', async () => {
    const store = new InMemoryStore();
    expect(createAIProvider(loadAIConfig({})).available).toBe(false);
    const app = buildApp({
      pets: store,
      events: store,
      conversations: store,
      clock: new FakeClock(new Date('2026-09-25T08:00:00.000Z')),
      random: new SeededRandom(1),
    });

    await app.inject({ method: 'POST', url: '/api/v1/pet' });
    await app.inject({ method: 'POST', url: '/api/v1/pet/hatch' });
    const fed = await app.inject({ method: 'POST', url: '/api/v1/pet/actions', payload: { type: 'FEED' } });

    expect(fed.statusCode).toBe(200);
    await app.close();
  });
});

describe('parseStructuredOutput', () => {
  it.each([
    ['plain JSON', '{"message":"Hai"}'],
    ['a json fence', '```json\n{"message":"Hai"}\n```'],
    ['a bare fence', '```\n{"message":"Hai"}\n```'],
    ['surrounding whitespace', '\n  {"message":"Hai"}  \n'],
  ])('accepts %s', (_label, text) => {
    expect(parseStructuredOutput(text, schema)).toEqual({ ok: true, value: { message: 'Hai' } });
  });

  it('rejects instead of repairing', () => {
    expect(parseStructuredOutput('{"message": ""}', schema)).toMatchObject({ ok: false });
    expect(parseStructuredOutput('{"message": "Hai"', schema)).toEqual({ ok: false, detail: 'Output is not JSON.' });
    expect(parseStructuredOutput('null', schema)).toMatchObject({ ok: false });
  });
});

describe('TurnBudget', () => {
  it('caps each stage by what is left of the turn', () => {
    let now = 0;
    const budget = new TurnBudget(DEFAULT_AI_TIMEOUTS, () => now);

    expect(budget.timeoutFor('INTERPRETATION')).toBe(5_000);
    now = 4_000; // Interpretation took 4 s.
    expect(budget.timeoutFor('RESPONSE')).toBe(10_000);
    now = 9_000; // A slow interpretation leaves only 6 s for the response.
    expect(budget.timeoutFor('RESPONSE')).toBe(6_000);
    now = 16_000;
    expect(budget.remainingMs()).toBe(0);
    expect(budget.timeoutFor('RESPONSE')).toBe(0);
  });
});

describe('ChatTurnGuard', () => {
  it('rejects a second turn for the same pet while one is in flight', async () => {
    const guard = new ChatTurnGuard();
    const { outcome, release } = fakeOutcome.hold(fakeOutcome.value({ message: 'Hai' }));
    const fake = new FakeAIProvider().script('RESPONSE', outcome);

    const first = guard.run('pet-1', () => fake.generateStructured(call('RESPONSE')));
    const second = guard.run('pet-1', async () => 'should not run');

    await expect(second).rejects.toMatchObject({ code: 'CHAT_IN_PROGRESS' });
    await expect(second).rejects.toBeInstanceOf(ApplicationError);
    expect(guard.isBusy('pet-1')).toBe(true);
    expect(await guard.run('pet-2', async () => 'other pet')).toBe('other pet');

    release();
    expect(await first).toMatchObject({ ok: true });
    expect(guard.isBusy('pet-1')).toBe(false);
  });

  it('releases after a provider failure, a timeout, or a thrown error', async () => {
    const guard = new ChatTurnGuard();
    const fake = new FakeAIProvider().script(
      'RESPONSE',
      fakeOutcome.failure('PROVIDER_ERROR'),
      fakeOutcome.failure('TIMEOUT'),
    );

    expect(await guard.run('pet-1', () => fake.generateStructured(call('RESPONSE')))).toMatchObject({
      reason: 'PROVIDER_ERROR',
    });
    expect(await guard.run('pet-1', () => fake.generateStructured(call('RESPONSE')))).toMatchObject({
      reason: 'TIMEOUT',
    });
    await expect(
      guard.run('pet-1', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(guard.isBusy('pet-1')).toBe(false);
    expect(await guard.run('pet-1', async () => 'next turn')).toBe('next turn');
  });
});

describe('FakeAIProvider', () => {
  it('scripts outcomes per call kind and records every request', async () => {
    const fake = new FakeAIProvider()
      .script('INTERPRETATION', fakeOutcome.failure('TIMEOUT'))
      .setDefault('RESPONSE', fakeOutcome.value({ message: 'Yay!' }));

    expect(await fake.generateStructured(call('INTERPRETATION'))).toMatchObject({ ok: false, reason: 'TIMEOUT' });
    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({ ok: true, value: { message: 'Yay!' } });
    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({ ok: true });
    expect(fake.requestsOf('RESPONSE')).toHaveLength(2);
    expect(fake.requests.map((request) => request.kind)).toEqual(['INTERPRETATION', 'RESPONSE', 'RESPONSE']);
  });

  it('validates scripted values and raw text like real output', async () => {
    const fake = new FakeAIProvider().script(
      'RESPONSE',
      fakeOutcome.value({ message: '' }),
      fakeOutcome.raw('```json\n{"message":"Hai"}\n```'),
      fakeOutcome.raw('not json'),
    );

    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({ reason: 'MALFORMED_OUTPUT' });
    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({ ok: true, value: { message: 'Hai' } });
    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({ reason: 'MALFORMED_OUTPUT' });
  });

  it('reports configured usage metadata', async () => {
    const fake = new FakeAIProvider({ latencyMs: 250, inputTokens: null }).setDefault(
      'RESPONSE',
      fakeOutcome.value({ message: 'Hai' }),
    );

    expect(await fake.generateStructured(call('RESPONSE'))).toMatchObject({
      usage: { provider: 'fake', model: 'fake-model', latencyMs: 250, inputTokens: null, outputTokens: 5 },
    });
  });

  it('fails loudly when a test forgets to script a call', async () => {
    await expect(new FakeAIProvider().generateStructured(call('INTERPRETATION'))).rejects.toThrow(/no scripted/);
  });
});
