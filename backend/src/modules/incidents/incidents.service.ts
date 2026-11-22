import { randomBytes } from 'node:crypto';
import { realtime } from '../../services/realtime.service';
import { AppError } from '../../utils/app-error';
import { buildMeta } from '../../utils/pagination';
import type {
  CreateIncidentInput,
  ListIncidentsQuery,
  UpdateIncidentInput,
} from './incidents.schemas';
import { incidentsRepository } from './incidents.repository';
import { toIncidentDto, type IncidentDto } from './incidents.types';

const newIncidentId = (prefix: string) => `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;

interface CreateOptions {
  /** Defaults to `live`: incidents entered by an analyst or found by ingestion are real records. */
  mode?: 'demo' | 'live';
  idPrefix?: string;
}

export const incidentsService = {
  async list(query: ListIncidentsQuery) {
    const { items, total } = await incidentsRepository.list(query);
    return { items: items.map(toIncidentDto), meta: buildMeta(query, total) };
  },

  async getById(id: string): Promise<IncidentDto> {
    const row = await incidentsRepository.findById(id);
    if (!row) throw AppError.notFound(`Incident ${id} not found`);
    return toIncidentDto(row);
  },

  async create(input: CreateIncidentInput, options: CreateOptions = {}): Promise<IncidentDto> {
    const now = new Date();
    const row = await incidentsRepository.create({
      id: newIncidentId(options.idPrefix ?? 'CL'),
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      evidenceStatus: input.evidenceStatus,
      lifecycleStatus: input.lifecycleStatus,
      city: input.location.city,
      state: input.location.state,
      district: input.location.district,
      latitude: input.coordinates[0],
      longitude: input.coordinates[1],
      summary: input.summary,
      firstDetectedAt: input.firstDetectedAt ? new Date(input.firstDetectedAt) : now,
      lastUpdatedAt: now,
      mode: options.mode ?? 'live',
    });
    const dto = toIncidentDto(row);
    realtime.incidentCreated(dto);
    return dto;
  },

  async update(id: string, input: UpdateIncidentInput): Promise<IncidentDto> {
    const existing = await incidentsRepository.findById(id);
    if (!existing) throw AppError.notFound(`Incident ${id} not found`);

    const row = await incidentsRepository.update(id, { ...input, lastUpdatedAt: new Date() });
    const dto = toIncidentDto(row);

    const justResolved =
      input.lifecycleStatus === 'Resolved' && existing.lifecycleStatus !== 'Resolved';
    if (justResolved) realtime.incidentResolved(dto);
    else realtime.incidentUpdated(dto);
    return dto;
  },
};
