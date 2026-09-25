import { createContext, useContext, type ReactNode } from 'react';

/** Low-emphasis corner content (the Debug entry), provided once by the app shell. */
export const ShellCornerContext = createContext<ReactNode>(null);

interface GameShellProps {
  readonly title?: string | undefined;
  readonly children: ReactNode;
  readonly variant?: 'default' | 'conversation' | 'home' | 'stage';
}

const variantClass = {
  default: 'game',
  conversation: 'game game--conversation',
  home: 'game game--home',
  stage: 'game game--stage',
} as const;

/** Bounded, centered game container: personal and focused, never a full-width dashboard. */
export function GameShell({ title, children, variant = 'default' }: GameShellProps) {
  const corner = useContext(ShellCornerContext);
  // Full-bleed views fill the screen; only the shared card layout keeps a header.
  const fullBleed = variant !== 'default';

  return (
    <div className={fullBleed ? 'shell shell--home' : 'shell'}>
      <div className="shell__atmosphere" aria-hidden="true">
        <span className="shell__spark shell__spark--one" />
        <span className="shell__spark shell__spark--two" />
        <span className="shell__spark shell__spark--three" />
        <span className="shell__leaf shell__leaf--one" />
        <span className="shell__leaf shell__leaf--two" />
      </div>
      <main className={`${variantClass[variant]}${fullBleed ? ' game--full' : ''}`}>
        {!fullBleed && (title || corner) && (
          <header className="game__header">
            {title ? (
              <div className="game__identity">
                <span className="game__emblem" aria-hidden="true">
                  <svg viewBox="0 0 32 32">
                    <path d="M16 26V11" />
                    <path d="M16 16C10 16 6 12 6 7c6 0 10 3 10 9Z" />
                    <path d="M16 12c0-6 4-9 10-9 0 5-4 9-10 9Z" />
                  </svg>
                </span>
                <div>
                  <span className="game__eyebrow">Teman kecilmu</span>
                  <h1 className="game__title">{title}</h1>
                </div>
              </div>
            ) : (
              <span />
            )}
            {corner}
          </header>
        )}
        {children}
        {variant === 'stage' && corner && <div className="game__corner">{corner}</div>}
      </main>
    </div>
  );
}
