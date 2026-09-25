import type { Expression, Motion } from '../presentation/visual';

interface PetCharacterProps {
  readonly expression: Expression;
  readonly motion: Motion;
  /** Accessible description; the pose alone must never carry the state. */
  readonly label: string;
}

/** How far the head sprout droops (degrees). It perks up when happy and wilts when tired. */
const SPROUT_ANGLE: Record<Expression, number> = {
  excited: -8,
  curious: -10,
  happy: 0,
  eating: 0,
  neutral: 4,
  content: 10,
  hungry: 26,
  sleepy: 34,
  tired: 42,
  sleeping: 50,
};

const INK = 'var(--pet-ink)';

function Eyes({ expression }: { expression: Expression }) {
  const arcUp = (x: number) => `M${x - 8} 116 Q${x} 106 ${x + 8} 116`;
  const arcDown = (x: number) => `M${x - 8} 114 Q${x} 121 ${x + 8} 114`;
  const halfOpen = (x: number) => `M${x - 8} 113 A8 6 0 0 0 ${x + 8} 113 Z`;
  const line = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };

  switch (expression) {
    case 'happy':
    case 'content':
    case 'eating':
      return (
        <g>
          <path d={arcUp(78)} {...line} />
          <path d={arcUp(122)} {...line} />
        </g>
      );
    case 'sleeping':
      return (
        <g>
          <path d={arcDown(78)} {...line} />
          <path d={arcDown(122)} {...line} />
        </g>
      );
    case 'sleepy':
    case 'tired':
      return (
        <g>
          <path d={halfOpen(78)} fill={INK} />
          <path d={halfOpen(122)} fill={INK} />
          {expression === 'tired' && (
            <g {...line} strokeWidth={3}>
              <path d="M69 101 L86 97" />
              <path d="M131 101 L114 97" />
            </g>
          )}
        </g>
      );
    case 'excited':
      return (
        <g className="pet__eyes pet__eyes--blink">
          <ellipse cx={78} cy={113} rx={9} ry={11} fill={INK} />
          <ellipse cx={122} cy={113} rx={9} ry={11} fill={INK} />
          <circle cx={81} cy={108} r={3.2} fill="#fff" />
          <circle cx={125} cy={108} r={3.2} fill="#fff" />
          <circle cx={75} cy={118} r={1.6} fill="#fff" />
          <circle cx={119} cy={118} r={1.6} fill="#fff" />
        </g>
      );
    case 'hungry':
      return (
        <g>
          <g className="pet__eyes pet__eyes--blink">
            <ellipse cx={78} cy={117} rx={7} ry={8} fill={INK} />
            <ellipse cx={122} cy={117} rx={7} ry={8} fill={INK} />
            <circle cx={79} cy={114} r={2.2} fill="#fff" />
            <circle cx={123} cy={114} r={2.2} fill="#fff" />
          </g>
          <g {...line} strokeWidth={3}>
            {/* Worried: inner ends raised (lowered inner ends would read as angry). */}
            <path d="M70 105 L85 99" />
            <path d="M130 105 L115 99" />
          </g>
        </g>
      );
    case 'curious':
      return (
        <g className="pet__eyes pet__eyes--blink">
          <ellipse cx={82} cy={113} rx={7} ry={9} fill={INK} />
          <ellipse cx={126} cy={112} rx={8} ry={10} fill={INK} />
          <circle cx={85} cy={109} r={2.4} fill="#fff" />
          <circle cx={129} cy={108} r={2.6} fill="#fff" />
          <path d="M116 96 Q126 90 135 96" {...line} strokeWidth={3} />
        </g>
      );
    default:
      return (
        <g className="pet__eyes pet__eyes--blink">
          <ellipse cx={78} cy={114} rx={7} ry={9} fill={INK} />
          <ellipse cx={122} cy={114} rx={7} ry={9} fill={INK} />
          <circle cx={80.5} cy={110.5} r={2.4} fill="#fff" />
          <circle cx={124.5} cy={110.5} r={2.4} fill="#fff" />
        </g>
      );
  }
}

function Mouth({ expression }: { expression: Expression }) {
  const line = { stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };

  switch (expression) {
    case 'excited':
      return <path d="M89 136 Q100 136 111 136 Q108 150 100 150 Q92 150 89 136 Z" fill={INK} />;
    case 'eating':
      return <ellipse className="pet__chew" cx={100} cy={141} rx={7} ry={5} fill={INK} />;
    case 'hungry':
      return <path d="M90 143 q5 -5 10 0 q5 5 10 0" {...line} />;
    case 'tired':
      return <path d="M93 143 L107 143" {...line} />;
    case 'sleeping':
    case 'curious':
      return <circle cx={100} cy={141} r={3.5} fill={INK} />;
    case 'sleepy':
      return <ellipse cx={100} cy={142} rx={4} ry={5} fill={INK} />;
    default:
      return <path d="M90 137 Q100 147 110 137" {...line} />;
  }
}

/** Placeholder Baby: a mint dumpling with a head sprout. Eyes, sprout, and motion carry emotion. */
export function PetCharacter({ expression, motion, label }: PetCharacterProps) {
  return (
    <div className={`pet pet--${motion}`} role="img" aria-label={label}>
      <svg viewBox="0 0 200 200" className="pet__svg" aria-hidden="true">
        <ellipse className="pet__shadow" cx={100} cy={184} rx={58} ry={8} />
        <g className="pet__body">
          <g
            className="pet__sprout"
            style={{ transform: `rotate(${SPROUT_ANGLE[expression]}deg)` }}
          >
            <path d="M100 62 C100 52 100 45 100 36" stroke="var(--pet-outline)" strokeWidth={4} strokeLinecap="round" fill="none" />
            <path d="M100 42 C88 30 76 31 71 39 C81 46 92 46 100 42 Z" fill="var(--pet-leaf)" stroke="var(--pet-outline)" strokeWidth={3} strokeLinejoin="round" />
            <path d="M100 37 C110 23 124 23 130 31 C121 39 109 41 100 37 Z" fill="var(--pet-leaf)" stroke="var(--pet-outline)" strokeWidth={3} strokeLinejoin="round" />
          </g>
          <ellipse cx={74} cy={176} rx={15} ry={7} fill="var(--pet-body-shade)" stroke="var(--pet-outline)" strokeWidth={3} />
          <ellipse cx={126} cy={176} rx={15} ry={7} fill="var(--pet-body-shade)" stroke="var(--pet-outline)" strokeWidth={3} />
          <path
            d="M100 58 C148 58 170 98 170 132 C170 162 140 178 100 178 C60 178 30 162 30 132 C30 98 52 58 100 58 Z"
            fill="var(--pet-body)"
            stroke="var(--pet-outline)"
            strokeWidth={3.5}
          />
          <path d="M52 110 C56 88 72 74 92 70" stroke="#fff" strokeOpacity={0.55} strokeWidth={6} strokeLinecap="round" fill="none" />
          <circle cx={62} cy={133} r={9} fill="var(--pet-blush)" />
          <circle cx={138} cy={133} r={9} fill="var(--pet-blush)" />
          <Eyes expression={expression} />
          <Mouth expression={expression} />
        </g>
        {expression === 'sleeping' && (
          <g className="pet__zz" fill="var(--pet-ink)" aria-hidden="true">
            <text x={150} y={70} fontSize={18}>z</text>
            <text x={162} y={52} fontSize={24}>Z</text>
          </g>
        )}
      </svg>
    </div>
  );
}
