import type { DebugAi, DebugSetPersonalityRequest, DebugState } from '@ai-virtual-pet/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { ApiError } from '../api/client';
import { petQueryKey, storeSnapshot, usePet } from '../api/pet-queries';
import { aiQueryKey, debugApi, debugQueryKey } from './debug-api';
import { DebugPanelView, type DebugViewStatus } from './DebugPanelView';
import type { AdvancePreset, DebugStat } from './format';
import './debug.css';

type DebugCommand =
  | { kind: 'advance'; preset: AdvancePreset }
  | { kind: 'sleep' }
  | { kind: 'wake' }
  | { kind: 'set'; stat: DebugStat; value: number }
  | { kind: 'set-personality'; body: DebugSetPersonalityRequest }
  | { kind: 'reset' };

function statusOf(error: unknown): DebugViewStatus {
  if (error instanceof ApiError && error.code === 'PET_NOT_FOUND') return 'no-pet';
  if (error instanceof ApiError && error.code === 'NOT_FOUND') return 'disabled';
  return 'error';
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? `${error.code}: ${error.message}` : 'Debug request failed.';
}

/** Loads debug data and runs debug commands; every result also refreshes the player's view of the pet. */
export default function DebugPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const pet = usePet();
  const debug = useQuery({ queryKey: debugQueryKey, queryFn: debugApi.state, retry: false });
  const ai = useQuery({ queryKey: aiQueryKey, queryFn: debugApi.ai, retry: false });
  const [feedback, setFeedback] = useState<string | null>(null);

  // Player actions change the pet: keep the raw view in step.
  const petVersion = pet.data?.pet.version;
  const petSimulatedAt = pet.data?.state.lastSimulatedAt;
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: debugQueryKey });
    void queryClient.invalidateQueries({ queryKey: aiQueryKey });
  }, [petVersion, petSimulatedAt, queryClient]);

  const apply = (state: DebugState) => {
    queryClient.setQueryData(debugQueryKey, state);
    storeSnapshot(queryClient, state.pet);
  };

  const applyAi = (next: DebugAi) => {
    queryClient.setQueryData(aiQueryKey, next);
  };

  const command = useMutation({
    mutationFn: async (input: DebugCommand): Promise<string> => {
      switch (input.kind) {
        case 'advance': {
          apply(await debugApi.advance(input.preset.request));
          return input.preset.done;
        }
        case 'sleep':
        case 'wake': {
          const result = await (input.kind === 'sleep' ? debugApi.sleep() : debugApi.wake());
          apply(result.state);
          return result.status === 'SUCCESS'
            ? input.kind === 'sleep' ? 'Pet is asleep' : 'Pet is awake'
            : `Rejected: ${result.reason}`;
        }
        case 'set': {
          apply(await debugApi.setState({ [input.stat]: input.value }));
          return `Set ${input.stat} to ${input.value}`;
        }
        case 'set-personality': {
          applyAi(await debugApi.setPersonality(input.body));
          // A set runs through the normal simulate/save flow, so the raw view may have moved too.
          await queryClient.invalidateQueries({ queryKey: debugQueryKey });
          return 'Personality set';
        }
        case 'reset': {
          await debugApi.reset();
          queryClient.setQueryData(petQueryKey, null);
          queryClient.removeQueries({ queryKey: debugQueryKey });
          queryClient.removeQueries({ queryKey: aiQueryKey });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: debugQueryKey }),
            queryClient.invalidateQueries({ queryKey: aiQueryKey }),
          ]);
          return 'Pet reset';
        }
      }
    },
    onMutate: () => setFeedback(null),
    onSuccess: setFeedback,
    onError: (error) => setFeedback(describeError(error)),
  });

  const status: DebugViewStatus = debug.data ? 'ready' : debug.isError ? statusOf(debug.error) : 'loading';

  return (
    <DebugPanelView
      status={status}
      state={debug.data}
      ai={ai.data}
      feedback={feedback}
      busy={command.isPending}
      onClose={onClose}
      onAdvance={(preset) => command.mutate({ kind: 'advance', preset })}
      onSleep={() => command.mutate({ kind: 'sleep' })}
      onWake={() => command.mutate({ kind: 'wake' })}
      onSet={(stat, value) => command.mutate({ kind: 'set', stat, value })}
      onSetPersonality={(body) => command.mutate({ kind: 'set-personality', body })}
      onReset={() => command.mutate({ kind: 'reset' })}
    />
  );
}
