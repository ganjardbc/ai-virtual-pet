import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  readonly db: Database;
  close(): Promise<void>;
}

export function createDatabase(url: string, options: { max?: number } = {}): DatabaseConnection {
  const client = postgres(url, { max: options.max ?? 5, onnotice: () => {} });

  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
}
