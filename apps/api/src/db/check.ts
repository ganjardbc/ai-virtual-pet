import postgres from 'postgres';

import { requireEnv } from '../config/env.js';

const sql = postgres(requireEnv('DATABASE_URL'), { max: 1 });

try {
  const [result] = await sql<{ database: string }[]>`
    select current_database() as database
  `;

  if (!result) {
    throw new Error('PostgreSQL did not return the current database.');
  }

  console.log(`Connected to PostgreSQL database: ${result.database}`);
} finally {
  await sql.end();
}
