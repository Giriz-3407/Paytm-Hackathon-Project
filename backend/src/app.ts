import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { API_PREFIX } from './constants';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { globalRateLimiter } from './middleware/rate-limit';
import { requestLogger } from './middleware/request-logger';
import { apiRouter } from './routes';
import { AppError } from './utils/app-error';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Needed for correct client IPs (rate limiting) when behind a reverse proxy.
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestLogger);
  // This is an API consumed from another origin (the frontend), so the default
  // `Cross-Origin-Resource-Policy: same-origin` would be wrong; CORS below is the real gate.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (curl, server-to-server) are not browser CORS requests.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(new AppError(403, `Origin ${origin} is not allowed by CORS`, 'CORS_ORIGIN_DENIED'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(globalRateLimiter);
  app.use(express.json({ limit: '100kb' }));

  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
