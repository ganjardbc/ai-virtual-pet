import type { StatRow } from '../presentation/pet-stats';

/** Descriptive needs as horizontal bars. Never shows raw numbers in Player Mode. */
export function PetStats({ title, rows }: { title: string; rows: readonly StatRow[] }) {
  return (
    <dl className="stats" aria-label={title}>
      {rows.map((row, index) => {
        const percent = Math.round(Math.max(0, Math.min(1, row.ratio)) * 100);

        return (
          <div className="stats__row" key={row.label}>
            <dt className="stats__label">
              <span className={`stats__icon stats__icon--${index + 1}`} aria-hidden="true" />
              <span className="stats__name">{row.label}</span>
            </dt>
            <dd className="stats__body">
              <span className="stats__value">{row.value}</span>
              <span className="stats__track">
                <span className="stats__fill" style={{ width: `${percent}%` }} />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
