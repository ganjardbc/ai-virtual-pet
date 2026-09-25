import type { ReactNode } from 'react';

import type { Pose } from '../presentation/visual';
import type { TimeOfDay } from '../presentation/time-of-day';

interface HabitatProps {
  readonly timeOfDay: TimeOfDay;
  readonly pose: Pose;
  readonly children: ReactNode;
  readonly reaction?: ReactNode;
}

/**
 * The pet's nook. Fixed height so the layout never jumps; the sky follows the pet's
 * simulated clock. Decorative parts are hidden from assistive technology.
 */
export function Habitat({ timeOfDay, pose, children, reaction }: HabitatProps) {
  return (
    <div className={`habitat habitat--${timeOfDay}`}>
      <div className="habitat__sky" aria-hidden="true">
        <span className="habitat__orb" />
        <span className="habitat__cloud habitat__cloud--a" />
        <span className="habitat__cloud habitat__cloud--b" />
        <span className="habitat__star habitat__star--a" />
        <span className="habitat__star habitat__star--b" />
        <span className="habitat__star habitat__star--c" />
        <span className="habitat__star habitat__star--d" />
      </div>
      <div className="habitat__hill habitat__hill--far" aria-hidden="true" />
      <div className="habitat__hill habitat__hill--near" aria-hidden="true" />
      <div className="habitat__floor" aria-hidden="true" />
      <div className="habitat__tree" aria-hidden="true">
        <span className="habitat__tree-crown habitat__tree-crown--a" />
        <span className="habitat__tree-crown habitat__tree-crown--b" />
        <span className="habitat__tree-crown habitat__tree-crown--c" />
        <span className="habitat__tree-trunk" />
      </div>
      <div className="habitat__garden" aria-hidden="true">
        <span className="habitat__flower habitat__flower--a" />
        <span className="habitat__flower habitat__flower--b" />
        <span className="habitat__flower habitat__flower--c" />
      </div>
      <svg className="habitat__bed" viewBox="0 0 160 60" aria-hidden="true">
        <ellipse cx={80} cy={40} rx={76} ry={18} fill="var(--habitat-bed-shade)" />
        <ellipse cx={80} cy={34} rx={70} ry={16} fill="var(--habitat-bed)" />
        <ellipse cx={80} cy={31} rx={48} ry={8} fill="var(--habitat-bed-shade)" opacity={0.55} />
      </svg>
      <svg className="habitat__toy" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx={20} cy={20} r={17} fill="var(--color-action-secondary)" />
        <path d="M5 16 C14 22 26 22 35 16" stroke="#fff" strokeWidth={3} fill="none" opacity={0.85} />
        <path d="M8 29 C16 25 24 25 32 29" stroke="#fff" strokeWidth={3} fill="none" opacity={0.6} />
      </svg>
      <div className={`habitat__pet habitat__pet--${pose}`}>{children}</div>
      {reaction && (
        <div className={`habitat__reaction habitat__reaction--${pose}`}>{reaction}</div>
      )}
      <span className="habitat__shine" aria-hidden="true" />
    </div>
  );
}
