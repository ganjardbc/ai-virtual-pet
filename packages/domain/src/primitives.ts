export type PetId = string;
export type PetName = string;
export type StatValue = number;

export const STAT_MIN = 0;
export const STAT_MAX = 100;
export const PET_NAME_MAX_LENGTH = 30;

function requireFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
}

export function clampStat(value: number): StatValue {
  requireFiniteNumber(value, 'Stat value');
  return Math.min(STAT_MAX, Math.max(STAT_MIN, value));
}

export function requireStat(value: number, label = 'Stat value'): StatValue {
  requireFiniteNumber(value, label);

  if (value < STAT_MIN || value > STAT_MAX) {
    throw new RangeError(`${label} must be between ${STAT_MIN} and ${STAT_MAX}.`);
  }

  return value;
}

export function createPetId(value: string): PetId {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError('Pet ID cannot be empty.');
  }

  return normalized;
}

/** Zero-width characters are invisible, so a name made only of them would render as blank. */
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/g;

export function normalizePetName(value: string): string {
  return value.replace(INVISIBLE_CHARACTERS, '').trim().replace(/\s+/g, ' ');
}

export function createPetName(value: string): PetName {
  const normalized = normalizePetName(value);

  if (normalized.length === 0 || normalized.length > PET_NAME_MAX_LENGTH) {
    throw new RangeError(`Pet name must contain 1–${PET_NAME_MAX_LENGTH} characters.`);
  }

  return normalized;
}

export function requireValidDate(value: Date, label: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new TypeError(`${label} must be a valid Date.`);
  }

  return value;
}

/** A UTC calendar day, formatted `YYYY-MM-DD`. Daily caps reset when it changes. */
export type DayBucket = string;

const DAY_BUCKET_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The UTC day containing `at`. Callers pass the injected Clock's time, never wall-clock time,
 * so debug time travel crosses day boundaries too.
 */
export function utcDayBucket(at: Date): DayBucket {
  return requireValidDate(at, 'at').toISOString().slice(0, 10);
}

export function requireDayBucket(value: string, label: string): DayBucket {
  if (!DAY_BUCKET_PATTERN.test(value) || utcDayBucket(new Date(`${value}T00:00:00.000Z`)) !== value) {
    throw new RangeError(`${label} must be a UTC day formatted YYYY-MM-DD.`);
  }

  return value;
}
