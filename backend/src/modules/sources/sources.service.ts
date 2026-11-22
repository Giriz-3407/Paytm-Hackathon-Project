import { realtime } from '../../services/realtime.service';
import { AppError } from '../../utils/app-error';
import { sourcesRepository } from './sources.repository';
import { toSourceDto, type SourceDto } from './sources.types';

export const sourcesService = {
  async list(): Promise<SourceDto[]> {
    return (await sourcesRepository.list()).map(toSourceDto);
  },

  /** Called by the ingestion pipeline after each collection attempt. */
  async recordCollection(
    id: string,
    outcome: { ok: boolean; partial: boolean; error: string | null },
  ): Promise<SourceDto | null> {
    if (!(await sourcesRepository.findById(id))) return null;
    const now = new Date();
    const row = await sourcesRepository.recordRun(id, {
      lastAttempt: now,
      ...(outcome.ok && { lastSync: now }),
      status: outcome.ok ? (outcome.partial ? 'Delayed' : 'Healthy') : 'Offline',
      error: outcome.error,
    });
    const dto = toSourceDto(row);
    realtime.sourceHealth(dto);
    return dto;
  },

  async setEnabled(id: string, enabled: boolean): Promise<SourceDto> {
    if (!(await sourcesRepository.findById(id))) throw AppError.notFound(`Source ${id} not found`);
    const dto = toSourceDto(await sourcesRepository.setEnabled(id, enabled));
    realtime.sourceHealth(dto);
    return dto;
  },
};
