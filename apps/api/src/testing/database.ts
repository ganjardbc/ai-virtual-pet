import { sql } from 'drizzle-orm';

import { optionalEnv } from '../config/env.js';
import { createDatabase, type DatabaseConnection } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';

/** The test database URL, or undefined when integration tests should be skipped. */
export function testDatabaseUrl(): string | undefined {
  const url = optionalEnv('TEST_DATABASE_URL');

  if (url && url === optionalEnv('DATABASE_URL')) {
    throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL: tests truncate all tables.');
  }

  return url;
}

export async function openTestDatabase(url: string): Promise<DatabaseConnection> {
  const connection = createDatabase(url, { max: 2 });
  await runMigrations(connection.db);
  return connection;
}

export async function truncateAll(connection: DatabaseConnection): Promise<void> {
  await connection.db.execute(sql`truncate table events, pet_states, pets restart identity cascade`);
}
