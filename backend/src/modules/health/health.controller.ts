import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { healthService } from './health.service';

export const healthController = {
  async check(_req: Request, res: Response) {
    const report = await healthService.check();
    const healthy = report.status === 'ok';
    // 503 lets load balancers and orchestrators stop routing to an instance with no database.
    sendSuccess(res, report, {
      status: healthy ? 200 : 503,
      message: healthy ? 'Service is healthy' : 'Service is degraded',
    });
  },
};
