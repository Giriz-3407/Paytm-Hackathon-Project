import type { Request, Response } from 'express';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import type { GenerateReportInput, ListReportsQuery } from './reports.schemas';
import { reportsService } from './reports.service';

export const reportsController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await reportsService.list(getValidated<ListReportsQuery>(req, 'query'));
    sendSuccess(res, items, { message: 'Reports retrieved', meta });
  },

  async getById(req: Request, res: Response) {
    const { id } = getValidated<{ id: string }>(req, 'params');
    sendSuccess(res, await reportsService.getById(id), { message: 'Report retrieved' });
  },

  async generate(req: Request, res: Response) {
    const { incidentId } = getValidated<GenerateReportInput>(req, 'body');
    sendSuccess(res, await reportsService.generate(incidentId), {
      status: 201,
      message: 'Report generated',
    });
  },
};
