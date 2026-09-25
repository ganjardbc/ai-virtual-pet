import type { ChatRequest, ChatTurnResult } from '@ai-virtual-pet/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, chatApi } from './client';
import { petQueryKey, storeSnapshot } from './pet-queries';

export const chatHistoryQueryKey = ['chat-history'] as const;

/** Visible conversation (latest 50, oldest first). Loaded only while the Talk view is open. */
export function useChatHistory(enabled: boolean) {
  return useQuery({
    queryKey: chatHistoryQueryKey,
    queryFn: chatApi.history,
    enabled,
    retry: 1,
  });
}

export function useSendChat() {
  const queryClient = useQueryClient();

  return useMutation<ChatTurnResult, Error, ChatRequest>({
    mutationFn: chatApi.send,
    onSuccess: async (result) => {
      storeSnapshot(queryClient, result.pet);
      // Wait for the stored turn so the pending message never blinks out before it reappears.
      await queryClient.invalidateQueries({ queryKey: chatHistoryQueryKey });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // The pet may have fallen asleep or changed: refresh the authoritative snapshot.
        void queryClient.invalidateQueries({ queryKey: petQueryKey });
      }
    },
  });
}
