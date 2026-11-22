import type { RequestHandler } from 'express';
import type { TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { requireAuth } from './authenticate';

/** Must run after `requireAuth`. */
export const requireRole =
  (...roles: TokenPayload['role'][]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };

/** Authenticated users allowed to change data (everything except read-only viewers). */
export const requireWriter: RequestHandler[] = [requireAuth, requireRole('ADMIN', 'ANALYST')];
