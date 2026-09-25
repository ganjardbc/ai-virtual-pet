import { PET_NAME_MAX_LENGTH, namePetRequestSchema } from '@ai-virtual-pet/contracts';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { ApiError } from '../api/client';
import { Button } from '../components/Button';
import { GameShell } from '../components/GameShell';
import { PetCharacter } from '../components/PetCharacter';
import { SystemMessage } from '../components/SystemMessage';
import { TextInput } from '../components/TextInput';
import { copy } from '../presentation/copy';

/** Let the player meet the pet before the input takes focus. */
const INTRODUCTION_MS = 900;

interface NamingScreenProps {
  readonly onSubmit: (name: string) => Promise<unknown>;
  /** Set once the name is saved: the pet reacts before Pet Home. */
  readonly celebratingName: string | null;
}

export function NamingScreen({ onSubmit, celebratingName }: NamingScreenProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), INTRODUCTION_MS);
    return () => clearTimeout(timer);
  }, []);

  // The shared contract schema is the single source of naming rules (normalization and length).
  const parsedName = namePetRequestSchema.safeParse({ name: value });
  const tooLong = !parsedName.success && parsedName.error.issues.some((issue) => issue.code === 'too_big');
  const fieldError = tooLong ? copy.naming.tooLong(PET_NAME_MAX_LENGTH) : (serverError ?? undefined);
  const canSubmit = parsedName.success && !submitting && !celebratingName;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!parsedName.success || !canSubmit) {
      return;
    }

    setSubmitting(true);
    setServerError(null);
    setSystemError(null);

    try {
      await onSubmit(parsedName.data.name);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        setServerError(error.message);
      } else {
        setSystemError(copy.system.actionFailed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GameShell variant="stage">
      <div className="stage">
        <div className="stage__character">
          <PetCharacter
            expression={celebratingName ? 'excited' : 'happy'}
            motion={celebratingName ? 'bounce' : 'breathe'}
            label={copy.naming.petLabel}
          />
        </div>
        <div className="reaction" aria-live="polite">
          <p className="reaction__speech" key={celebratingName ?? 'ask'}>
            {celebratingName ? copy.naming.celebrate(celebratingName) : copy.naming.ask}
          </p>
        </div>
        <div className="stage__dock">
          <form className="naming" onSubmit={handleSubmit} noValidate hidden={Boolean(celebratingName)}>
            <TextInput
              ref={inputRef}
              id="pet-name"
              label={copy.naming.label}
              placeholder={copy.naming.placeholder}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setServerError(null);
              }}
              autoComplete="off"
              maxLength={PET_NAME_MAX_LENGTH + 10}
              disabled={Boolean(celebratingName)}
              error={fieldError}
            />
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? copy.naming.saving : copy.naming.submit}
            </Button>
          </form>
        </div>
        {systemError && <SystemMessage message={systemError} />}
      </div>
    </GameShell>
  );
}
