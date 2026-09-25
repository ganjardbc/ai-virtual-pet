import { Button } from '../components/Button';
import { EggCharacter } from '../components/EggCharacter';
import { GameShell } from '../components/GameShell';
import { SystemMessage } from '../components/SystemMessage';
import { copy } from '../presentation/copy';

interface EggScreenProps {
  readonly hatching: boolean;
  readonly onHatch: () => void;
  readonly error?: string | null;
}

/** First contact: the egg is the focus, with one action. No needs, no navigation. */
export function EggScreen({ hatching, onHatch, error }: EggScreenProps) {
  return (
    <GameShell>
      <div className="stage">
        <div className="stage__character">
          <EggCharacter hatching={hatching} />
        </div>
        <p className="stage__prompt" aria-live="polite">
          {hatching ? copy.egg.hatching : copy.egg.prompt}
        </p>
        <Button onClick={onHatch} disabled={hatching}>
          {copy.egg.hatch}
        </Button>
        {error && !hatching && <SystemMessage message={error} />}
      </div>
    </GameShell>
  );
}
