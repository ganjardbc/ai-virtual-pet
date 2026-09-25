import type { ChatAction, DebugAi, DebugSetPersonalityRequest, DebugState } from '@ai-virtual-pet/contracts';
import { useState, type FormEvent } from 'react';

import {
  ADVANCE_PRESETS,
  DEBUG_STATS,
  formatNumber,
  formatOffset,
  formatPayload,
  formatSignedDelta,
  formatStat,
  formatTime,
  formatTrait,
  PERSONALITY_PRESET_OPTIONS,
  PERSONALITY_TRAITS,
  type AdvancePreset,
  type DebugStat,
  type DebugTrait,
} from './format';

export type DebugViewStatus = 'loading' | 'ready' | 'no-pet' | 'disabled' | 'error';

export interface DebugPanelViewProps {
  readonly status: DebugViewStatus;
  readonly state?: DebugState | undefined;
  readonly ai?: DebugAi | undefined;
  readonly feedback: string | null;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onAdvance: (preset: AdvancePreset) => void;
  readonly onSleep: () => void;
  readonly onWake: () => void;
  readonly onSet: (stat: DebugStat, value: number) => void;
  readonly onSetPersonality: (body: DebugSetPersonalityRequest) => void;
  readonly onReset: () => void;
}

const STATUS_TEXT: Record<Exclude<DebugViewStatus, 'ready'>, string> = {
  loading: 'Loading debug state…',
  'no-pet': 'No pet yet. Hatch the egg to inspect state.',
  disabled: 'Debug API is disabled on the server (set ENABLE_DEBUG_API=true).',
  error: 'Could not load debug state.',
};

function StatRow({ stat, value, busy, onSet }: { stat: DebugStat; value: number; busy: boolean; onSet: DebugPanelViewProps['onSet'] }) {
  const [draft, setDraft] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(draft);

    if (draft.trim() !== '' && Number.isFinite(parsed)) {
      onSet(stat, parsed);
      setDraft('');
    }
  };

  return (
    <form className="debug__stat" onSubmit={submit}>
      <label className="debug__key" htmlFor={`debug-${stat}`}>
        {stat}
      </label>
      <output className="debug__value">{formatStat(value)}</output>
      <input
        id={`debug-${stat}`}
        className="debug__input"
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        max={100}
        placeholder="0–100"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="submit" className="debug__button" disabled={busy || draft.trim() === ''}>
        Set
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="debug__row">
      <dt className="debug__key">{label}</dt>
      <dd className="debug__value">{value}</dd>
    </div>
  );
}

/** Raw trait with today's applied delta against the cap, so caps are debuggable (Tasks 10.1, 10.2). */
function TraitRow({
  trait,
  value,
  delta,
  cap,
  busy,
  onSet,
}: {
  trait: DebugTrait;
  value: number;
  delta: number;
  cap: number;
  busy: boolean;
  onSet: DebugPanelViewProps['onSetPersonality'];
}) {
  const [draft, setDraft] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(draft);

    if (draft.trim() !== '' && Number.isFinite(parsed)) {
      onSet({ [trait]: parsed });
      setDraft('');
    }
  };

  return (
    <form className="debug__trait" onSubmit={submit}>
      <div className="debug__trait-info">
        <label className="debug__trait-name" htmlFor={`debug-trait-${trait}`}>
          {trait[0]!.toUpperCase() + trait.slice(1)}
        </label>
        <output className="debug__trait-value">{formatTrait(value)}</output>
        <span className="debug__trait-delta">
          {formatSignedDelta(delta)} / {formatTrait(cap)}
        </span>
      </div>
      <div className="debug__trait-controls">
        <input
          id={`debug-trait-${trait}`}
          className="debug__input debug__trait-input"
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0.05}
          max={0.95}
          placeholder="0.05–0.95"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="debug__button" disabled={busy || draft.trim() === ''}>
          Set
        </button>
      </div>
    </form>
  );
}

function formatAction(action: ChatAction | null): string {
  if (!action) {
    return '—';
  }

  return action.status === 'SUCCESS' ? `${action.type} SUCCESS` : `${action.type} REJECTED (${action.reason})`;
}

