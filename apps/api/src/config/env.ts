import { config } from 'dotenv';

let loaded = false;

/** Loads the repository-root `.env` once. Existing process variables take precedence. */
export function loadEnv(): void {
  if (!loaded) {
    config({ path: new URL('../../../../.env', import.meta.url), quiet: true });
    loaded = true;
  }
}

export function requireEnv(name: string): string {
  loadEnv();
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and configure it.`);
  }

  return value;
}

export function optionalEnv(name: string): string | undefined {
  loadEnv();
  return process.env[name] || undefined;
}
