import { useContext } from 'react';

import { ShellCornerContext } from './GameShell';

/** Floating nameplate shared by the full-screen Pet Home and Talk views. */
export function PetIdentity({ name }: { name: string }) {
  const corner = useContext(ShellCornerContext);

  return (
    <div className="game__identity pet-identity">
      <span className="game__emblem" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M16 26V11" />
          <path d="M16 16C10 16 6 12 6 7c6 0 10 3 10 9Z" />
          <path d="M16 12c0-6 4-9 10-9 0 5-4 9-10 9Z" />
        </svg>
      </span>
      <div>
        <span className="game__eyebrow">Teman kecilmu</span>
        <h1 className="game__title">{name}</h1>
      </div>
      {corner && <div className="pet-identity__corner">{corner}</div>}
    </div>
  );
}
