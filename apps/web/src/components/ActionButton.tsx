import type { ReactNode } from 'react';

interface ActionButtonProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  /** This action's request is in flight. */
  readonly busy?: boolean;
  /** The action is the pet's current state (e.g. Sleeping). */
  readonly active?: boolean;
  /** Why the action is unavailable, announced to assistive technology. */
  readonly hint?: string | undefined;
}

/** Care action: icon plus a required text label. Never shows game formulas. */
export function ActionButton({ icon, label, onClick, disabled, busy, active, hint }: ActionButtonProps) {
  const classes = ['action', busy ? 'action--busy' : '', active ? 'action--active' : ''].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-pressed={active ? true : undefined}
      title={hint}
    >
      <span className="action__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="action__label">{label}</span>
      {hint && <span className="visually-hidden"> ({hint})</span>}
    </button>
  );
}

const iconProps = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const FeedIcon = () => (
  <svg {...iconProps}>
    <path d="M3 11h18a9 9 0 0 1-18 0Z" />
    <path d="M9 7c0-1.5 1-2 1-3.5M14 7c0-1.5 1-2 1-3.5" />
  </svg>
);

export const PlayIcon = () => (
  <svg {...iconProps}>
    <circle cx={12} cy={12} r={9} />
    <path d="M3.5 9.5c5 3 12 3 17 0M3.5 14.5c5-3 12-3 17 0" />
  </svg>
);

export const TalkIcon = () => (
  <svg {...iconProps}>
    <path d="M4 5h16v11H9l-4 4v-4H4Z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
  </svg>
);

export const SleepIcon = () => (
  <svg {...iconProps}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </svg>
);
