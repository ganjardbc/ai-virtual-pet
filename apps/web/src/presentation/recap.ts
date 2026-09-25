import type { PetEventDto } from '@ai-virtual-pet/contracts';

/** Simulated time that must pass before the pet greets the player as "returning". */
export const MEANINGFUL_ABSENCE_MS = 3 * 60 * 60 * 1_000;
const MAX_RECAP_ITEMS = 3;

/**
 * "While you were away" items built only from things that really happened on their own
 * (autonomous sleep and activity changes) after `sinceIso`. Player and debug actions,
 * rejections, and wake-ups are not recapped.
 */
export function recapItems(events: readonly PetEventDto[], sinceIso: string): string[] {
  const since = Date.parse(sinceIso);
  const happened = [...events]
    .filter((event) => Date.parse(event.occurredAt) > since)
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.id - b.id);

  const naps = happened.filter(
    (event) => event.type === 'PET_STARTED_SLEEPING' && event.payload.source === 'AUTONOMOUS',
  ).length;
  const items: string[] = [];
  const add = (item: string) => {
    if (!items.includes(item)) {
      items.push(item);
    }
  };

  for (const event of happened) {
    if (event.type === 'PET_STARTED_SLEEPING' && event.payload.source === 'AUTONOMOUS') {
      add(naps > 1 ? 'Tidur beberapa kali' : 'Sempat tidur');
    }

    if (event.type === 'PET_ACTIVITY_CHANGED') {
      switch (event.payload.to) {
        case 'PLAYING_ALONE':
          add('Bermain sendiri');
          break;
        case 'RESTING':
          add('Beristirahat sebentar');
          break;
        case 'LOOKING_AROUND':
          add('Melihat-lihat');
          break;
        default:
          break;
      }
    }
  }

  return items.slice(0, MAX_RECAP_ITEMS);
}
