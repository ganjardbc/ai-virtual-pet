import type { ReactNode } from 'react';

/** System Voice: neutral, specific, never the pet's feelings. */
export function SystemMessage({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="system-message" role="alert" tabIndex={-1}>
      <span className="system-message__icon" aria-hidden="true">
        !
      </span>
      <p className="system-message__text">{message}</p>
      {action}
    </div>
  );
}
