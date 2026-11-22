import { Router, type RequestHandler } from 'express';
import { env } from '../../config/env';
import { requireWriter } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { sourceIdParam, updateSourceBody } from './sources.schemas';
import { sourcesController as c } from './sources.controller';

export const sourcesRouter = Router();

/**
 * The current frontend has no login, so its enable/disable switch sends no token.
 * ALLOW_ANONYMOUS_SOURCE_TOGGLE lets that work in local development; it is rejected
 * at startup when NODE_ENV=production (see config/env.ts).
 */
const writeGuard: RequestHandler[] = env.ALLOW_ANONYMOUS_SOURCE_TOGGLE ? [] : requireWriter;

sourcesRouter.get('/', c.list);
sourcesRouter.patch(
  '/:id',
  ...writeGuard,
  validate({ params: sourceIdParam, body: updateSourceBody }),
  c.setEnabled,
);
