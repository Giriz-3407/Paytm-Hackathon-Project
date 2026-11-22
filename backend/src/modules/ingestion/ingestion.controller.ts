import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { getValidated } from '../../middleware/validate';
import { sendSuccess } from '../../utils/api-response';
import type { RunIngestionInput } from './ingestion.schemas';
import { DEFAULT_QUERIES, ingestionService } from './ingestion.service';

export const ingestionController = {
  async run(req: Request, res: Response) {
    const { queries } = getValidated<RunIngestionInput>(req, 'body');
    const summary = await ingestionService.run(queries);
    sendSuccess(res, summary, { message: 'Ingestion run completed' });
  },

  status(_req: Request, res: Response) {
    sendSuccess(
      res,
      {
        configured: Boolean(env.SERPAPI_API_KEY),
        running: ingestionService.isRunning(),
        pollMinutes: env.SERPAPI_POLL_MINUTES,
        defaultQueries: DEFAULT_QUERIES,
      },
      { message: 'Ingestion status' },
    );
  },
};
