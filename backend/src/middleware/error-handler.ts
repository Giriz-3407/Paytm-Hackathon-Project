import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';
import { buildFailure } from '../utils/api-response';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
};

/** Translates known low-level errors into client-safe AppErrors. */
function normalise(error: unknown): AppError | null {
  if (error instanceof AppError) return error;

  // body-parser (malformed JSON, payload too large)
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const type = (error as { type: unknown }).type;
    if (type === 'entity.parse.failed') return AppError.badRequest('Request body is not valid JSON');
    if (type === 'entity.too.large') return new AppError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return AppError.conflict('A record with the same unique value already exists');
      case 'P2003':
        return AppError.badRequest('A referenced record does not exist');
      case 'P2025':
        return AppError.notFound('Record not found');
      case 'P1001':
      case 'P1002':
      case 'P1017':
        return new AppError(503, 'Database is temporarily unavailable', 'DATABASE_UNAVAILABLE');
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(503, 'Database is temporarily unavailable', 'DATABASE_UNAVAILABLE');
  }
  return null;
}

// Express identifies error handlers by their 4-argument signature, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const known = normalise(error);
  const requestId = typeof req.id === 'string' ? req.id : undefined;

  if (known) {
    if (known.statusCode >= 500) logger.error({ err: error, requestId }, known.message);
    return res
      .status(known.statusCode)
      .json(buildFailure(known.message, known.code, known.details, requestId));
  }

  // Unknown failure: log everything server-side, reveal nothing to the client.
  logger.error({ err: error, requestId, method: req.method, url: req.originalUrl }, 'Unhandled error');
  return res
    .status(500)
    .json(buildFailure('Internal server error', 'INTERNAL_ERROR', undefined, requestId));
};
