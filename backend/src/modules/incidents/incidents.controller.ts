import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { getValidated } from '../../middleware/validate';
import { evidenceService } from '../evidence/evidence.service';
import type { CreateEvidenceInput } from '../evidence/evidence.schemas';
import type {
  CreateIncidentInput,
  ListIncidentsQuery,
  UpdateIncidentInput,
} from './incidents.schemas';
import { incidentsService } from './incidents.service';

const idOf = (req: Request) => getValidated<{ id: string }>(req, 'params').id;

export const incidentsController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await incidentsService.list(
      getValidated<ListIncidentsQuery>(req, 'query'),
    );
    sendSuccess(res, items, { message: 'Incidents retrieved', meta });
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await incidentsService.getById(idOf(req)), { message: 'Incident retrieved' });
  },

  async create(req: Request, res: Response) {
    const incident = await incidentsService.create(getValidated<CreateIncidentInput>(req, 'body'));
    sendSuccess(res, incident, { status: 201, message: 'Incident created' });
  },

  async update(req: Request, res: Response) {
    const incident = await incidentsService.update(
      idOf(req),
      getValidated<UpdateIncidentInput>(req, 'body'),
    );
    sendSuccess(res, incident, { message: 'Incident updated' });
  },

  async listEvidence(req: Request, res: Response) {
    sendSuccess(res, await evidenceService.listForIncident(idOf(req)), {
      message: 'Evidence retrieved',
    });
  },

  async addEvidence(req: Request, res: Response) {
    const evidence = await evidenceService.addToIncident(
      idOf(req),
      getValidated<CreateEvidenceInput>(req, 'body'),
    );
    sendSuccess(res, evidence, { status: 201, message: 'Evidence added' });
  },
};
