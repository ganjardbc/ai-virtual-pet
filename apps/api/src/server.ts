import { SystemClock, SystemRandom } from '@ai-virtual-pet/domain';

import { buildApp } from './app.js';
import { optionalEnv, requireEnv } from './config/env.js';
import { createDatabase } from './db/client.js';
import { OffsetClock } from './debug/offset-clock.js';
import {
  DrizzleConversationRepository,
  DrizzleEventRepository,
  DrizzlePetRepository,
} from './persistence/drizzle.js';

const debugEnabled = optionalEnv('ENABLE_DEBUG_API') === 'true';

if (debugEnabled && process.env.NODE_ENV === 'production') {
  throw new Error('ENABLE_DEBUG_API must not be enabled when NODE_ENV=production.');
}

const database = createDatabase(requireEnv('DATABASE_URL'));
const pets = new DrizzlePetRepository(database.db);
const events = new DrizzleEventRepository(database.db);
const conversations = new DrizzleConversationRepository(database.db);
const debugClock = debugEnabled ? new OffsetClock(new SystemClock()) : null;

if (debugClock) {
  // After a restart, keep debug time at or beyond the pet's last simulated moment.
  // A database outage must not stop the server from starting: requests will report it.
  try {
    const current = await pets.findCurrent();

    if (current) {
      debugClock.catchUpTo(current.state.lastSimulatedAt);
    }
  } catch (error) {
    console.warn('Could not restore the debug clock offset at startup:', (error as Error).message);
  }
}

const app = buildApp({
  pets,
  events,
  conversations,
  clock: debugClock ?? new SystemClock(),
  random: new SystemRandom(),
  logger: true,
  ...(debugClock ? { debug: { clock: debugClock } } : {}),
});
app.addHook('onClose', async () => database.close());

const port = Number(process.env.API_PORT ?? 3000);

try {
  await app.listen({ host: '0.0.0.0', port });
  app.log.info(debugEnabled ? 'Debug API enabled at /api/v1/debug' : 'Debug API disabled');
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
