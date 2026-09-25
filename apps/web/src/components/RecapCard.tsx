import { copy } from '../presentation/copy';

export function RecapCard({ items, onDismiss }: { items: readonly string[]; onDismiss: () => void }) {
  return (
    <section className="recap" aria-labelledby="recap-title">
      <div className="recap__header">
        <h2 id="recap-title" className="recap__title">
          {copy.recap.title}
        </h2>
        <button type="button" className="recap__dismiss" onClick={onDismiss} aria-label={copy.recap.dismiss}>
          ×
        </button>
      </div>
      <ul className="recap__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
