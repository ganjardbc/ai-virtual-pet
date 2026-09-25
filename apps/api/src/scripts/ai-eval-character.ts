import { writeFile } from 'node:fs/promises';

import { createAIProvider, loadAIConfig } from '../ai/config.js';
import { renderCharacterReport, runCharacterEvaluation, type EvaluationCase } from '../ai/evaluation/character-eval.js';
import { loadEnv } from '../config/env.js';

/**
 * Opt-in live character evaluation (plan Task 8.8). Not part of the automated suite. Makes one reply
 * call per case (plus interpretation for injection cases) — about 50 requests.
 * Usage: pnpm ai:eval:character [--out report.md] [--groups PERSONALITY,STATE,MEMORY,INJECTION]
 */
loadEnv();
const config = loadAIConfig(process.env);
const provider = createAIProvider(config);

if (!provider.available) {
  console.error('AI provider unavailable. Set AI_BASE_URL, AI_MODEL, and AI_API_KEY in the repository-root .env.');
  process.exit(1);
}

const outIndex = process.argv.indexOf('--out');
const outPath = outIndex >= 0 ? process.argv[outIndex + 1] : undefined;
const groupsIndex = process.argv.indexOf('--groups');
const groups = groupsIndex >= 0 ? (process.argv[groupsIndex + 1]?.split(',') as EvaluationCase['group'][]) : undefined;

const results = await runCharacterEvaluation(provider, {
  responseTimeoutMs: config.timeouts.responseMs,
  interpretationTimeoutMs: config.timeouts.interpretationMs,
  ...(groups ? { groups } : {}),
  onCase: (result, index, total) => {
    const status = result.failure ? 'FAILED' : result.flags.length ? `FLAG ${result.flags.map((flag) => flag.check).join(',')}` : 'ok';
    console.error(`[${index + 1}/${total}] ${result.id} ${status}`);
  },
});
const report = renderCharacterReport(results, { model: provider.model, date: new Date().toISOString().slice(0, 10) });

if (outPath) {
  await writeFile(outPath, report);
  console.error(`Report written to ${outPath}`);
} else {
  console.log(report);
}
