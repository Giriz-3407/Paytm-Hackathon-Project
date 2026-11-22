import type { Request, Response } from 'express';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import type { UpdateSourceInput } from './sources.schemas';
import { sourcesService } from './sources.service';

export const sourcesController = {
  async list(_req: Request, res: Response) {
    sendSuccess(res, await sourcesService.list(), { message: 'Sources retrieved' });
  },

  async setEnabled(req: Request, res: Response) {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const { enabled } = getValidated<UpdateSourceInput>(req, 'body');
    sendSuccess(res, await sourcesService.setEnabled(id, enabled), { message: 'Source updated' });
  },
};
