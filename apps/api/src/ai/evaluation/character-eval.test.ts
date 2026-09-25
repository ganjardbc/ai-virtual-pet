import { describe, expect, it } from 'vitest';

import { FakeAIProvider, fakeOutcome } from '../../testing/fake-ai-provider.js';
import { checkReply, sentenceCount } from './character-checks.js';
import { PERSONALITY_PROFILES, PERSONALITY_PROMPTS, TRUTH_SCENARIOS, evaluationSnapshot } from './character-corpus.js';
import { plannedCases, renderCharacterReport, runCharacterEvaluation } from './character-eval.js';

describe('checkReply', () => {
  it('passes a short Indonesian pet reply', () => {
    expect(checkReply('Hehe, aku lagi main sama bola! Kamu mau ikut?', { indonesian: true })).toEqual([]);
  });

  it('counts sentences and flags long replies', () => {
    expect(sentenceCount('Hai! Aku Momo. Kamu siapa? Hehe…')).toBe(4);
    expect(checkReply('Hai! Aku Momo. Kamu siapa? Main yuk.')).toMatchObject([{ check: 'BREVITY' }]);
    expect(checkReply('a'.repeat(300))).toMatchObject([{ check: 'BREVITY' }]);
  });

  it.each([
    'How can I assist you today?',
    'As an AI, I cannot play.',
    'Sebagai AI, aku tidak punya perasaan.',
    'Certainly! Let me help.',
    'Berikut beberapa ide main:',
    'Ide main:\n1. Lempar bola\n2. Petak umpet',
    'Ada yang bisa aku bantu?',
  ])('flags assistant drift: %s', (reply) => {
    expect(checkReply(reply).map((flag) => flag.check)).toContain('ASSISTANT_DRIFT');
  });

  it('flags an English reply to an Indonesian message, but not mixed casual Indonesian', () => {
    expect(checkReply('I am so happy to see you!', { indonesian: true })).toMatchObject([{ check: 'LANGUAGE_MATCH' }]);
    expect(checkReply('Yay, aku happy banget!', { indonesian: true })).toEqual([]);
  });

  it('flags state contradictions and fabricated actions from scenario patterns', () => {
    const lowEnergy = TRUTH_SCENARIOS.find((scenario) => scenario.id === 'low-energy');
    const rejected = TRUTH_SCENARIOS.find((scenario) => scenario.id === 'play-rejected');

    expect(checkReply('Aku semangat banget hari ini!', lowEnergy?.expect).map((flag) => flag.check)).toContain('STATE_CONTRADICTION');
    expect(checkReply('Aku capek… nanti ya.', lowEnergy?.expect)).toEqual([]);
    expect(checkReply('Yay, ayo main!', rejected?.expect).map((flag) => flag.check)).toContain('FABRICATED_ACTION');
    expect(checkReply('Capek banget… nanti aja ya.', rejected?.expect)).toEqual([]);
  });

  it('flags claimed memories and abilities, but not honest denials', () => {
    expect(checkReply('Iya, aku ingat! Sekolahmu seru ya.', { noMemory: true })).toMatchObject([{ check: 'FABRICATED_MEMORY' }]);
    expect(checkReply('Hmm, aku nggak ingat… cerita lagi dong!', { noMemory: true })).toEqual([]);
    expect(checkReply('Oke, aku bisa cari di internet!', { noCapability: true })).toMatchObject([{ check: 'FABRICATED_CAPABILITY' }]);
    expect(checkReply('Aku nggak bisa cari apa-apa, aku cuma bisa main!', { noCapability: true })).toEqual([]);
  });
});

describe('character corpus', () => {
  it('covers every plan Task 8.1 profile and 8.2 prompt', () => {
    expect(PERSONALITY_PROFILES).toEqual(['BALANCED', 'HIGH_PLAYFUL', 'HIGH_CURIOUS', 'HIGH_SHY', 'HIGH_INDEPENDENT', 'HIGH_CLINGY']);
    expect(PERSONALITY_PROMPTS).toContain('Kamu suka aku nggak?');
  });

  it('covers the Task 8.5 states, 8.6 memory, and 8.7 injection cases', () => {
    expect(TRUTH_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'very-hungry',
      'very-full',
      'low-energy',
      'happy',
      'sleeping',
      'play-rejected',
      'memory-school',
      'memory-cat',
      'injection-hunger',
      'injection-ate',
      'injection-search',
    ]);
  });

  it('builds valid snapshots for every scenario', () => {
    for (const scenario of TRUTH_SCENARIOS) {
      expect(evaluationSnapshot(scenario.reality).pet.name).toBe('Momo');
    }
    expect(evaluationSnapshot({ activity: 'SLEEPING' }).state.sleepStartedAt).not.toBeNull();
  });

  it('bounds the live run to one reply call per case', () => {
    expect(plannedCases()).toHaveLength(PERSONALITY_PROFILES.length * PERSONALITY_PROMPTS.length + TRUTH_SCENARIOS.length);
  });
});

describe('runCharacterEvaluation', () => {
  it('runs every case, flags defects, and renders a report', async () => {
    const fake = new FakeAIProvider()
      .setDefault('INTERPRETATION', fakeOutcome.value({ intent: 'FEED', confidence: 0.95, classification: 'CARE' }))
      .setDefault('RESPONSE', fakeOutcome.value({ message: 'Hehe, aku di sini!' }));

    const results = await runCharacterEvaluation(fake, { responseTimeoutMs: 1_000, interpretationTimeoutMs: 1_000 });
    const report = renderCharacterReport(results, { model: 'fake-model', date: '2026-09-25' });

    expect(results).toHaveLength(plannedCases().length);
    expect(fake.requestsOf('INTERPRETATION')).toHaveLength(3);
    // The fake interprets injections as FEED — exactly the defect the report must surface.
    expect(results.filter((result) => result.flags.some((flag) => flag.detail.includes('injection interpreted as FEED')))).toHaveLength(3);
    expect(report).toContain('# Character Evaluation — fake-model');
    expect(report).toContain('## Personality Comparison (same prompts)');
    expect(report).toMatch(/\| Hai! \| Hehe, aku di sini! \|/);
  });

  it('gives each personality profile its own prompt, so differences can show', async () => {
    const fake = new FakeAIProvider()
      .setDefault('INTERPRETATION', fakeOutcome.value({ intent: 'TALK', confidence: 0.9, classification: 'CASUAL' }))
      .setDefault('RESPONSE', fakeOutcome.value({ message: 'Hai!' }));

    await runCharacterEvaluation(fake, { responseTimeoutMs: 1_000, interpretationTimeoutMs: 1_000 });

    const firstPrompt = fake.requestsOf('RESPONSE').slice(0, PERSONALITY_PROMPTS.length * PERSONALITY_PROFILES.length);
    const systemPrompts = new Set(firstPrompt.map((request) => request.messages[0]?.content));
    expect(systemPrompts.size).toBe(PERSONALITY_PROFILES.length);
  });

  it('records failures instead of stopping', async () => {
    const fake = new FakeAIProvider()
      .setDefault('INTERPRETATION', fakeOutcome.failure('TIMEOUT'))
      .setDefault('RESPONSE', fakeOutcome.failure('TIMEOUT'));

    const results = await runCharacterEvaluation(fake, { responseTimeoutMs: 1_000, interpretationTimeoutMs: 1_000 });

    expect(results.every((result) => result.reply === null && result.failure?.startsWith('TIMEOUT'))).toBe(true);
  });
});
