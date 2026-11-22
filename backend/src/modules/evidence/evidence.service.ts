import { randomUUID } from 'node:crypto';
import { realtime } from '../../services/realtime.service';
import { AppError } from '../../utils/app-error';
import { incidentsRepository } from '../incidents/incidents.repository';
import { toIncidentDto } from '../incidents/incidents.types';
import { sourcesRepository } from '../sources/sources.repository';
import { evidenceRepository } from './evidence.repository';
import type { CreateEvidenceInput } from './evidence.schemas';
import { toEvidenceDto, type EvidenceDto } from './evidence.types';

async function assertIncidentExists(incidentId: string) {
  const incident = await incidentsRepository.findById(incidentId);
  if (!incident) throw AppError.notFound(`Incident ${incidentId} not found`);
}

export const evidenceService = {
  async listForIncident(incidentId: string): Promise<EvidenceDto[]> {
    await assertIncidentExists(incidentId);
    const rows = await evidenceRepository.listByIncident(incidentId);
    return rows.map(toEvidenceDto);
  },

  async addToIncident(incidentId: string, input: CreateEvidenceInput): Promise<EvidenceDto> {
    await assertIncidentExists(incidentId);
    if (!(await sourcesRepository.findById(input.sourceId))) {
      throw AppError.badRequest(`Unknown sourceId: ${input.sourceId}`);
    }

    const ingestedAt = new Date();
    const row = await evidenceRepository.createForIncident({
      id: `ev-${randomUUID()}`,
      incidentId,
      sourceId: input.sourceId,
      title: input.title,
      sourceUrl: input.sourceUrl ?? null,
      publishedAt: new Date(input.publishedAt),
      availableAt: input.availableAt ? new Date(input.availableAt) : ingestedAt,
      ingestedAt,
      content: input.content,
      verificationStatus: input.verificationStatus,
    });

    const evidence = toEvidenceDto(row);
    realtime.evidenceAdded(evidence);
    // The incident's source count and last-updated time changed too.
    const incident = await incidentsRepository.findById(incidentId);
    if (incident) realtime.incidentUpdated(toIncidentDto(incident));
    return evidence;
  },
};
