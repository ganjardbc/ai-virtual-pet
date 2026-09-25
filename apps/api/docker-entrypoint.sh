#!/bin/sh
set -e

cd /app

# Apply Drizzle migrations before the server starts. Safe to run on every boot.
echo "[entrypoint] applying database migrations..."
node --input-type=module -e "
import { createDatabase } from './apps/api/dist/db/client.js';
import { runMigrations } from './apps/api/dist/db/migrate.js';
import { requireEnv } from './apps/api/dist/config/env.js';
const connection = createDatabase(requireEnv('DATABASE_URL'));
try {
  await runMigrations(connection.db);
  console.log('[entrypoint] migrations applied');
} finally {
  await connection.close();
}
"

echo "[entrypoint] starting API server..."
exec node apps/api/dist/server.js
