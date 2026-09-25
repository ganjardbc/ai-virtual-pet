import { API_ERROR_STATUS, type ApiErrorCode, type ApiErrorEnvelope } from '@ai-virtual-pet/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

export function ok<T>(request: FastifyRequest, data: T): { data: T; meta: { requestId: string } } {
  return { data, meta: { requestId: request.id } };
}

export function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): FastifyReply {
  const body: ApiErrorEnvelope = {
    error: details === undefined ? { code, message } : { code, message, details },
    meta: { requestId: request.id },
  };

  return reply.code(API_ERROR_STATUS[code]).send(body);
}
