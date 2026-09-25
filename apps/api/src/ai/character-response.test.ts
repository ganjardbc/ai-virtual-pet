import { describe, expect, it } from 'vitest';

import { FakeAIProvider, fakeOutcome } from '../testing/fake-ai-provider.js';
import { buildCharacterResponseMessages, generateCharacterResponse, turnResultDescription } from './character-response.js';
import type { AICharacterContext } from './context.js';

const context: AICharacterContext = {
  pet: { name: 'Momo', stage: 'BABY' },
  reality: { activity: 'IDLE', asleep: false, mood: 'HAPPY', fullness: 'OKAY', energy: 'TIRED', happiness: 'HAPPY' },
  personality: {
    playful: 'high',
    curious: 'moderate',
    shy: 'moderate',
    independent: 'moderate',
    clingy: 'moderate',
    dominantTraits: ['PLAYFUL'],
    primaryTrait: 'PLAYFUL',
    strength: 'STRONG',
    socialStyle: 'BALANCED',
  },
  relationship: 'DEVELOPING',
  recentMessages: [{ role: 'ASSISTANT', content: 'Halo!' }],
  recentEvents: [],
  currentMessage: 'Main yuk!',
  usage: { approxChars: 14, approxTokens: 4, messagesIncluded: 1, messagesDropped: 0, eventsIncluded: 0, eventsDropped: 0 },
};

describe('turnResultDescription', () => {
  it.each([
    [null, /no action happened — nothing was eaten, played, or slept/],
    [{ type: 'FEED', status: 'SUCCESS' }, /offered you food, and you ate/],
    [{ type: 'PLAY', status: 'SUCCESS' }, /invited you to play, and you played together/],
    [{ type: 'SLEEP', status: 'SUCCESS' }, /go to sleep, and you are going to sleep now/],
    [{ type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' }, /too tired, so you did NOT play.*do not pretend/],
    [{ type: 'FEED', status: 'REJECTED', reason: 'TOO_FULL' }, /too full, so you did NOT eat/],
    [{ type: 'SLEEP', status: 'REJECTED', reason: 'INVALID_STATE' }, /could not happen right now, so you did NOT go to sleep/],
  ] as const)('states the authoritative outcome for %j', (action, expected) => {
    expect(turnResultDescription(action)).toMatch(expected);
  });
});

describe('buildCharacterResponseMessages', () => {
  const messages = buildCharacterResponseMessages(context, { type: 'PLAY', status: 'REJECTED', reason: 'TOO_TIRED' });
  const system = messages[0]?.content ?? '';

  it('puts contract, reality, personality, this turn, then reply rules in the system message', () => {
    const order = ['You are the pet character', 'Reality (authoritative)', 'Personality —', 'This turn (authoritative)', 'Reply rules'].map(
      (text) => system.indexOf(text),
    );

    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('includes the plan Task 7.11 instructions and the JSON format', () => {
    expect(system).toMatch(/Never claim success when the action was rejected/);
    expect(system).toMatch(/Never claim an action happened when no action happened/);
    expect(system).toMatch(/Never invent memories/);
    expect(system).toMatch(/1–3 short sentences/);
    expect(system).toContain('{"message": "<your reply to the player>"}');
  });

  it('follows with the conversation and the current message last', () => {
    expect(messages.slice(1)).toEqual([
      { role: 'assistant', content: 'Halo!' },
      { role: 'user', content: 'Main yuk!' },
    ]);
  });
});

describe('generateCharacterResponse', () => {
  it('returns the validated reply with bounded, non-deterministic settings', async () => {
    const fake = new FakeAIProvider().script('RESPONSE', fakeOutcome.value({ message: '  Capek… nanti ya.  ' }));

    const outcome = await generateCharacterResponse(fake, context, null, 7_000);

    expect(outcome).toMatchObject({ message: 'Capek… nanti ya.', failure: null });
    expect(fake.requests[0]).toMatchObject({ kind: 'RESPONSE', timeoutMs: 7_000, maxOutputTokens: 200, temperature: 0.8 });
  });

  it.each([
    ['an empty reply', fakeOutcome.value({ message: '   ' })],
    ['plain text', fakeOutcome.raw('Yay, let us play!')],
    ['a timeout', fakeOutcome.failure('TIMEOUT')],
  ])('reports failure for %s instead of inventing a reply', async (_label, outcome) => {
    const fake = new FakeAIProvider().script('RESPONSE', outcome);

    expect(await generateCharacterResponse(fake, context, null, 7_000)).toMatchObject({ message: null });
  });
});
