import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { buildFailure } from '../utils/api-response';

const create = (limit: number, message: string, windowMs: number = env.RATE_LIMIT_WINDOW_MS) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      const requestId = typeof req.id === 'string' ? req.id : undefined;
      res.status(429).json(buildFailure(message, 'RATE_LIMITED', undefined, requestId));
    },
  });

/** Applied to the whole API. */
export const globalRateLimiter = create(
  env.RATE_LIMIT_MAX,
  'Too many requests. Please try again later.',
);

/** Stricter limiter for credential endpoints to slow brute-force attempts. */
export const authRateLimiter = create(
  env.AUTH_RATE_LIMIT_MAX,
  'Too many authentication attempts. Please try again later.',
);

/** Map place search proxies the shared OpenStreetMap geocoder, so keep it to a human pace. */
export const geocodeRateLimiter = create(30, 'Too many place searches. Please wait a moment.', 60_000);