/** Dense, tool-like presentation of raw state (design system §44). Separate from Player Mode. */
export function DebugPanelView(props: DebugPanelViewProps) {
  const { status, state, feedback, busy } = props;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const pet = state?.pet;
  const personality = props.ai?.personality ?? null;
  const context = props.ai?.context ?? null;

  return (
    <aside className="debug" aria-labelledby="debug-title">
      <header className="debug__header">
        <h2 id="debug-title" className="debug__title">
          Debug
        </h2>
        <button type="button" className="debug__close" onClick={props.onClose} aria-label="Close debug panel">
          ×
        </button>
      </header>

      <p className="debug__feedback" role="status">
        {feedback ?? (status === 'ready' ? '' : STATUS_TEXT[status])}
      </p>

      {pet && (
        <>
          <section className="debug__section" aria-label="State">
            <h3 className="debug__heading">State</h3>
            {DEBUG_STATS.map((stat) => (
              <StatRow key={stat} stat={stat} value={pet.state[stat]} busy={busy} onSet={props.onSet} />
            ))}
          </section>

          <section className="debug__section" aria-label="Derived state">
            <h3 className="debug__heading">Derived</h3>
            <dl className="debug__list">
              <Row label="stage" value={pet.pet.stage} />
              <Row label="activity" value={pet.state.currentActivity} />
              <Row label="mood" value={pet.derived.mood} />
              <Row label="fullness" value={pet.derived.needs.fullness} />
              <Row label="energy" value={pet.derived.needs.energy} />
              <Row label="happiness" value={pet.derived.needs.happiness} />
              <Row
                label="scores"
                value={state.debug.moodCandidates.map((c) => `${c.mood} ${c.score.toFixed(1)}`).join(' · ')}
              />
            </dl>
          </section>
        </>
      )}

          {personality && (
            <section className="debug__section" aria-label="Personality">
              <h3 className="debug__heading">Personality</h3>
              <dl className="debug__list">
                <Row label="Dominant" value={personality.profile.dominantTraits.join(', ') || 'none'} />
                <Row label="Primary" value={personality.profile.primaryTrait} />
                <Row label="Strength" value={personality.profile.strength} />
                <Row label="Social style" value={personality.profile.socialStyle} />
                <Row label="Delta day" value={personality.daily.day ?? '—'} />
              </dl>
              {PERSONALITY_TRAITS.map((trait) => (
                <TraitRow
                  key={trait}
                  trait={trait}
                  value={personality.traits[trait]}
                  delta={personality.daily.deltas[trait]}
                  cap={personality.daily.capPerTrait}
                  busy={busy}
                  onSet={props.onSetPersonality}
                />
              ))}
              <div className="debug__grid" role="group" aria-label="Personality presets">
                {PERSONALITY_PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    className="debug__button"
                    disabled={busy}
                    onClick={() => props.onSetPersonality({ preset: option.name })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {personality && (
            <section className="debug__section" aria-label="Last AI turn">
              <h3 className="debug__heading">Last AI turn</h3>
              {props.ai?.lastTurn ? (
                <dl className="debug__list">
                  <Row label="Intent" value={props.ai.lastTurn.intent ?? '—'} />
                  <Row label="Confidence" value={formatNumber(props.ai.lastTurn.confidence, 2)} />
                  <Row label="Classification" value={props.ai.lastTurn.classification ?? '—'} />
                  <Row label="Action" value={formatAction(props.ai.lastTurn.action)} />
                  <Row label="Provider" value={props.ai.lastTurn.provider ?? '—'} />
                  <Row label="Model" value={props.ai.lastTurn.model ?? '—'} />
                  <Row
                    label="Latency"
                    value={props.ai.lastTurn.latencyMs === null ? '—' : `${props.ai.lastTurn.latencyMs} ms`}
                  />
                  <Row
                    label="Tokens"
                    value={`${formatNumber(props.ai.lastTurn.inputTokens)} / ${formatNumber(props.ai.lastTurn.outputTokens)}`}
                  />
                  <Row label="Fallback used" value={props.ai.lastTurn.fallbackUsed ? 'yes' : 'no'} />
                </dl>
              ) : (
                <p className="debug__hint">No chat turn yet.</p>
              )}
            </section>
          )}

          {context && (
            <section className="debug__section" aria-label="Context">
              <h3 className="debug__heading">Context</h3>
              <dl className="debug__list">
                <Row label="Mood" value={context.mood} />
                <Row label="Relationship" value={context.relationship} />
                <Row label="Messages" value={`${context.recentMessageCount} recent`} />
                <Row label="Events" value={`${context.recentEventCount} recent`} />
                <Row
                  label="Levels"
                  value={PERSONALITY_TRAITS.map((trait) => `${trait} ${context.levels[trait]}`).join(' · ')}
                />
              </dl>
            </section>
          )}

      {pet && (
        <>
          <section className="debug__section" aria-label="Time">
            <h3 className="debug__heading">Time</h3>
            <dl className="debug__list">
              <Row label="now" value={formatTime(state.debug.clock.now)} />
              <Row label="offset" value={formatOffset(state.debug.clock.offsetMs)} />
              <Row label="lastInteractionAt" value={formatTime(pet.state.lastInteractionAt)} />
              <Row label="lastSimulatedAt" value={formatTime(pet.state.lastSimulatedAt)} />
              <Row label="sleepStartedAt" value={formatTime(pet.state.sleepStartedAt)} />
            </dl>
            <div className="debug__grid" role="group" aria-label="Advance time">
              {ADVANCE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="debug__button"
                  disabled={busy}
                  onClick={() => props.onAdvance(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {(status === 'ready' || status === 'no-pet') && (
        <section className="debug__section" aria-label="Commands">
          <h3 className="debug__heading">Commands</h3>
          <div className="debug__commands">
            {pet && (
              <>
                <button type="button" className="debug__button" disabled={busy} onClick={props.onSleep}>
                  Force Sleep
                </button>
                <button type="button" className="debug__button" disabled={busy} onClick={props.onWake}>
                  Wake Pet
                </button>
              </>
            )}
            <button
              type="button"
              className="debug__button debug__button--danger"
              disabled={busy}
              onClick={() => setConfirmingReset(true)}
            >
              Reset Pet
            </button>
          </div>
          {confirmingReset && (
            <div className="debug__confirm" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-text">
              <p id="reset-title" className="debug__confirm-title">
                Reset pet?
              </p>
              <p id="reset-text">This will remove current prototype progress.</p>
              <div className="debug__commands">
                <button type="button" className="debug__button" onClick={() => setConfirmingReset(false)} autoFocus>
                  Cancel
                </button>
                <button
                  type="button"
                  className="debug__button debug__button--danger"
                  onClick={() => {
                    setConfirmingReset(false);
                    props.onReset();
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {state && (
        <section className="debug__section" aria-label="Recent events">
          <h3 className="debug__heading">Recent events</h3>
          <ol className="debug__events">
            {state.debug.events.map((event) => {
              const payload = formatPayload(event.payload);

              return (
                <li key={event.id} className="debug__event">
                  <details>
                    <summary>
                      <time dateTime={event.occurredAt}>{formatTime(event.occurredAt)}</time> {event.type}
                    </summary>
                    {payload && <code className="debug__payload">{payload}</code>}
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </aside>
  );
}
