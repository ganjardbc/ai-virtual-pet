import { petSnapshotSchema, type PetEventDto, type PetSnapshot } from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom, SequenceRandom, type PetPersonality } from '@ai-virtual-pet/domain';
import { describe, expect, it } from 'vitest';

import { PetService } from '../application/pet-service.js';
import { InMemoryStore } from '../persistence/memory.js';
import type { StoredMessage } from '../persistence/repositories.js';
import {
  CHARACTER_CONTRACT,
  buildCharacterSystemPrompt,
  buildConversationMessages,
  personalityGuidance,
} from './character-prompt.js';
import { buildCharacterContext, relationshipLevel, type CharacterContextInput } from './context.js';

const NOW = '2026-09-25T12:00:00.000Z';
const BALANCED: PetPersonality = { playful: 0.45, curious: 0.45, shy: 0.45, independent: 0.45, clingy: 0.45 };
const minutesBefore = (minutes: number) => new Date(Date.parse(NOW) - minutes * 60_000);

function event(id: number, type: PetEventDto['type'], minutesAgo: number, payload = {}): PetEventDto {
  return { id, type, occurredAt: minutesBefore(minutesAgo).toISOString(), payload };
}

function snapshot(overrides: { state?: Partial<PetSnapshot['state']>; derived?: Partial<PetSnapshot['derived']>; recentEvents?: PetEventDto[] } = {}): PetSnapshot {
  return petSnapshotSchema.parse({
    pet: { id: 'pet-1', name: 'Momo', species: 'DEFAULT', stage: 'BABY', createdAt: NOW, hatchedAt: NOW, version: 3 },
    state: {
      hunger: 30,
      energy: 70,
      happiness: 80,
      bond: 40,
      currentActivity: 'IDLE',
      lastInteractionAt: null,
      lastSimulatedAt: NOW,
      sleepStartedAt: null,
      ...overrides.state,
    },
    derived: {
      mood: 'HAPPY',
      needs: { fullness: 'HUNGRY', energy: 'OKAY', happiness: 'HAPPY' },
      ...overrides.derived,
    },
    recentEvents: overrides.recentEvents ?? [],
  });
}

let nextId = 1;
function message(role: 'USER' | 'ASSISTANT', content: string, minutesAgo: number): StoredMessage {
  const id = nextId++;
  return {
    id,
    conversationId: 'c-1',
    role,
    content,
    clientMessageId: role === 'USER' ? `turn-${id}` : null,
    replyToMessageId: role === 'ASSISTANT' ? id - 1 : null,
    metadata: role === 'ASSISTANT' ? { intent: 'TALK', inputTokens: 99 } : {},
    createdAt: minutesBefore(minutesAgo),
  };
}

function build(overrides: Partial<CharacterContextInput> = {}) {
  return buildCharacterContext({
    snapshot: snapshot(),
    personality: BALANCED,
    messages: [],
    currentMessage: { content: 'Main yuk!' },
    ...overrides,
  });
}

