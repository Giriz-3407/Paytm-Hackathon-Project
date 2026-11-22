import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/jwt';

/** Requires `Authorization: Bearer <jwt>` and exposes the caller as `req.user`. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  const [scheme, token] = header?.split(' ') ?? [];
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(AppError.unauthorized());
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
};
