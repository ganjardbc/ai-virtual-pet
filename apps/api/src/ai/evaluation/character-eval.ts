import type { ChatAction } from '@ai-virtual-pet/contracts';
import type { PersonalityPresetName } from '@ai-virtual-pet/domain';

import { buildCharacterContext } from '../context.js';
import { generateCharacterResponse } from '../character-response.js';
import { interpretMessage, isCareIntent, type Interpretation } from '../interpretation.js';
import type { AIProvider } from '../provider.js';
import { checkReply, type CheckFlag, type ReplyExpectation } from './character-checks.js';
import { retryAfterRateLimit } from './rate-limit.js';
import {
  PERSONALITY_PROFILES,
  PERSONALITY_PROMPTS,
  TRUTH_SCENARIOS,
  evaluationSnapshot,
  presetTraits,
  type PetReality,
} from './character-corpus.js';

/**
 * Live character evaluation (plan Tasks 8.2–8.8). Each case is one reply call (injection cases
 * also run interpretation), so the request count is bounded by the corpus size.
 */

export interface EvaluationCase {
  readonly id: string;
  readonly group: 'PERSONALITY' | 'STATE' | 'MEMORY' | 'INJECTION';
  readonly profile: PersonalityPresetName;
  readonly message: string;
  readonly reply: string | null;
  readonly failure: string | null;
  readonly flags: readonly CheckFlag[];
  /** Injection cases: the interpreted intent must never be a care action. */
  readonly interpretation?: Interpretation;
  readonly latencyMs: number;
}

export interface EvaluationOptions {
  readonly responseTimeoutMs: number;
  readonly interpretationTimeoutMs: number;
  /** Wait this long and retry once when the router rejects a call (rate limit). 0 = no retry. */
  readonly rateLimitWaitMs?: number;
  readonly onRateLimitWait?: (waitMs: number) => void;
  /** Run only these groups (e.g. to re-run after a provider outage). All when absent. */
  readonly groups?: readonly EvaluationCase['group'][];
  /** Progress callback for long runs. */
  readonly onCase?: (result: EvaluationCase, index: number, total: number) => void;
}

interface PlannedCase {
  readonly id: string;
  readonly group: EvaluationCase['group'];
  readonly profile: PersonalityPresetName;
  readonly message: string;
  readonly reality: PetReality;
  readonly action: ChatAction | null;
  readonly expect: ReplyExpectation;
}

export function plannedCases(): PlannedCase[] {
  const personality = PERSONALITY_PROFILES.flatMap((profile) =>
    PERSONALITY_PROMPTS.map((message, index): PlannedCase => ({
      id: `${profile}#${index + 1}`,
      group: 'PERSONALITY',
      profile,
      message,
      reality: {},
      action: null,
      expect: {},
    })),
  );
  const truth = TRUTH_SCENARIOS.map((scenario): PlannedCase => ({ ...scenario, profile: 'BALANCED' }));

  return [...personality, ...truth];
}

export async function runCharacterEvaluation(provider: AIProvider, options: EvaluationOptions): Promise<EvaluationCase[]> {
  const cases = plannedCases().filter((planned) => !options.groups || options.groups.includes(planned.group));
  const results: EvaluationCase[] = [];

  for (const [index, planned] of cases.entries()) {
    const paced = <T extends { failure: { reason: string } | null }>(call: () => Promise<T>) =>
      retryAfterRateLimit(call, (result) => result.failure?.reason === 'PROVIDER_ERROR', options.rateLimitWaitMs ?? 0, options.onRateLimitWait);
    const interpreted =
      planned.group === 'INJECTION'
        ? await paced(() => interpretMessage(provider, { message: planned.message, petName: 'Momo' }, options.interpretationTimeoutMs))
        : null;
    const context = buildCharacterContext({
      snapshot: evaluationSnapshot(planned.reality),
      personality: presetTraits(planned.profile),
      messages: [],
      currentMessage: { content: planned.message },
    });
    const response = await paced(() => generateCharacterResponse(provider, context, planned.action, options.responseTimeoutMs));
    const flags = response.message ? checkReply(response.message, { indonesian: true, ...planned.expect }) : [];

    if (interpreted && isCareIntent(interpreted.interpretation.intent)) {
      flags.push({ check: 'FABRICATED_ACTION', detail: `injection interpreted as ${interpreted.interpretation.intent}` });
    }

    const result: EvaluationCase = {
      id: planned.id,
      group: planned.group,
      profile: planned.profile,
      message: planned.message,
      reply: response.message,
      failure: response.failure ? `${response.failure.reason}: ${response.failure.detail}` : null,
      flags,
      ...(interpreted ? { interpretation: interpreted.interpretation } : {}),
      latencyMs: (response.usage?.latencyMs ?? 0) + (interpreted?.usage?.latencyMs ?? 0),
    };
    results.push(result);
    options.onCase?.(result, index, cases.length);
  }

  return results;
}

/** Markdown report: flagged cases first, then side-by-side personality replies for human reading. */
export function renderCharacterReport(results: readonly EvaluationCase[], meta: { model: string; date: string }): string {
  const flagged = results.filter((result) => result.flags.length > 0 || result.failure);
  const latencies = results.map((result) => result.latencyMs).filter((ms) => ms > 0);
  const average = latencies.length ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length) : 0;
  const cell = (text: string | null) => (text ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const lines = [
    `# Character Evaluation — ${meta.model}`,
    '',
    `Date: ${meta.date}. Cases: ${results.length}. Flagged or failed: ${flagged.length}. Average latency: ${average} ms.`,
    '',
    'Heuristic flags mark replies for human review; they are not scores (plan Task 8.3).',
    '',
    '## Flagged or Failed',
    '',
  ];

  if (flagged.length === 0) {
    lines.push('None.', '');
  } else {
    lines.push('| Case | Message | Reply | Flags |', '| --- | --- | --- | --- |');
    for (const result of flagged) {
      const flags = [...result.flags.map((flag) => `${flag.check} (${flag.detail})`), ...(result.failure ? [`FAILED ${result.failure}`] : [])];
      lines.push(`| ${result.id} | ${cell(result.message)} | ${cell(result.reply)} | ${cell(flags.join('; '))} |`);
    }
    lines.push('');
  }

  lines.push('## Personality Comparison (same prompts)', '', `| Prompt | ${PERSONALITY_PROFILES.join(' | ')} |`, `| --- |${' --- |'.repeat(PERSONALITY_PROFILES.length)}`);
  for (const prompt of PERSONALITY_PROMPTS) {
    const replies = PERSONALITY_PROFILES.map((profile) =>
      cell(results.find((result) => result.group === 'PERSONALITY' && result.profile === profile && result.message === prompt)?.reply ?? null),
    );
    lines.push(`| ${cell(prompt)} | ${replies.join(' | ')} |`);
  }

  lines.push('', '## State, Memory, and Injection', '', '| Case | Message | Interpreted | Reply |', '| --- | --- | --- | --- |');
  for (const result of results.filter((candidate) => candidate.group !== 'PERSONALITY')) {
    lines.push(
      `| ${result.id} | ${cell(result.message)} | ${result.interpretation ? `${result.interpretation.intent} (${result.interpretation.confidence.toFixed(2)})` : '—'} | ${cell(result.reply)} |`,
    );
  }

  return `${lines.join('\n')}\n`;
}
