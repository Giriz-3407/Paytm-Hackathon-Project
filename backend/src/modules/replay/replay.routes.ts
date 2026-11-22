import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { replayController as c } from './replay.controller';
import { getScenarioQuery, scenarioIdParam } from './replay.schemas';

export const replayRouter = Router();

replayRouter.get('/scenarios', c.listScenarios);
replayRouter.get(
  '/scenarios/:id',
  validate({ params: scenarioIdParam, query: getScenarioQuery }),
  c.getScenario,
);
