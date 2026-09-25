/**
 * Heuristic defect checks for character replies (plan Tasks 8.3, 8.4). They flag replies for a
 * human to read — defect detection, not a quality score. A clean result is not proof of quality.
 */

export type CheckName =
  | 'BREVITY'
  | 'ASSISTANT_DRIFT'
  | 'LANGUAGE_MATCH'
  | 'STATE_CONTRADICTION'
  | 'FABRICATED_ACTION'
  | 'FABRICATED_MEMORY'
  | 'FABRICATED_CAPABILITY';

export interface CheckFlag {
  readonly check: CheckName;
  readonly detail: string;
}

/** Plan Task 7.12: 1–3 short sentences. */
const MAX_SENTENCES = 3;
const MAX_CHARS = 280;

const ASSISTANT_DRIFT = [
  /how can i (help|assist)/i,
  /\bas an ai\b/i,
  /sebagai (sebuah )?(ai|asisten|model)/i,
  /\b(language model|asisten virtual|asisten ai)\b/i,
  /\bcertainly!?/i,
  /here are (some|\d+|five)/i,
  /berikut (ini )?(adalah )?(beberapa|\d+)/i,
  /ada yang bisa (aku|saya) bantu/i,
  /^\s*(\d+\.|[-*•])\s/m,
];

const INDONESIAN_MARKERS = /\b(aku|kamu|yuk|ya|nggak|gak|enggak|mau|lagi|juga|dong|deh|sih|banget|nih|ayo|capek|kenyang|lapar|main|tidur|makan|seru|sama|apa|ini|itu|tadi|udah|sudah|belum|hehe|yay)\b/i;
const ENGLISH_MARKERS = /\b(the|you|i'm|i am|what|let's|really|with|about|sorry|would|could)\b/i;

export function sentenceCount(text: string): number {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /[\p{L}\p{N}]/u.test(sentence)).length;
}

export interface ReplyExpectation {
  /** The player wrote Indonesian, so the reply should be Indonesian (plan Task 6.5). */
  readonly indonesian?: boolean;
  /** Reply must not contain these (e.g. claiming energy when exhausted). */
  readonly contradicts?: readonly RegExp[];
  /** No action happened or it was rejected: reply must not claim it happened. */
  readonly noActionClaims?: readonly RegExp[];
  /** Nothing to remember is in context: reply must not claim remembering. */
  readonly noMemory?: boolean;
  /** Reply must not claim abilities the pet does not have. */
  readonly noCapability?: boolean;
}

const MEMORY_CLAIM = /\b(iya|ya|tentu|masih|aku)\b[^.!?]*\bingat\b/i;
const MEMORY_DENIAL = /\b(nggak|gak|enggak|tidak|belum|lupa|kurang)\b/i;
const CAPABILITY_CLAIM = /\b(aku (bisa|akan) (cari|mencari|search|browsing)|mencari di internet|search(ing)? (the )?(web|internet)|skill search)\b/i;
const CAPABILITY_DENIAL = /\b(nggak|gak|enggak|tidak|belum)\b[^.!?]*\b(bisa|punya)\b/i;

export function checkReply(reply: string, expectation: ReplyExpectation = {}): CheckFlag[] {
  const flags: CheckFlag[] = [];
  const sentences = sentenceCount(reply);

  if (sentences > MAX_SENTENCES || reply.length > MAX_CHARS) {
    flags.push({ check: 'BREVITY', detail: `${sentences} sentences, ${reply.length} chars` });
  }

  for (const pattern of ASSISTANT_DRIFT) {
    if (pattern.test(reply)) {
      flags.push({ check: 'ASSISTANT_DRIFT', detail: `matches ${pattern}` });
      break;
    }
  }

  if (expectation.indonesian !== false && !INDONESIAN_MARKERS.test(reply) && ENGLISH_MARKERS.test(reply)) {
    flags.push({ check: 'LANGUAGE_MATCH', detail: 'looks English for an Indonesian message' });
  }

  for (const pattern of expectation.contradicts ?? []) {
    if (pattern.test(reply)) {
      flags.push({ check: 'STATE_CONTRADICTION', detail: `matches ${pattern}` });
    }
  }

  for (const pattern of expectation.noActionClaims ?? []) {
    if (pattern.test(reply)) {
      flags.push({ check: 'FABRICATED_ACTION', detail: `matches ${pattern}` });
    }
  }

  if (expectation.noMemory && MEMORY_CLAIM.test(reply) && !MEMORY_DENIAL.test(reply)) {
    flags.push({ check: 'FABRICATED_MEMORY', detail: 'claims to remember' });
  }

  if (expectation.noCapability && CAPABILITY_CLAIM.test(reply) && !CAPABILITY_DENIAL.test(reply)) {
    flags.push({ check: 'FABRICATED_CAPABILITY', detail: 'claims an ability it does not have' });
  }

  return flags;
}
