import { copy } from '../presentation/copy';

interface EggCharacterProps {
  readonly hatching: boolean;
}

/** Placeholder Egg: occasional wobble while waiting; shakes, cracks, and bursts while hatching. */
export function EggCharacter({ hatching }: EggCharacterProps) {
  return (
    <div
      className={`egg ${hatching ? 'egg--hatching' : 'egg--idle'}`}
      role="img"
      aria-label={hatching ? copy.egg.hatchingLabel : copy.egg.idleLabel}
    >
      <svg viewBox="0 0 200 220" className="egg__svg" aria-hidden="true">
        <ellipse className="pet__shadow" cx={100} cy={208} rx={56} ry={8} />
        <g className="egg__shell">
          <path
            d="M100 22 C146 22 170 96 170 140 C170 184 138 206 100 206 C62 206 30 184 30 140 C30 96 54 22 100 22 Z"
            fill="var(--egg-shell)"
            stroke="var(--pet-outline)"
            strokeWidth={3.5}
          />
          <circle cx={78} cy={84} r={9} fill="var(--egg-spot)" />
          <circle cx={124} cy={112} r={13} fill="var(--egg-spot)" />
          <circle cx={84} cy={152} r={7} fill="var(--egg-spot)" />
          <circle cx={134} cy={168} r={6} fill="var(--egg-spot)" />
          <path d="M60 110 C62 80 76 56 94 46" stroke="#fff" strokeOpacity={0.7} strokeWidth={7} strokeLinecap="round" fill="none" />
          <path
            className="egg__crack"
            d="M42 120 L62 110 L74 124 L90 106 L104 122 L118 104 L132 120 L146 108 L160 118"
            stroke="var(--pet-outline)"
            strokeWidth={3.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <g className="egg__burst" fill="var(--color-action-primary)">
          <path d="M100 6 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 Z" />
          <path d="M28 70 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" />
          <path d="M172 76 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" />
        </g>
      </svg>
    </div>
  );
}
