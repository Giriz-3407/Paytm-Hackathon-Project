import { Router } from 'express';
import { requireWriter } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createEvidenceBody } from '../evidence/evidence.schemas';
import { incidentsController as c } from './incidents.controller';
import {
  createIncidentBody,
  idParam,
  listIncidentsQuery,
  updateIncidentBody,
} from './incidents.schemas';

export const incidentsRouter = Router();

// Reads are public: the dashboard has no login. Writes require an ADMIN or ANALYST token.
incidentsRouter.get('/', validate({ query: listIncidentsQuery }), c.list);
incidentsRouter.post('/', requireWriter, validate({ body: createIncidentBody }), c.create);

incidentsRouter.get('/:id', validate({ params: idParam }), c.getById);
incidentsRouter.patch(
  '/:id',
  requireWriter,
  validate({ params: idParam, body: updateIncidentBody }),
  c.update,
);

incidentsRouter.get('/:id/evidence', validate({ params: idParam }), c.listEvidence);
incidentsRouter.post(
  '/:id/evidence',
  requireWriter,
  validate({ params: idParam, body: createEvidenceBody }),
  c.addEvidence,
);
