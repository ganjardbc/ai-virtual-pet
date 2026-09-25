import { OPENAI_COMPATIBLE, OpenAICompatibleProvider, type OpenAICompatibleDependencies } from './openai-compatible.js';
import { UnavailableAIProvider, type AIProvider } from './provider.js';

/** Per-stage timeouts and the whole-turn budget (plan Task 4.4). */
export interface AITimeouts {
  readonly interpretationMs: number;
  readonly responseMs: number;
  readonly turnBudgetMs: number;
}

export const DEFAULT_AI_TIMEOUTS: AITimeouts = Object.freeze({
  interpretationMs: 5_000,
  responseMs: 10_000,
  turnBudgetMs: 15_000,
});

export interface AIConfig {
  readonly provider: typeof OPENAI_COMPATIBLE;
  readonly baseUrl: string | undefined;
  readonly model: string | undefined;
  readonly apiKey: string | undefined;
  readonly jsonMode: boolean;
  readonly timeouts: AITimeouts;
}

type Environment = Readonly<Record<string, string | undefined>>;

/**
 * Reads AI settings (DEC-061). A wrong setting (unknown provider, bad number) is a startup error;
 * missing credentials are not — the game runs and Talk reports AI_UNAVAILABLE.
 */
export function loadAIConfig(env: Environment): AIConfig {
  const provider = value(env.AI_PROVIDER) ?? OPENAI_COMPATIBLE;

  if (provider !== OPENAI_COMPATIBLE) {
    throw new Error(`AI_PROVIDER "${provider}" is not supported. Use "${OPENAI_COMPATIBLE}".`);
  }

  return {
    provider,
    baseUrl: value(env.AI_BASE_URL),
    model: value(env.AI_MODEL),
    apiKey: value(env.AI_API_KEY),
    jsonMode: flag(env.AI_JSON_MODE, 'AI_JSON_MODE'),
    timeouts: {
      interpretationMs: milliseconds(env.AI_INTERPRETATION_TIMEOUT_MS, 'AI_INTERPRETATION_TIMEOUT_MS', DEFAULT_AI_TIMEOUTS.interpretationMs),
      responseMs: milliseconds(env.AI_RESPONSE_TIMEOUT_MS, 'AI_RESPONSE_TIMEOUT_MS', DEFAULT_AI_TIMEOUTS.responseMs),
      turnBudgetMs: milliseconds(env.AI_TURN_BUDGET_MS, 'AI_TURN_BUDGET_MS', DEFAULT_AI_TIMEOUTS.turnBudgetMs),
    },
  };
}

export function createAIProvider(config: AIConfig, deps: OpenAICompatibleDependencies = {}): AIProvider {
  const missing = [
    ['AI_BASE_URL', config.baseUrl],
    ['AI_MODEL', config.model],
    ['AI_API_KEY', config.apiKey],
  ].flatMap(([name, setting]) => (setting ? [] : [name]));

  if (!config.baseUrl || !config.model || !config.apiKey) {
    return new UnavailableAIProvider(config.provider, `Not configured: ${missing.join(', ')}.`);
  }

  return new OpenAICompatibleProvider(
    { baseUrl: config.baseUrl, model: config.model, apiKey: config.apiKey, jsonMode: config.jsonMode },
    deps,
  );
}

function value(setting: string | undefined): string | undefined {
  const trimmed = setting?.trim();
  return trimmed ? trimmed : undefined;
}

function flag(setting: string | undefined, name: string): boolean {
  const normalized = value(setting)?.toLowerCase();

  if (normalized === undefined || normalized === 'false') {
    return false;
  }

  if (normalized === 'true') {
    return true;
  }

  throw new Error(`${name} must be "true" or "false".`);
}

function milliseconds(setting: string | undefined, name: string, fallback: number): number {
  const raw = value(setting);

  if (raw === undefined) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive whole number of milliseconds.`);
  }

  return parsed;
}
