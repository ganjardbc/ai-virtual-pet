import type { ActionResult, ActionType, PetSnapshot } from '@ai-virtual-pet/contracts';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { ApiError, petApi } from './client';

export const petQueryKey = ['pet'] as const;

/** While the page is open, refresh so auto-wake and autonomous activity appear. */
const LIVE_REFRESH_MS = 60_000;

/**
 * Responses can arrive out of order (a background refresh started before an action may
 * finish after it). Versions only grow, so an older snapshot of the same pet never replaces
 * a newer one. A missing pet (reset) or a different pet always wins.
 */
export function newestSnapshot(
  current: PetSnapshot | null | undefined,
  incoming: PetSnapshot | null,
): PetSnapshot | null {
  if (!incoming || !current || current.pet.id !== incoming.pet.id) {
    return incoming;
  }

  return incoming.pet.version >= current.pet.version ? incoming : current;
}

export function storeSnapshot(queryClient: QueryClient, snapshot: PetSnapshot): void {
  queryClient.setQueryData<PetSnapshot | null>(petQueryKey, (current) => newestSnapshot(current, snapshot));
}

/** Lifecycle or conflict errors mean our view of the pet is stale: reload it. */
function reloadOnApiError(queryClient: QueryClient) {
  return (error: Error) => {
    if (error instanceof ApiError) {
      void queryClient.invalidateQueries({ queryKey: petQueryKey });
    }
  };
}

export function usePet() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: petQueryKey,
    queryFn: async () =>
      newestSnapshot(queryClient.getQueryData<PetSnapshot | null>(petQueryKey), await petApi.get()),
    refetchInterval: LIVE_REFRESH_MS,
    retry: 1,
  });
}

/** Hatches the Egg, creating it first on a brand-new launch. */
export function useHatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!queryClient.getQueryData<PetSnapshot | null>(petQueryKey)) {
        await petApi.create().catch((error: unknown) => {
          if (!(error instanceof ApiError && error.code === 'PET_ALREADY_EXISTS')) {
            throw error;
          }
        });
      }

      return petApi.hatch();
    },
    onSuccess: (result) => storeSnapshot(queryClient, result.pet),
    onError: reloadOnApiError(queryClient),
  });
}

export function useNamePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: petApi.name,
    onSuccess: (snapshot) => storeSnapshot(queryClient, snapshot),
    onError: reloadOnApiError(queryClient),
  });
}

export function usePetAction() {
  const queryClient = useQueryClient();

  return useMutation<ActionResult, Error, ActionType>({
    mutationFn: petApi.act,
    onSuccess: (result) => storeSnapshot(queryClient, result.pet),
    onError: reloadOnApiError(queryClient),
  });
}
