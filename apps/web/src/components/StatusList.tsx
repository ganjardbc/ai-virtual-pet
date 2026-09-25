interface StatusRow {
  readonly label: string;
  readonly value: string;
}

/** Descriptive needs only: never raw numbers in Player Mode. */
export function StatusList({ title, rows }: { title: string; rows: readonly StatusRow[] }) {
  return (
    <dl className="status" aria-label={title}>
      {rows.map((row, index) => (
        <div className="status__row" key={row.label}>
          <dt className="status__label">
            <span className={`status__icon status__icon--${index + 1}`} aria-hidden="true" />
            <span className="status__label-text">{row.label}</span>
          </dt>
          <dd className="status__value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
