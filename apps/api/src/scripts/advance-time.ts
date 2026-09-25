import { optionalEnv } from '../config/env.js';

// Playtest helper: simulate "the player was away" on the running API without showing the
// Debug panel to the tester. Usage: pnpm playtest:advance 12h | 1d | 7d
const input = process.argv.slice(2).find((arg) => arg !== '--') ?? '';
const match = /^(\d+(?:\.\d+)?)(h|d)$/.exec(input.trim());

if (!match) {
  console.error('Usage: pnpm playtest:advance <duration>   e.g. 12h, 1d, 7d');
  process.exit(1);
}

const amount = Number(match[1]);
const body = match[2] === 'h' ? { hours: amount } : { days: amount };
const port = optionalEnv('API_PORT') ?? '3000';

try {
  const response = await fetch(`http://localhost:${port}/api/v1/debug/time/advance`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as {
    data?: { pet: { derived: { mood: string; needs: Record<string, string> }; state: { currentActivity: string } } };
    error?: { code: string; message: string };
  };

  if (!response.ok || !json.data) {
    console.error(`Could not advance time: ${json.error?.code ?? response.status} ${json.error?.message ?? ''}`);
    process.exit(1);
  }

  const { derived, state } = json.data.pet;
  console.log(`Advanced ${input}. Pet is ${state.currentActivity}, mood ${derived.mood}, ${JSON.stringify(derived.needs)}.`);
  console.log('Ask the tester to return to the game tab (it refreshes on focus) or reload the page.');
} catch {
  console.error(`Could not reach the API on port ${port}. Is \`pnpm dev\` running with ENABLE_DEBUG_API=true?`);
  process.exit(1);
}
