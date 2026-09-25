export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/** The habitat follows the pet's simulated clock (so time travel is visible), in local time. */
export function timeOfDay(simulatedAtIso: string): TimeOfDay {
  const hour = new Date(simulatedAtIso).getHours();

  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}
