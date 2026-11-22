import { Router } from 'express';
import { requireWriter } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { reportsController as c } from './reports.controller';
import { generateReportBody, listReportsQuery, reportIdParam } from './reports.schemas';

export const reportsRouter = Router();

reportsRouter.get('/', validate({ query: listReportsQuery }), c.list);
reportsRouter.post('/', requireWriter, validate({ body: generateReportBody }), c.generate);
reportsRouter.get('/:id', validate({ params: reportIdParam }), c.getById);
