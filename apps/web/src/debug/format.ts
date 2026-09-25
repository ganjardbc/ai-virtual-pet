import type { DebugAdvanceTimeRequest, PersonalityPresetDto } from '@ai-virtual-pet/contracts';

export interface AdvancePreset {
  readonly label: string;
  readonly request: DebugAdvanceTimeRequest;
  readonly done: string;
}

/** Required time-travel controls (scope §55). */
export const ADVANCE_PRESETS: readonly AdvancePreset[] = [
  { label: '+1h', request: { hours: 1 }, done: 'Advanced 1 hour' },
  { label: '+6h', request: { hours: 6 }, done: 'Advanced 6 hours' },
  { label: '+12h', request: { hours: 12 }, done: 'Advanced 12 hours' },
  { label: '+1d', request: { days: 1 }, done: 'Advanced 1 day' },
  { label: '+3d', request: { days: 3 }, done: 'Advanced 3 days' },
  { label: '+7d', request: { days: 7 }, done: 'Advanced 7 days' },
];

export const DEBUG_STATS = ['hunger', 'energy', 'happiness', 'bond'] as const;
export type DebugStat = (typeof DEBUG_STATS)[number];

/** Debug personality traits, in canonical order (plan Task 10.1). */
export const PERSONALITY_TRAITS = ['playful', 'curious', 'shy', 'independent', 'clingy'] as const;
export type DebugTrait = (typeof PERSONALITY_TRAITS)[number];

export interface PersonalityPresetOption {
  readonly name: PersonalityPresetDto;
  readonly label: string;
}

/** Deterministic presets (plan Task 10.4), reusing the domain's evaluation presets. */
export const PERSONALITY_PRESET_OPTIONS: readonly PersonalityPresetOption[] = [
  { name: 'BALANCED', label: 'Balanced' },
  { name: 'HIGH_PLAYFUL', label: 'Playful' },
  { name: 'HIGH_CURIOUS', label: 'Curious' },
  { name: 'HIGH_SHY', label: 'Shy' },
  { name: 'HIGH_INDEPENDENT', label: 'Independent' },
  { name: 'HIGH_CLINGY', label: 'Clingy' },
];

export function formatStat(value: number): string {
  return value.toFixed(2);
}

/** Raw personality traits: three decimals, matching the domain's stored precision (Task 10.1). */
export function formatTrait(value: number): string {
  return value.toFixed(3);
}

/** Signed trait delta, e.g. `+0.018` (Task 10.2). */
export function formatSignedDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

/** Turn metadata numbers that may be absent (plan Task 10.5). */
export function formatNumber(value: number | null, digits = 0): string {
  return value === null ? '—' : value.toFixed(digits);
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function formatTime(iso: string | null): string {
  return iso ? timeFormat.format(new Date(iso)) : '—';
}

export function formatOffset(ms: number): string {
  if (ms <= 0) {
    return 'real time';
  }

  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : ''].filter(Boolean);

  return `+${parts.join(' ') || '0m'}`;
}

/** Compact one-line payload; numbers rounded so deltas stay readable. */
export function formatPayload(payload: Record<string, unknown>): string {
  const text = JSON.stringify(payload, (_key, value: unknown) =>
    typeof value === 'number' && !Number.isInteger(value) ? Number(value.toFixed(3)) : value,
  );

  return text === '{}' ? '' : text;
}
