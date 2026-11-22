import { Router } from 'express';
import { requireAuth } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { authRateLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { authController as c } from './auth.controller';
import { loginBody, registerBody, updateRoleBody, userIdParam } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerBody }), c.register);
authRouter.post('/login', authRateLimiter, validate({ body: loginBody }), c.login);
authRouter.get('/me', requireAuth, c.me);
authRouter.patch(
  '/users/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: userIdParam, body: updateRoleBody }),
  c.updateRole,
);
