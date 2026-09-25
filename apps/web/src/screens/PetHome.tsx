import type { ActionType, PetSnapshot } from '@ai-virtual-pet/contracts';
import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client';
import { usePetAction } from '../api/pet-queries';
import { ActionButton, FeedIcon, PlayIcon, SleepIcon, TalkIcon } from '../components/ActionButton';
import { GameShell } from '../components/GameShell';
import { Habitat } from '../components/Habitat';
import { PetCharacter } from '../components/PetCharacter';
import { ReactionBubble } from '../components/ReactionBubble';
import { RecapCard } from '../components/RecapCard';
import { StatusList } from '../components/StatusList';
import { SystemMessage } from '../components/SystemMessage';
import {
  RECOVERING_TEXT,
  activityText,
  copy,
  energyText,
  fullnessText,
  moodText,
} from '../presentation/copy';
import { idleReaction, reactionForAction, returnReaction, type Reaction } from '../presentation/reactions';
import { MEANINGFUL_ABSENCE_MS, recapItems } from '../presentation/recap';
import { timeOfDay } from '../presentation/time-of-day';
import { visualFromSnapshot } from '../presentation/visual';

const ACTION_REACTION_MS = 1_800;
const ACTION_LOCK_MS = 700;
const RETURN_GREETING_MS = 6_000;

interface ReturnPresentation {
  /** Whether the greeting is still showing; its words follow the current snapshot. */
  readonly greeting: boolean;
  readonly items: readonly string[];
}

function readLastSeen(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLastSeen(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); return detection then works per session only.
  }
}

/**
 * Detects a meaningful gap in the pet's simulated time since this browser last saw it
 * (a reload after hours away, or debug time travel) and prepares a greeting and recap.
 */
function useReturnPresentation(snapshot: PetSnapshot) {
  const storageKey = `ai-virtual-pet:last-seen:${snapshot.pet.id}`;
  const lastSeen = useRef<string | null>(readLastSeen(storageKey));
  const [presentation, setPresentation] = useState<ReturnPresentation | null>(null);
  const simulatedAt = snapshot.state.lastSimulatedAt;

  useEffect(() => {
    const previous = lastSeen.current;

    if (previous && Date.parse(simulatedAt) - Date.parse(previous) >= MEANINGFUL_ABSENCE_MS) {
      setPresentation({ greeting: true, items: recapItems(snapshot.recentEvents, previous) });
    }

    lastSeen.current = simulatedAt;
    writeLastSeen(storageKey, simulatedAt);
    // Only a new simulated moment is a potential return.
  }, [simulatedAt, storageKey]);

  useEffect(() => {
    if (!presentation?.greeting) {
      return;
    }

    const timer = setTimeout(
      () => setPresentation((current) => (current ? { ...current, greeting: false } : current)),
      RETURN_GREETING_MS,
    );
    return () => clearTimeout(timer);
  }, [presentation]);

  return { presentation, dismiss: () => setPresentation(null) };
}

interface PetHomeProps {
  readonly snapshot: PetSnapshot;
  /** Opens the Talk view. */
  readonly onTalk?: () => void;
}

export function PetHome({ snapshot, onTalk }: PetHomeProps) {
  const action = usePetAction();
  const [actionReaction, setActionReaction] = useState<Reaction | null>(null);
  const [locked, setLocked] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<ActionType | null>(null);
  const returning = useReturnPresentation(snapshot);

  useEffect(() => {
    if (!actionReaction) {
      return;
    }

    const lockTimer = setTimeout(() => setLocked(false), ACTION_LOCK_MS);
    const reactionTimer = setTimeout(() => setActionReaction(null), ACTION_REACTION_MS);
    return () => {
      clearTimeout(lockTimer);
      clearTimeout(reactionTimer);
    };
  }, [actionReaction]);

  const name = snapshot.pet.name ?? '';
  const sleeping = snapshot.state.currentActivity === 'SLEEPING';
  const busy = action.isPending || locked;

  // Priority: action reaction > return greeting > important state / activity / mood.
  const greeting = returning.presentation?.greeting ? returnReaction(snapshot) : null;
  const reaction = actionReaction ?? greeting ?? idleReaction(snapshot);
  const visual = actionReaction?.visual ?? visualFromSnapshot(snapshot);
  const narration = activityText[snapshot.state.currentActivity];

  const act = (type: ActionType) => {
    setSystemError(null);
    returning.dismiss();
    setPendingType(type);
    action.mutate(type, {
      onSuccess: (result) => {
        setLocked(true);
        setActionReaction(reactionForAction(result));
      },
      onError: (error) => {
        // Technical failure: System Voice only, never a fake pet reaction.
        setSystemError(
          error instanceof ApiError && error.code === 'PET_STATE_CONFLICT'
            ? copy.system.conflict
            : copy.system.actionFailed,
        );
      },
      onSettled: () => setPendingType(null),
    });
  };

  const sleepingHint = sleeping ? copy.actions.sleepingHint(name) : undefined;

  return (
    <GameShell title={name}>
      <Habitat
        timeOfDay={timeOfDay(snapshot.state.lastSimulatedAt)}
        pose={visual.pose}
        reaction={<ReactionBubble reaction={reaction} />}
      >
        <PetCharacter
          expression={visual.expression}
          motion={visual.motion}
          label={`${name}, ${narration ?? moodText[snapshot.derived.mood].toLowerCase()}`}
        />
      </Habitat>

      {returning.presentation && returning.presentation.items.length > 0 && (
        <RecapCard items={returning.presentation.items} onDismiss={returning.dismiss} />
      )}

      <div className="actions" role="group" aria-label={copy.actions.group}>
        <ActionButton
          icon={<FeedIcon />}
          label={copy.actions.feed}
          onClick={() => act('FEED')}
          disabled={busy || sleeping}
          busy={pendingType === 'FEED'}
          hint={sleepingHint}
        />
        <ActionButton
          icon={<PlayIcon />}
          label={copy.actions.play}
          onClick={() => act('PLAY')}
          disabled={busy || sleeping}
          busy={pendingType === 'PLAY'}
          hint={sleepingHint}
        />
        <ActionButton
          icon={<TalkIcon />}
          label={copy.actions.talk}
          onClick={() => onTalk?.()}
          disabled={busy || sleeping || !onTalk}
          hint={sleepingHint}
        />
        <ActionButton
          icon={<SleepIcon />}
          label={sleeping ? copy.actions.sleeping : copy.actions.sleep}
          onClick={() => act('SLEEP')}
          disabled={busy || sleeping}
          busy={pendingType === 'SLEEP'}
          active={sleeping}
        />
      </div>

      <StatusList
        title={copy.status.title}
        rows={[
          { label: copy.status.fullness, value: fullnessText[snapshot.derived.needs.fullness] },
          {
            label: copy.status.energy,
            value: sleeping ? RECOVERING_TEXT : energyText[snapshot.derived.needs.energy],
          },
          { label: copy.status.mood, value: moodText[snapshot.derived.mood] },
        ]}
      />

      {systemError && <SystemMessage message={systemError} />}
    </GameShell>
  );
}
