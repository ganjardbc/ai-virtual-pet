import { randomUUID } from 'node:crypto';

import {
  apiErrorEnvelopeSchema,
  chatTurnResultSchema,
  successEnvelopeSchema,
  type ApiErrorCode,
  type ChatTurnResult,
} from '@ai-virtual-pet/contracts';
import { FakeClock, SeededRandom, type PersonalityState } from '@ai-virtual-pet/domain';
import type { FastifyInstance } from 'fastify';
import { expect } from 'vitest';

import type { AITimeouts } from '../ai/config.js';
import { buildApp } from '../app.js';
import { OffsetClock } from '../debug/offset-clock.js';
import type { ConversationRepository, EventRepository, PetRepository, StoredMessage } from '../persistence/repositories.js';
import { FakeAIProvider, fakeOutcome, type FakeOutcome } from './fake-ai-provider.js';

export const CHAT_START = new Date('2026-09-25T08:00:00.000Z');
const turnEnvelope = successEnvelopeSchema(chatTurnResultSchema);

export interface Repositories {
  readonly pets: PetRepository;
  readonly events: EventRepository;
  readonly conversations: ConversationRepository;
}

export type Classification = 'AFFECTION' | 'PLAYFUL' | 'CURIOUS' | 'COMFORTING' | 'CASUAL' | 'CARE' | 'PRAISE' | 'TEASING';

/** A running API with a scripted AI, a controllable game clock, and a controllable turn clock. */
export class ChatHarness {
  readonly ai = new FakeAIProvider({ latencyMs: 120, inputTokens: 300, outputTokens: 20 });
  readonly clock = new OffsetClock(new FakeClock(CHAT_START));
  monotonic = 0;
  readonly app: FastifyInstance;

  constructor(
    readonly repositories: Repositories,
    options: { ai?: FakeAIProvider | null; aiTimeouts?: AITimeouts } = {},
  ) {
    const ai = options.ai === undefined ? this.ai : options.ai;
    this.app = buildApp({
      ...repositories,
      clock: this.clock,
      random: new SeededRandom(3),
      personalityRandom: new SeededRandom(9),
      debug: { clock: this.clock },
      monotonicNow: () => this.monotonic,
      ...(ai ? { ai } : {}),
      ...(options.aiTimeouts ? { aiTimeouts: options.aiTimeouts } : {}),
    });
  }

  /** Scripts one turn: interpretation, then (optionally) the character reply. */
  turn(intent: string, options: { confidence?: number; classification?: Classification; reply?: FakeOutcome | null } = {}): this {
    this.ai.script(
      'INTERPRETATION',
      fakeOutcome.value({
        intent,
        confidence: options.confidence ?? 0.95,
        classification: options.classification ?? 'CASUAL',
      }),
    );

    if (options.reply !== null) {
      this.ai.script('RESPONSE', options.reply ?? fakeOutcome.value({ message: 'Hehe!' }));
    }

    return this;
  }

  async send(message: string, clientMessageId: string = randomUUID()) {
    const response = await this.app.inject({ method: 'POST', url: '/api/v1/pet/chat', payload: { clientMessageId, message } });
    return { statusCode: response.statusCode, body: response.json() as unknown };
  }

  async chat(message: string, clientMessageId?: string): Promise<ChatTurnResult> {
    const response = await this.send(message, clientMessageId);
    expect(response.statusCode, JSON.stringify(response.body)).toBe(200);
    return turnEnvelope.parse(response.body).data;
  }

  async expectError(message: string, code: ApiErrorCode, clientMessageId?: string): Promise<void> {
    const response = await this.send(message, clientMessageId);
    expect(apiErrorEnvelopeSchema.parse(response.body).error.code).toBe(code);
  }

  async startBaby(): Promise<void> {
    await this.app.inject({ method: 'POST', url: '/api/v1/pet' });
    await this.app.inject({ method: 'POST', url: '/api/v1/pet/hatch' });
    await this.app.inject({ method: 'PATCH', url: '/api/v1/pet/name', payload: { name: 'Momo' } });
  }

  async setStats(stats: Record<string, number>): Promise<void> {
    const response = await this.app.inject({ method: 'PATCH', url: '/api/v1/debug/pet/state', payload: stats });
    expect(response.statusCode).toBe(200);
  }

  async aggregate() {
    const current = await this.repositories.pets.findCurrent();
    expect(current).not.toBeNull();
    return current as NonNullable<typeof current>;
  }

  async personality(): Promise<PersonalityState> {
    return (await this.aggregate()).personality as PersonalityState;
  }

  async stored(): Promise<StoredMessage[]> {
    const conversation = await this.repositories.conversations.findForPet((await this.aggregate()).pet.id);
    return conversation ? this.repositories.conversations.listRecentMessages(conversation.id, { limit: 100 }) : [];
  }

  async events(type?: string) {
    const all = await this.repositories.events.listRecent((await this.aggregate()).pet.id, { limit: 1_000 });
    return type ? all.filter((event) => event.type === type) : all;
  }

  systemPrompt(index = -1): string {
    return this.ai.requestsOf('RESPONSE').at(index)?.messages[0]?.content ?? '';
  }
}

