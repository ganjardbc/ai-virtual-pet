import { optionalEnv, requireEnv } from '../config/env.js';
import { createDatabase } from '../db/client.js';
import { DrizzlePetRepository } from '../persistence/drizzle.js';

// Playtest setup: remove the current pet and its history so the next launch starts from the Egg.
// Prefers the running API's debug reset (which also resets debug time); falls back to the database.

async function resetThroughApi(): Promise<boolean> {
  const port = optionalEnv('API_PORT') ?? '3000';

  try {
    const response = await fetch(`http://localhost:${port}/api/v1/debug/pet/reset`, { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

async function resetThroughDatabase(): Promise<string> {
  const database = createDatabase(requireEnv('DATABASE_URL'), { max: 1 });

  try {
    const pets = new DrizzlePetRepository(database.db);
    const current = await pets.findCurrent();
    await pets.deleteAll();
    return current ? `Removed pet "${current.pet.name ?? 'unnamed egg'}" and its history.` : 'No pet to remove.';
  } finally {
    await database.close();
  }
}

if (await resetThroughApi()) {
  console.log('Reset through the running API (pet, history, and debug time).');
} else {
  console.log(await resetThroughDatabase());
  console.log('API not reachable with debug enabled: if it runs later with shifted debug time, restart it.');
}
console.log('The next launch starts from the Egg.');
