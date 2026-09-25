export type DomainEventType =
  | 'PET_HATCHED'
  | 'PET_NAMED'
  | 'PET_FED'
  | 'PET_PLAYED'
  | 'PET_STARTED_SLEEPING'
  | 'PET_WOKE_UP'
  | 'PET_ACTIVITY_CHANGED'
  | 'ACTION_REJECTED'
  | 'DEBUG_STATE_CHANGED';

export interface DomainEvent {
  readonly type: DomainEventType;
  readonly occurredAt: Date;
  readonly payload: Readonly<Record<string, unknown>>;
}

export function createDomainEvent(
  type: DomainEventType,
  occurredAt: Date,
  payload: Readonly<Record<string, unknown>> = {},
): DomainEvent {
  return { type, occurredAt, payload };
}
