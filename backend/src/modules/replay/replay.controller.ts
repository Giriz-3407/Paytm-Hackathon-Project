import type { Request, Response } from 'express';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import type { GetScenarioQuery } from './replay.schemas';
import { replayService } from './replay.service';

export const replayController = {
  async listScenarios(_req: Request, res: Response) {
    sendSuccess(res, await replayService.listScenarios(), { message: 'Replay scenarios retrieved' });
  },

  async getScenario(req: Request, res: Response) {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const { asOf } = getValidated<GetScenarioQuery>(req, 'query');
    sendSuccess(res, await replayService.getScenario(id, asOf), {
      message: 'Replay scenario retrieved',
    });
  },
};
