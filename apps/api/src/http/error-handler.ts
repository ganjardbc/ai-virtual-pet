import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { ApplicationError } from '../application/errors.js';
import { sendError } from './envelope.js';

/**
 * Maps failures to the API error model so clients can tell "the request was wrong" or
 * "the pet is in the wrong lifecycle stage" apart from "the server broke".
 * Domain rejections (e.g. TOO_TIRED) never reach here: they are successful responses.
 */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof ApplicationError) {
      return sendError(request, reply, error.code, error.message, error.details);
    }

    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
      return sendError(request, reply, 'VALIDATION_ERROR', 'Request is invalid.', { issues });
    }

    // Fastify's own request errors (malformed JSON, unsupported media type, body too large).
    const statusCode = 'statusCode' in error ? error.statusCode : undefined;

    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      return sendError(request, reply, 'VALIDATION_ERROR', error.message);
    }

    request.log.error({ err: error }, 'Unhandled request failure');
    return sendError(request, reply, 'INTERNAL_ERROR', 'Something went wrong on the server.');
  });

  app.setNotFoundHandler((request, reply) =>
    sendError(request, reply, 'NOT_FOUND', `Route ${request.method} ${request.url} does not exist.`),
  );
}