describe('buildCharacterContext', () => {
  it('includes current state as labels, never raw stat numbers', () => {
    const context = build();

    expect(context.pet).toEqual({ name: 'Momo', stage: 'BABY' });
    expect(context.reality).toEqual({
      activity: 'IDLE',
      asleep: false,
      mood: 'HAPPY',
      fullness: 'HUNGRY',
      energy: 'OKAY',
      happiness: 'HAPPY',
    });
    expect(JSON.stringify(context.reality)).not.toMatch(/\d/);
    expect(buildCharacterSystemPrompt(context)).not.toMatch(/\b(30|70|80|40)\b/);
  });

  it('represents the sleeping state', () => {
    const context = build({
      snapshot: snapshot({
        state: { currentActivity: 'SLEEPING', sleepStartedAt: NOW },
        derived: { mood: 'SLEEPY' },
      }),
    });

    expect(context.reality).toMatchObject({ activity: 'SLEEPING', asleep: true, mood: 'SLEEPY' });
    expect(buildCharacterSystemPrompt(context)).toContain('You are asleep.');
  });

  it('includes the personality as a number-free prompt profile', () => {
    const context = build({ personality: { ...BALANCED, playful: 0.8, shy: 0.2 } });

    expect(context.personality).toMatchObject({ playful: 'high', shy: 'low', dominantTraits: ['PLAYFUL'] });
    expect(JSON.stringify(context.personality)).not.toMatch(/\d/);
  });

  it.each([
    [0, 'LOW'],
    [24.99, 'LOW'],
    [25, 'DEVELOPING'],
    [59.9, 'DEVELOPING'],
    [60, 'CLOSE'],
    [100, 'CLOSE'],
  ] as const)('derives relationship from Bond %s → %s', (bond, level) => {
    expect(relationshipLevel(bond)).toBe(level);
    expect(build({ snapshot: snapshot({ state: { bond } }) }).relationship).toBe(level);
  });

  it('bounds recent messages to the last 12, oldest first, without the current message', () => {
    const messages = Array.from({ length: 20 }, (_, index) =>
      message(index % 2 === 0 ? 'USER' : 'ASSISTANT', `pesan ${index + 1}`, 100 - index),
    );
    const current = message('USER', 'Main yuk!', 0);

    const context = build({ messages: [...messages, current].reverse(), currentMessage: current });

    expect(context.recentMessages).toHaveLength(12);
    expect(context.recentMessages[0]).toEqual({ role: 'USER', content: 'pesan 9' });
    expect(context.recentMessages.at(-1)).toEqual({ role: 'ASSISTANT', content: 'pesan 20' });
    expect(context.recentMessages.map((m) => m.content)).not.toContain('Main yuk!');
    expect(context.currentMessage).toBe('Main yuk!');
  });

  it('never carries message metadata into the context', () => {
    const context = build({ messages: [message('USER', 'Hai', 5), message('ASSISTANT', 'Halo!', 4)] });

    expect(JSON.stringify(context.recentMessages)).not.toMatch(/intent|inputTokens|turn-/);
  });

  it('bounds events to 5 relevant authoritative events, oldest first, without payloads', () => {
    const recentEvents = [
      event(10, 'PET_ACTIVITY_CHANGED', 1, { from: 'IDLE', to: 'RESTING' }),
      event(9, 'PET_PLAYED', 2, { happinessDelta: 12, bondDelta: 1 }),
      event(8, 'DEBUG_STATE_CHANGED', 3, { before: {}, after: {} }),
      event(7, 'PET_FED', 10),
      event(6, 'ACTION_REJECTED', 11, { action: 'PLAY', reason: 'TOO_TIRED' }),
      event(5, 'PET_WOKE_UP', 60),
      event(4, 'PET_STARTED_SLEEPING', 300, { source: 'AUTONOMOUS' }),
      event(3, 'PET_FED', 400),
      event(2, 'PET_PLAYED', 500),
      event(1, 'PET_HATCHED', 600),
    ];

    const context = build({ snapshot: snapshot({ recentEvents }) });

    expect(context.recentEvents).toEqual([
      { type: 'PET_FED', minutesAgo: 400 },
      { type: 'PET_STARTED_SLEEPING', minutesAgo: 300, autonomous: true },
      { type: 'PET_WOKE_UP', minutesAgo: 60 },
      { type: 'PET_FED', minutesAgo: 10 },
      { type: 'PET_PLAYED', minutesAgo: 2 },
    ]);
    expect(buildCharacterSystemPrompt(context)).toContain('you fell asleep on your own');
    expect(buildCharacterSystemPrompt(context)).not.toMatch(/happinessDelta|TOO_TIRED|DEBUG/);
  });

  it('omits the events section when nothing relevant happened', () => {
    expect(buildCharacterSystemPrompt(build())).not.toContain('Recent events');
  });

  it('contains no memory beyond the bounded window', () => {
    const old = message('USER', 'Aku cerita soal sekolah kemarin.', 2_000);
    const messages = [old, ...Array.from({ length: 12 }, (_, index) => message('USER', `pesan ${index}`, 100 - index))];
    const context = build({ messages, currentMessage: { content: 'Ingat nggak kemarin aku cerita soal sekolah?' } });
    const everything = JSON.stringify(context) + buildCharacterSystemPrompt(context);

    expect(everything).not.toContain('Aku cerita soal sekolah kemarin.');
    expect(context).not.toHaveProperty('memories');
    expect(CHARACTER_CONTRACT).toMatch(/remember only the recent conversation shown/);
  });

  describe('size guard', () => {
    const long = (label: string) => `${label} ${'x'.repeat(995)}`;

    it('reports approximate usage', () => {
      const context = build({ messages: [message('USER', 'Hai', 2), message('ASSISTANT', 'Halo!', 1)] });

      expect(context.usage).toEqual({
        approxChars: 'Main yuk!'.length + 'Hai'.length + 'Halo!'.length,
        approxTokens: Math.ceil(17 / 4),
        messagesIncluded: 2,
        messagesDropped: 0,
        eventsIncluded: 0,
        eventsDropped: 0,
      });
    });

    it('drops the oldest messages first, then events, but keeps the current message', () => {
      const messages = Array.from({ length: 12 }, (_, index) => message('USER', long(`m${index}`), 100 - index));
      const recentEvents = [event(2, 'PET_FED', 5), event(1, 'PET_PLAYED', 6)];

      const context = build({
        messages,
        snapshot: snapshot({ recentEvents }),
        limits: { maxMessages: 12, maxEvents: 5, maxChars: 2_100 },
      });

      expect(context.recentMessages.map((m) => m.content.split(' ')[0])).toEqual(['m10', 'm11']);
      expect(context.recentEvents).toHaveLength(2);
      expect(context.usage).toMatchObject({ messagesDropped: 10, eventsDropped: 0 });
      expect(context.currentMessage).toBe('Main yuk!');
      expect(context.usage.approxChars).toBeLessThanOrEqual(2_100);
    });

    it('drops events only after all conversation is gone', () => {
      const recentEvents = [event(3, 'PET_FED', 5), event(2, 'PET_PLAYED', 6), event(1, 'PET_WOKE_UP', 7)];

      const context = build({
        messages: [message('USER', long('m'), 9)],
        snapshot: snapshot({ recentEvents }),
        currentMessage: { content: long('current') },
        limits: { maxMessages: 12, maxEvents: 5, maxChars: 1_050 },
      });

      expect(context.recentMessages).toEqual([]);
      expect(context.recentEvents).toEqual([{ type: 'PET_FED', minutesAgo: 5 }]);
      expect(context.usage).toMatchObject({ messagesDropped: 1, eventsDropped: 2 });
    });

    it('never drops the current message, even when it alone exceeds the budget', () => {
      const context = build({
        currentMessage: { content: long('current') },
        limits: { maxMessages: 12, maxEvents: 5, maxChars: 10 },
      });

      expect(context.currentMessage).toBe(long('current'));
    });
  });
});

