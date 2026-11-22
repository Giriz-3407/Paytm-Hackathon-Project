import type { Request, Response } from 'express';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import { AppError } from '../../utils/app-error';
import type { LoginInput, RegisterInput, UpdateRoleInput } from './auth.schemas';
import { authService } from './auth.service';

/** `requireAuth` guarantees `req.user`; this narrows the type without a non-null assertion. */
const actor = (req: Request) => {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
};

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(getValidated<RegisterInput>(req, 'body'));
    sendSuccess(res, result, { status: 201, message: 'Account created' });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(getValidated<LoginInput>(req, 'body'));
    sendSuccess(res, result, { message: 'Logged in' });
  },

  async me(req: Request, res: Response) {
    sendSuccess(res, await authService.me(actor(req).id), { message: 'Profile retrieved' });
  },

  async updateRole(req: Request, res: Response) {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const user = await authService.updateRole(
      actor(req).id,
      id,
      getValidated<UpdateRoleInput>(req, 'body'),
    );
    sendSuccess(res, user, { message: 'User role updated' });
  },
};
