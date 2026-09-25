import { createAIProvider, loadAIConfig } from '../ai/config.js';
import { INTERPRETATION_CORPUS, scoreInterpretation, type CorpusVerdict } from '../ai/interpretation-corpus.js';
import { interpretMessage } from '../ai/interpretation.js';
import { retryAfterRateLimit } from '../ai/evaluation/rate-limit.js';
import { loadEnv } from '../config/env.js';

// 9router model quotas reset after about two minutes.
const RATE_LIMIT_WAIT_MS = 125_000;

/**
 * Opt-in live interpretation evaluation (plan Task 5.8). Runs the corpus once against the
 * configured provider — one call per case, sequentially. Not part of the automated suite.
 * False positives (unrequested care actions) matter more than false negatives.
 */
loadEnv();
const config = loadAIConfig(process.env);
const provider = createAIProvider(config);

if (!provider.available) {
  console.error('AI provider unavailable. Set AI_BASE_URL, AI_MODEL, and AI_API_KEY in the repository-root .env.');
  process.exit(1);
}

const counts: Record<CorpusVerdict, number> = { PASS: 0, FALSE_POSITIVE: 0, FALSE_NEGATIVE: 0 };
const latencies: number[] = [];
let failures = 0;

console.log(`model: ${provider.model} (json mode: ${config.jsonMode})\n`);
console.log(['verdict', 'group', 'expected', 'raw', 'acts on', 'conf', 'class', 'ms', 'message'].join('\t'));

for (const testCase of INTERPRETATION_CORPUS) {
  const outcome = await retryAfterRateLimit(
    () => interpretMessage(provider, { message: testCase.message, petName: 'Momo' }, config.timeouts.interpretationMs),
    (result) => result.failure?.reason === 'PROVIDER_ERROR',
    RATE_LIMIT_WAIT_MS,
    (ms) => console.error(`rate limited — waiting ${ms / 1000} s, then retrying once`),
  );
  const { interpretation } = outcome;
  const verdict = scoreInterpretation(testCase.expected, interpretation);
  counts[verdict] += 1;

  if (outcome.usage) {
    latencies.push(outcome.usage.latencyMs);
  }

  if (outcome.failure) {
    failures += 1;
  }

  console.log(
    [
      verdict,
      testCase.group,
      testCase.expected,
      outcome.failure ? `FAILED:${outcome.failure.reason}` : interpretation.rawIntent,
      interpretation.intent,
      interpretation.confidence.toFixed(2),
      interpretation.classification,
      outcome.usage?.latencyMs ?? '-',
      JSON.stringify(testCase.message),
    ].join('\t'),
  );
}

const averageLatency = latencies.length ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length) : 0;

console.log(`\ncases ${INTERPRETATION_CORPUS.length}: pass ${counts.PASS}, false positive ${counts.FALSE_POSITIVE}, false negative ${counts.FALSE_NEGATIVE}`);
console.log(`provider failures (fell back to NONE): ${failures}; average latency ${averageLatency} ms`);

if (counts.FALSE_POSITIVE > 0) {
  console.log('\nFalse positives found: fix these before false negatives (plan Task 12.4).');
}
