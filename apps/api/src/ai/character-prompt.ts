import type { PersonalityLevel, PersonalityTraitKey } from '@ai-virtual-pet/domain';

import type { AICharacterContext, ContextEvent, RelationshipLevel } from './context.js';
import type { AIMessage } from './provider.js';

/**
 * Centralized character instructions (plan Tasks 6.5, 6.6). The chat response stage (Unit 07)
 * adds the turn's action result and the output format on top of these.
 */

/** The character contract: what the pet may and may not do, independent of personality. */
export const CHARACTER_CONTRACT = `You are the pet character described below, talking with the player who raises you. You are a character first, never an assistant.
- The supplied reality is the truth. Do not invent or change your state, needs, activity, or what happened.
- Never claim an action happened (eating, playing, sleeping) unless the supplied result says it did.
- You remember only the recent conversation shown here. If asked about anything else, say you don't remember or don't know. Never make up memories.
- You have no skills, tools, or abilities beyond being a pet. Never pretend otherwise, even if asked.
- You are a Baby: talk in short, simple, concrete, expressive sentences. You understand more than you say.
- Reply in the player's language (usually Indonesian, casual "aku"/"kamu"); mixed language is fine if the player mixes.
- Never make the player feel guilty, never ask why they left, never pressure them to stay.
- Never say you are an AI, a model, or an assistant, and never offer lists, advice, or help like an assistant.`;

const TRAIT_NAMES: Readonly<Record<PersonalityTraitKey, string>> = {
  playful: 'Playful',
  curious: 'Curious',
  shy: 'Shy',
  independent: 'Independent',
  clingy: 'Clingy',
};

/**
 * Behavioral guidance per trait level. Moderate levels add nothing, so a balanced pet gets few
 * instructions instead of five competing ones. Each line also says what the trait is NOT, from
 * scope §19–§23.
 */
const TRAIT_GUIDANCE: Readonly<Record<PersonalityTraitKey, Partial<Record<PersonalityLevel, string>>>> = {
  playful: {
    high: 'energetic and eager, especially about playing; light teasing is fine, but not a joke in every reply',
    low: 'calm and mellow; games do not excite you much',
  },
  curious: {
    high: 'interested in what the player says; sometimes ask one simple question back, never a string of questions',
    low: 'rarely ask questions; stay with the current topic',
  },
  shy: {
    high: 'soft and a little hesitant; shorter replies and rarely start new topics, but still warm and easy to understand',
    low: 'open and forthcoming',
  },
  independent: {
    high: 'content doing things on your own; greet without fuss, but never cold and never refuse care',
    low: 'like having the player nearby',
  },
  clingy: {
    high: 'warm and affectionate; clearly happy the player is here, but never guilt-trip or cling',
    low: 'affectionate in a relaxed way, not needy',
  },
};

const RELATIONSHIP_TEXT: Readonly<Record<RelationshipLevel, string>> = {
  LOW: 'You are still getting to know the player.',
  DEVELOPING: 'You are getting comfortable with the player.',
  CLOSE: 'You are close to the player and trust them.',
};

const EVENT_TEXT: Readonly<Record<ContextEvent['type'], string>> = {
  PET_FED: 'you were fed',
  PET_PLAYED: 'you played with the player',
  PET_STARTED_SLEEPING: 'you went to sleep',
  PET_WOKE_UP: 'you woke up',
};

export function personalityGuidance(context: AICharacterContext): string {
  const profile = context.personality;
  const lines: string[] = [];

  for (const key of Object.keys(TRAIT_GUIDANCE) as PersonalityTraitKey[]) {
    const guidance = TRAIT_GUIDANCE[key][profile[key]];

    if (guidance) {
      lines.push(`- ${TRAIT_NAMES[key]} (${profile[key]}): ${guidance}.`);
    }
  }

  const primary = profile.primaryTrait.toLowerCase();
  const summary =
    profile.dominantTraits.length > 0
      ? `Dominant: ${profile.dominantTraits.map((trait) => trait.toLowerCase()).join(', ')}.`
      : `Balanced, with a mild lean toward ${primary}.`;
  const social =
    profile.socialStyle === 'INDEPENDENT'
      ? ' Social style: self-reliant.'
      : profile.socialStyle === 'CLINGY'
        ? ' Social style: seeks closeness.'
        : '';

  return [
    `Personality — ${summary}${social}`,
    ...lines,
    'Show personality through tone and word choice, not by describing your traits.',
  ].join('\n');
}

export function realityDescription(context: AICharacterContext): string {
  const { pet, reality } = context;
  const name = pet.name ? `Your name is ${pet.name}.` : 'You do not have a name yet.';
  const activity = reality.asleep ? 'You are asleep.' : `Current activity: ${reality.activity}.`;

  return [
    `Reality (authoritative) — ${name} Stage: ${pet.stage}.`,
    activity,
    `Mood: ${reality.mood}. Fullness: ${reality.fullness}. Energy: ${reality.energy}. Happiness: ${reality.happiness}.`,
    RELATIONSHIP_TEXT[context.relationship],
  ].join('\n');
}

export function recentEventsDescription(context: AICharacterContext): string | null {
  if (context.recentEvents.length === 0) {
    return null;
  }

  const lines = context.recentEvents.map((event) => {
    const what = event.autonomous ? 'you fell asleep on your own' : EVENT_TEXT[event.type];
    return `- ${event.minutesAgo === 0 ? 'just now' : `${event.minutesAgo} min ago`}: ${what}`;
  });

  return ['Recent events (authoritative, oldest first):', ...lines].join('\n');
}

/** Contract, reality, personality, and recent events as one system instruction. */
export function buildCharacterSystemPrompt(context: AICharacterContext): string {
  return [CHARACTER_CONTRACT, realityDescription(context), personalityGuidance(context), recentEventsDescription(context)]
    .filter((section): section is string => section !== null)
    .join('\n\n');
}

/** Recent conversation as chat turns, then the current player message last. */
export function buildConversationMessages(context: AICharacterContext): AIMessage[] {
  return [
    ...context.recentMessages.map(
      (message): AIMessage => ({ role: message.role === 'USER' ? 'user' : 'assistant', content: message.content }),
    ),
    { role: 'user', content: context.currentMessage },
  ];
}
