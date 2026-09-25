import { Button } from '../components/Button';
import { GameShell } from '../components/GameShell';
import { SystemMessage } from '../components/SystemMessage';
import { copy } from '../presentation/copy';

export function LoadingScreen() {
  return (
    <GameShell>
      <p className="loading" role="status">
        {copy.system.loading}
      </p>
    </GameShell>
  );
}

export function ConnectionScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <GameShell>
      <div className="centered">
        <SystemMessage
          message={copy.system.connection}
          action={
            <Button variant="secondary" onClick={onRetry}>
              {copy.system.retry}
            </Button>
          }
        />
      </div>
    </GameShell>
  );
}
