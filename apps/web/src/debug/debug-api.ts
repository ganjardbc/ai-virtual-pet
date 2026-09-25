import {
  debugAdvanceTimeResultSchema,
  debugAiSchema,
  debugCommandResultSchema,
  debugResetResultSchema,
  debugStateSchema,
  type DebugAdvanceTimeRequest,
  type DebugAdvanceTimeResult,
  type DebugAi,
  type DebugCommandResult,
  type DebugSetPersonalityRequest,
  type DebugSetStateRequest,
  type DebugState,
} from '@ai-virtual-pet/contracts';

import { request } from '../api/client';

export const debugQueryKey = ['debug-state'] as const;
export const aiQueryKey = ['debug-ai'] as const;

/** Development-only endpoints (see Phase 5 and Phase 10). */
export const debugApi = {
  state: (): Promise<DebugState> => request('GET', '/debug/pet/state', debugStateSchema),
  ai: (): Promise<DebugAi> => request('GET', '/debug/ai', debugAiSchema),
  advance: (body: DebugAdvanceTimeRequest): Promise<DebugAdvanceTimeResult> =>
    request('POST', '/debug/time/advance', debugAdvanceTimeResultSchema, body),
  sleep: (): Promise<DebugCommandResult> => request('POST', '/debug/pet/sleep', debugCommandResultSchema),
  wake: (): Promise<DebugCommandResult> => request('POST', '/debug/pet/wake', debugCommandResultSchema),
  setState: (body: DebugSetStateRequest): Promise<DebugState> =>
    request('PATCH', '/debug/pet/state', debugStateSchema, body),
  setPersonality: (body: DebugSetPersonalityRequest): Promise<DebugAi> =>
    request('PATCH', '/debug/personality', debugAiSchema, body),
  reset: () => request('POST', '/debug/pet/reset', debugResetResultSchema),
};
