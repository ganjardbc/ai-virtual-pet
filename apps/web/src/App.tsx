import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react';

import { usePet, useHatch, useNamePet } from './api/pet-queries';
import { Button } from './components/Button';
import { ShellCornerContext } from './components/GameShell';
import { copy } from './presentation/copy';
import { EggScreen } from './screens/EggScreen';
import { NamingScreen } from './screens/NamingScreen';
import { ConversationScreen } from './screens/ConversationScreen';
import { PetHome } from './screens/PetHome';
import { ConnectionScreen, LoadingScreen } from './screens/StatusScreens';

/** Long enough to feel like a moment, short enough not to feel like loading. */
const HATCH_MIN_MS = 2_800;
const NAMING_CELEBRATION_MS = 1_600;

/**
 * The Debug entry mirrors the server's debug API flag (ENABLE_DEBUG_API, injected by Vite as
 * VITE_ENABLE_DEBUG_API). It is absent unless the server actually exposes debug routes, and the
 * dead branch keeps the lazy debug chunk out of builds that do not enable it.
 */
const DEBUG_UI_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_API === 'true';
const DebugPanel = DEBUG_UI_ENABLED ? lazy(() => import('./debug/DebugPanel')) : null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function App() {
  const [debugOpen, setDebugOpen] = useState(false);

  const corner = DebugPanel ? (
    <Button
      variant="ghost"
      className="debug-toggle"
      aria-expanded={debugOpen}
      onClick={() => setDebugOpen((open) => !open)}
    >
      Debug
    </Button>
  ) : null;

  return (
    <ShellCornerContext.Provider value={corner}>
      <div className={debugOpen ? 'app app--debug-open' : 'app'}>
        <GameScreens />
        {DebugPanel && debugOpen && (
          <Suspense fallback={null}>
            <DebugPanel onClose={() => setDebugOpen(false)} />
          </Suspense>
        )}
      </div>
    </ShellCornerContext.Provider>
  );
}

/** Screen follows authoritative server state (wireframe §85); only presentation timing is local. */
function GameScreens(): ReactNode {
  const pet = usePet();
  const hatch = useHatch();
  const namePet = useNamePet();
  const [hatching, setHatching] = useState(false);
  const [hatchError, setHatchError] = useState<string | null>(null);
  const [celebratingName, setCelebratingName] = useState<string | null>(null);
  const [talking, setTalking] = useState(false);
  const openTalk = useCallback(() => setTalking(true), []);
  const closeTalk = useCallback(() => setTalking(false), []);

  if (pet.isPending) {
    return <LoadingScreen />;
  }

  if (pet.isError && pet.data === undefined) {
    return <ConnectionScreen onRetry={() => void pet.refetch()} />;
  }

  const snapshot = pet.data ?? null;

  const startHatch = async () => {
    setHatching(true);
    setHatchError(null);

    try {
      await Promise.all([hatch.mutateAsync(), wait(HATCH_MIN_MS)]);
    } catch {
      setHatchError(copy.system.actionFailed);
    } finally {
      setHatching(false);
    }
  };

  if (hatching || !snapshot || snapshot.pet.stage === 'EGG') {
    if (talking) {
      // A debug reset back to an Egg must not reopen Talk after the next hatch.
      setTalking(false);
    }

    return <EggScreen hatching={hatching} onHatch={() => void startHatch()} error={hatchError} />;
  }

  if (!snapshot.pet.name || celebratingName) {
    return (
      <NamingScreen
        celebratingName={celebratingName}
        onSubmit={async (name) => {
          const named = await namePet.mutateAsync(name);
          setCelebratingName(named.pet.name);
          void wait(NAMING_CELEBRATION_MS).then(() => setCelebratingName(null));
        }}
      />
    );
  }

  // Talk is a view over the same authoritative pet; leaving it keeps the conversation (Task 9.11).
  // If the pet falls asleep, the Talk view shows the good-night reply and then closes itself.
  if (talking) {
    return <ConversationScreen key={snapshot.pet.id} snapshot={snapshot} onBack={closeTalk} />;
  }

  return <PetHome key={snapshot.pet.id} snapshot={snapshot} onTalk={openTalk} />;
}
