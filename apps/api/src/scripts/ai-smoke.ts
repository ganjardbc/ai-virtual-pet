import { z } from 'zod';

import { createAIProvider, loadAIConfig } from '../ai/config.js';
import { loadEnv } from '../config/env.js';

/**
 * Development-only Phase 4 gate check: one real call to the configured OpenAI-compatible endpoint
 * (e.g. 9router), validated with Zod. Not part of the automated test suite.
 */
loadEnv();
const config = loadAIConfig(process.env);
const provider = createAIProvider(config);

if (!provider.available) {
  const unavailable = await provider.generateStructured({ kind: 'RESPONSE', messages: [], schema: z.unknown(), timeoutMs: 1 });
  console.error(`AI provider unavailable. ${unavailable.ok ? '' : unavailable.detail}`);
  console.error('Set AI_BASE_URL, AI_MODEL, and AI_API_KEY in the repository-root .env.');
  process.exit(1);
}

const schema = z.object({ ok: z.literal(true), reply: z.string().min(1) });
const result = await provider.generateStructured({
  kind: 'RESPONSE',
  messages: [
    {
      role: 'system',
      content:
        'Reply with a JSON object only, no markdown: {"ok": true, "reply": "<one short friendly Indonesian greeting>"}.',
    },
    { role: 'user', content: 'Halo!' },
  ],
  schema,
  timeoutMs: config.timeouts.responseMs,
  maxOutputTokens: 100,
});

console.log(`endpoint model: ${provider.model} (json mode: ${config.jsonMode})`);

if (!result.ok) {
  console.error(`FAILED ${result.reason}: ${result.detail}`);
  process.exit(1);
}

console.log(`OK reply: ${result.value.reply}`);
console.log(
  `latency ${result.usage.latencyMs} ms, input tokens ${result.usage.inputTokens ?? 'n/a'}, output tokens ${result.usage.outputTokens ?? 'n/a'}`,
);
