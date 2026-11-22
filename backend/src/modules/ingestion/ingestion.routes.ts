import { Router } from 'express';
import { requireWriter } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ingestionController as c } from './ingestion.controller';
import { runIngestionBody } from './ingestion.schemas';

export const ingestionRouter = Router();

// Running ingestion spends paid SerpApi quota, so it always requires an ADMIN/ANALYST token.
ingestionRouter.get('/status', requireWriter, c.status);
ingestionRouter.post('/run', requireWriter, validate({ body: runIngestionBody.default({}) }), c.run);