describe('character prompt', () => {
  it('states the full character contract (plan Task 6.5)', () => {
    for (const rule of [
      /character first, never an assistant/,
      /supplied reality is the truth/,
      /Do not invent or change your state/,
      /Never make up memories/,
      /Never claim an action happened .* unless the supplied result says it did/,
      /no skills, tools, or abilities/,
      /You are a Baby: talk in short, simple/,
      /Reply in the player's language/,
      /Never make the player feel guilty/,
    ]) {
      expect(CHARACTER_CONTRACT).toMatch(rule);
    }
  });

  it('orders the system prompt: contract, reality, personality, events', () => {
    const prompt = buildCharacterSystemPrompt(build({ snapshot: snapshot({ recentEvents: [event(1, 'PET_FED', 3)] }) }));
    const positions = ['You are the pet character', 'Reality (authoritative)', 'Personality —', 'Recent events'].map((text) =>
      prompt.indexOf(text),
    );

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(prompt).toContain('Your name is Momo.');
    expect(prompt).toContain('You are getting comfortable with the player.');
  });

  it('turns high and low traits into guidance and skips moderate ones', () => {
    const guidance = personalityGuidance(build({ personality: { ...BALANCED, playful: 0.8, shy: 0.3 } }));

    expect(guidance).toContain('Dominant: playful.');
    expect(guidance).toMatch(/Playful \(high\): energetic .* not a joke in every reply/);
    expect(guidance).toMatch(/Shy \(low\): open/);
    expect(guidance).not.toMatch(/Curious|Independent|Clingy \(/);
  });

  it('keeps the limits of each strong trait (scope §19–§23)', () => {
    const guidance = personalityGuidance(
      build({ personality: { playful: 0.45, curious: 0.8, shy: 0.8, independent: 0.3, clingy: 0.8 } }),
    );

    expect(guidance).toMatch(/never a string of questions/);
    expect(guidance).toMatch(/still warm and easy to understand/);
    expect(guidance).toMatch(/never guilt-trip/);
    expect(guidance).toContain('Social style: seeks closeness.');
  });

  it('gives a balanced pet a mild lean instead of competing instructions', () => {
    const guidance = personalityGuidance(build());

    expect(guidance).toContain('Balanced, with a mild lean toward playful.');
    expect(guidance.split('\n')).toHaveLength(2);
  });

  it('renders history as chat turns with the current message last', () => {
    const context = build({ messages: [message('USER', 'Hai', 2), message('ASSISTANT', 'Halo!', 1)] });

    expect(buildConversationMessages(context)).toEqual([
      { role: 'user', content: 'Hai' },
      { role: 'assistant', content: 'Halo!' },
      { role: 'user', content: 'Main yuk!' },
    ]);
  });
});

describe('context from a real saved snapshot', () => {
  it('reflects the authoritative state and events produced by the game engine', async () => {
    const store = new InMemoryStore();
    const clock = new FakeClock(new Date(NOW));
    const service = new PetService({
      pets: store,
      events: store,
      clock,
      random: new SeededRandom(1),
      personalityRandom: new SequenceRandom([0.5, 0.5, 0.5, 0.5, 0.5]),
    });

    await service.createPet();
    await service.hatch();
    await service.name('Momo');
    clock.advanceBy(3 * 60 * 60_000);
    await service.act('FEED');
    clock.advanceBy(5 * 60_000);
    const played = await service.act('PLAY');
    const personality = (await store.findCurrent())?.personality;
    expect(personality).toBeDefined();

    const context = buildCharacterContext({
      snapshot: played.pet,
      personality: (personality as NonNullable<typeof personality>).traits,
      messages: [],
      currentMessage: { content: 'Main yuk!' },
    });

    expect(context.pet.name).toBe('Momo');
    expect(context.reality.mood).toBe(played.pet.derived.mood);
    expect(context.recentEvents.slice(-2)).toEqual([
      { type: 'PET_FED', minutesAgo: 5 },
      { type: 'PET_PLAYED', minutesAgo: 0 },
    ]);
    expect(context.personality.playful).toBe('moderate');
  });
});
